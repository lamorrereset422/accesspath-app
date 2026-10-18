// This code runs on Netlify's servers, not in the visitor's browser.
// It's the only place allowed to know your Stripe SECRET key.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://obylhtfhlioplwscecfs.supabase.co";
// Publishable key: public by design (also in the browser app).
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_kTNhvFU_MUYaE_lSEXmqTQ_pte5rOAT";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Map internal plan IDs to Stripe Price IDs.
const PRICE_IDS = {
  complete: "price_1U3Paf72BfjzdmTjNjFrAQct",
  contractor: "price_1U3Paa72BfjzdmTjhjInQZjF",
};

// Tier order: free < complete < contractor. Used to refuse checkouts that
// would not raise the user's plan.
const TIER_RANK = { free: 0, complete: 1, contractor: 2 };

// Read a stored plan in either format: a JSON string such as "free", or an
// object with planId. Returns null if unreadable or unrecognized (fail closed).
function storedPlanRank(rawValue) {
  try {
    const parsed = JSON.parse(rawValue);
    const planId = typeof parsed === "string" ? parsed : parsed && parsed.planId;
    return Object.prototype.hasOwnProperty.call(TIER_RANK, planId) ? TIER_RANK[planId] : null;
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const authorization = event.headers.authorization || event.headers.Authorization || "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: "Please sign in again." }) };
    }

    const { planId } = JSON.parse(event.body || "{}");

    const priceId = Object.prototype.hasOwnProperty.call(PRICE_IDS, planId) ? PRICE_IDS[planId] : null;
    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Unknown plan" }) };
    }
    // Read the user's current plan with their own sign-in, so the database's
    // security rules apply. No plan row means Free.
    const userDb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: planRow, error: planError } = await userDb
      .from("accesspath_storage")
      .select("value")
      .eq("user_id", user.id)
      .eq("key", "accesspath:plan")
      .maybeSingle();

    if (planError) {
      console.error("create-checkout plan read error:", planError.message);
      return { statusCode: 503, body: JSON.stringify({ error: "We couldn't check your current plan. Please try again." }) };
    }

    // Fail closed: if the stored plan can't be read, don't start a checkout.
    const currentRank = planRow ? storedPlanRank(planRow.value) : TIER_RANK.free;
    if (currentRank === null) {
      console.error(`create-checkout: unreadable stored plan for user ${user.id}`);
      return { statusCode: 503, body: JSON.stringify({ error: "We couldn't check your current plan. Please contact hello.accesspath@outlook.com." }) };
    }

    // Refuse checkouts that would not raise the plan (same tier or lower).
    if (TIER_RANK[planId] <= currentRank) {
      return { statusCode: 409, body: JSON.stringify({ error: "Your current plan already includes this.", code: "already_has_plan" }) };
    }

    const siteUrl = process.env.URL || "https://accesspath-app.netlify.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { userId: user.id, planId },
      success_url: `${siteUrl}/?checkout=success&plan=${planId}`,
      cancel_url: `${siteUrl}/?checkout=cancelled`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("create-checkout error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong creating checkout." }),
    };
  }
};

// This code runs on Netlify's servers, not in the visitor's browser.
// It's the only place allowed to know your Stripe SECRET key.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://obylhtfhlioplwscecfs.supabase.co",
  "sb_publishable_kTNhvFU_MUYaE_lSEXmqTQ_pte5rOAT"
);

// Map internal plan IDs to Stripe Price IDs.
const PRICE_IDS = {
  complete: "price_1U3Paf72BfjzdmTjNjFrAQct",
  contractor: "price_1U3Paa72BfjzdmTjhjInQZjF",
};

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

    const priceId = PRICE_IDS[planId];
    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Unknown plan" }) };
    }

    const siteUrl = process.env.URL || "https://accesspath-app.netlify.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { userId: user.id, planId },
      success_url: `${siteUrl}/?checkout=success`,
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

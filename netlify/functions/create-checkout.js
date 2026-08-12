// This code runs on Netlify's servers, not in the visitor's browser.
// It's the only place allowed to know your Stripe SECRET key.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Map our internal plan IDs to the Stripe Price IDs we'll create in Step 4.
// (We'll fill these two in together in the next step.)
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
    const { planId, userId, userEmail } = JSON.parse(event.body);

    const priceId = PRICE_IDS[planId];
    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Unknown plan" }) };
    }

    const siteUrl = process.env.URL || "https://accesspath-app.netlify.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: { userId, planId },
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
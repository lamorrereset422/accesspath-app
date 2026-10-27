const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const secretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = Stripe(secretKey);
const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const APP_ENV = process.env.ACCESSPATH_ENV;

if (!["production", "test"].includes(APP_ENV)) {
  throw new Error("ACCESSPATH_ENV must be production or test.");
}

const expectedProject = APP_ENV === "production"
  ? "obylhtfhlioplwscecfs"
  : "laxqancsddcufhwhcjlv";

if (
  SUPABASE_URL !== `https://${expectedProject}.supabase.co` ||
  !serviceRoleKey
) {
  throw new Error("Invalid Supabase webhook configuration.");
}

const supabase = createClient(SUPABASE_URL, serviceRoleKey);
const IS_TEST_MODE = secretKey.startsWith('sk_test_');
const IS_LIVE_MODE = secretKey.startsWith('sk_live_');
if (
  (APP_ENV === "production" && !IS_LIVE_MODE) ||
  (APP_ENV === "test" && !IS_TEST_MODE)
) {
  throw new Error("Stripe key mode does not match the app environment.");
}

const PRICE_IDS = IS_TEST_MODE
  ? {
      complete: process.env.STRIPE_TEST_PRICE_COMPLETE,
      contractor: process.env.STRIPE_TEST_PRICE_CONTRACTOR,
    }
  : {
      complete: 'price_1U3Paf72BfjzdmTjNjFrAQct',
      contractor: 'price_1U3Paa72BfjzdmTjhjInQZjF',
    };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: 'Invalid webhook signature' };
  }

  if (
    stripeEvent.type !== 'checkout.session.completed' &&
    stripeEvent.type !== 'checkout.session.async_payment_succeeded'
  ) {
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  if (!IS_TEST_MODE && !IS_LIVE_MODE) {
    console.error('Unrecognized Stripe secret key mode');
    return { statusCode: 500, body: 'Invalid Stripe configuration' };
  }

  const session = stripeEvent.data.object;
  const userId = session.client_reference_id;
  const planId = session.metadata?.planId;

  // Both the signed event and its session must match our Stripe key mode.
  if (
    stripeEvent.livemode !== IS_LIVE_MODE ||
    session.livemode !== IS_LIVE_MODE
  ) {
    console.error('Webhook Stripe mode mismatch');
    return { statusCode: 400, body: 'Stripe mode mismatch' };
  }

  if (
    !userId ||
    !UUID_PATTERN.test(userId) ||
    !['complete', 'contractor'].includes(planId)
  ) {
    console.error('Missing or invalid checkout metadata');
    return { statusCode: 400, body: 'Invalid metadata' };
  }

  if (
    session.payment_status !== 'paid' &&
    session.payment_status !== 'no_payment_required'
  ) {
    console.log(`Ignoring unpaid checkout session ${session.id}`);
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  if (
    session.mode !== 'payment' ||
    typeof session.id !== 'string' ||
    !session.id.startsWith('cs_')
  ) {
    console.error('Invalid checkout session');
    return { statusCode: 400, body: 'Invalid checkout session' };
  }

  const expectedPriceId = PRICE_IDS[planId];
  if (!expectedPriceId) {
    console.error('Missing configured price for checkout plan');
    return { statusCode: 500, body: 'Missing price configuration' };
  }

  // Verify the actual purchase, rather than relying only on metadata.
  // Two results are enough to detect an unexpected additional item.
  let lineItems;
  try {
    lineItems = await stripe.checkout.sessions.listLineItems(
      session.id,
      { limit: 2 }
    );
  } catch (err) {
    console.error('Checkout line-item lookup failed:', err.message);
    return { statusCode: 500, body: 'Unable to verify purchased plan' };
  }

  const item = lineItems.data?.[0];
  if (
    !Array.isArray(lineItems.data) ||
    lineItems.data.length !== 1 ||
    lineItems.has_more !== false ||
    item?.price?.id !== expectedPriceId ||
    item?.quantity !== 1
  ) {
    console.error('Purchased items do not match checkout plan');
    return { statusCode: 400, body: 'Purchased plan mismatch' };
  }

  // Preserve Stripe's event time across retries.
  if (!Number.isInteger(stripeEvent.created) || stripeEvent.created <= 0) {
    console.error(`Invalid event timestamp for event ${stripeEvent.id}`);
    return { statusCode: 400, body: 'Invalid event timestamp' };
  }
  const purchasedAt = new Date(stripeEvent.created * 1000).toISOString();

  // Atomic, highest-plan-only update. Equal or lower plans change nothing.
  const { data: result, error } = await supabase.rpc('upgrade_plan', {
    p_user_id: userId,
    p_plan_id: planId,
    p_session_id: session.id,
    p_purchased_at: purchasedAt,
  });

  if (error) {
    console.error('upgrade_plan error:', error.message);
    return { statusCode: 500, body: 'Database error' };
  }

  console.log(`upgrade_plan for user ${userId}: ${planId} -> ${result}`);
  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  'https://obylhtfhlioplwscecfs.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Supabase user IDs are UUIDs; anything else is rejected before touching the database.
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
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (
    stripeEvent.type === 'checkout.session.completed' ||
    stripeEvent.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = stripeEvent.data.object;
    const userId = session.client_reference_id;
    const planId = session.metadata?.planId; // "complete" or "contractor"

    if (!userId || !UUID_PATTERN.test(userId) || !['complete', 'contractor'].includes(planId)) {
      console.error('Missing or invalid checkout metadata');
      return { statusCode: 400, body: 'Invalid metadata' };
    }

    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      console.log(`Ignoring unpaid checkout session ${session.id}`);
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    // Purchase time = when Stripe created this successful event. It stays the
    // same if Stripe retries this event. If it's missing or invalid, stop
    // instead of inventing a time (fail closed).
    if (!Number.isInteger(stripeEvent.created) || stripeEvent.created <= 0) {
      console.error(`Invalid event timestamp for event ${stripeEvent.id}`);
      return { statusCode: 400, body: 'Invalid event timestamp' };
    }
    const purchasedAt = new Date(stripeEvent.created * 1000).toISOString();

    // Atomic, highest-plan-only update (see the upgrade_plan database function).
    // It never lowers an existing plan, and repeats of the same event change nothing.
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
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

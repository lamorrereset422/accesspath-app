const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  'https://obylhtfhlioplwscecfs.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    if (!userId || !['complete', 'contractor'].includes(planId)) {
      console.error('Missing or invalid checkout metadata');
      return { statusCode: 400, body: 'Invalid metadata' };
    }

    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      console.log(`Ignoring unpaid checkout session ${session.id}`);
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    const { error } = await supabase
      .from('accesspath_storage')
      .upsert(
        {
          user_id: userId,
          key: 'accesspath:plan',
          value: JSON.stringify({
            planId,
            purchasedAt: new Date().toISOString(),
            sessionId: session.id,
          }),
        },
        { onConflict: 'user_id,key' }
      );

    if (error) {
      console.error('Supabase upsert error:', error);
      return { statusCode: 500, body: 'Database error' };
    }

    console.log(`Plan unlocked for user ${userId}: ${planId}`);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

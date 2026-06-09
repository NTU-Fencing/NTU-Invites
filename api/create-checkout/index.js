// api/create-checkout/index.js
// Azure Static Web Apps function — POST /api/create-checkout
// Creates a Stripe Checkout Session and returns the URL + session ID.

const Stripe = require('stripe');

module.exports = async function (context, req) {
  if (req.method !== 'POST') {
    context.res = { status: 405, body: 'Method not allowed' };
    return;
  }

  const { amountCents, email, name, category, weapon, successUrl, cancelUrl } = req.body || {};

  if (!amountCents || !successUrl || !cancelUrl) {
    context.res = { status: 400, body: { error: 'Missing required fields' } };
    return;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    context.res = { status: 500, body: { error: 'Stripe not configured' } };
    return;
  }

  try {
    const stripe = Stripe(stripeKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'sgd',
            unit_amount: amountCents,
            product_data: {
              name: `Fencing Championship — ${category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Entry'} (${weapon || 'All weapons'})`,
              description: 'Open Fencing Championship registration fee',
            },
          },
        },
      ],
      metadata: {
        registrantName: name || '',
        category:       category || '',
        weapon:         weapon || '',
      },
      // {CHECKOUT_SESSION_ID} is a Stripe template literal — do not change
      success_url: successUrl.replace('{CHECKOUT_SESSION_ID}', '{CHECKOUT_SESSION_ID}'),
      cancel_url:  cancelUrl,
    });

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { sessionId: session.id, url: session.url },
    };
  } catch (err) {
    context.log.error('Stripe session creation failed:', err.message);
    context.res = {
      status: 500,
      body: { error: 'Failed to create Stripe session', detail: err.message },
    };
  }
};

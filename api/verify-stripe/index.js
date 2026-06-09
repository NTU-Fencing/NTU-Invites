// api/verify-stripe/index.js
// Azure Static Web Apps function — GET /api/verify-stripe?session=<id>
// Checks whether a Stripe Checkout Session has been paid.

const Stripe = require('stripe');

module.exports = async function (context, req) {
  if (req.method !== 'GET') {
    context.res = { status: 405, body: 'Method not allowed' };
    return;
  }

  const sessionId = req.query.session;
  if (!sessionId) {
    context.res = { status: 400, body: { error: 'Missing session parameter' } };
    return;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    context.res = { status: 500, body: { error: 'Stripe not configured' } };
    return;
  }

  try {
    const stripe  = Stripe(stripeKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid = session.payment_status === 'paid';

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Allow polling from the same origin
        'Cache-Control': 'no-store',
      },
      body: {
        paid,
        status: session.payment_status,
        sessionId: session.id,
      },
    };
  } catch (err) {
    context.log.error('Stripe verify failed:', err.message);
    context.res = {
      status: 500,
      body: { error: 'Failed to verify session', detail: err.message },
    };
  }
};

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const priceMap = {
  plan12: process.env.PRICE_ID_12M,
  plan6: process.env.PRICE_ID_6M,
  plan1: process.env.PRICE_ID_1M,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      console.error('Invalid JSON body');
      return res.status(400).json({ error: 'Invalid request' });
    }
  }

  const { email, plan } = body || {};
  const priceId = priceMap[plan];

  if (!priceId) {
    console.error('Invalid plan received. Plan:', plan, 'Price map:', priceMap);
    return res.status(400).json({ error: 'Invalid plan' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url:
        'https://otoron-app.vercel.app/success?session_id={CHECKOUT_SESSION_ID}&plan=' + plan,
      cancel_url: 'https://otoron-app.vercel.app/cancel',
      customer_email: email,
      customer_creation: 'always', // ✅ これが重要！
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('❌ Error creating Stripe session:', error);
    res.status(500).json({ error: error.message });
  }
}

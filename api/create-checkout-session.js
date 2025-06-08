import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const priceMap = {
  plan12: process.env.PRICE_ID_12M,
  plan6: process.env.PRICE_ID_6M,
  plan1: process.env.PRICE_ID_1M,
};

export default async function handler(req, res) {
  console.log('Stripe Checkout API called');
  console.log('Current price map:', priceMap);

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { email, plan } = req.body;
  const priceId = priceMap[plan];
  console.log('Received email:', email, 'plan:', plan, '-> priceId:', priceId);

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
        'https://otoron-app.vercel.app/success?session_id={CHECKOUT_SESSION_ID}&plan=' +
        plan,
      cancel_url: 'https://otoron-app.vercel.app/cancel',
      customer_email: email,
    });

    console.log('Created session:', session.id);
    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('❌ Error creating Stripe session:', error);
    res.status(500).json({ error: error.message });
  }
}

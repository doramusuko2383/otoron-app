import Stripe from 'stripe';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const auth = admin.auth();

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

  const { plan, idToken } = body || {};
  const priceId = priceMap[plan];

  if (!idToken) {
    return res.status(401).json({ error: 'Missing idToken' });
  }

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch (e) {
    console.error('Invalid idToken', e);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const verifiedEmail = decoded.email;
  const uid = decoded.uid;

  if (!priceId) {
    console.error('Invalid plan received. Plan:', plan, 'Price map:', priceMap);
    return res.status(400).json({ error: 'Invalid plan' });
  }

  try {
    const origin = req.headers.origin;
    const baseUrl = (process.env.BASE_URL || origin || 'https://playotoron.com').replace(/\/$/, '');

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
        `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${baseUrl}/cancel`,
      customer_email: verifiedEmail,
      customer_creation: 'always', // ✅ これが重要！
      client_reference_id: uid,
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('❌ Error creating Stripe session:', error);
    res.status(500).json({ error: error.message });
  }
}

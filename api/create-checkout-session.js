import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  console.log('Stripe Checkout API called');

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { email, priceId } = req.body;
  console.log('Received email:', email, 'priceId:', priceId);

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
        'https://otoron-app.vercel.app/success?session_id={CHECKOUT_SESSION_ID}&price_id=' +
        priceId,
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

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  console.log('Stripe Checkout API called');

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { email } = req.body;
  console.log('Received email:', email);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: 'price_1RUo5t4aOXt1PnHZ6WGANKa8',
        quantity: 1,
      }],
      success_url: 'https://otoron-app.vercel.app/success',
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

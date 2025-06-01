import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email;
    const customerId = session.customer;

    // is_premium と stripe_customer_id を同時に更新
    const { error } = await supabase
      .from('users')
      .update({
        is_premium: true,
        stripe_customer_id: customerId,
      })
      .eq('email', email);

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).send('Supabase update failed');
    }

    console.log(
      `✅ ${email} is now a premium user with customer ID ${customerId}`
    );
  }

  res.status(200).json({ received: true });
}

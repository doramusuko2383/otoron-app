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
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { type, data } = event;
  const customerId = data?.object?.customer;

  if (type === 'checkout.session.completed') {
    const session = data.object;
    const email = session.customer_email || session.customer_details?.email || null;
    let query = supabase
      .from('users')
      .update({
        is_premium: true,
        stripe_customer_id: customerId,
      });

    if (customerId) {
      query = query.eq('stripe_customer_id', customerId);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { error } = await query;
    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).send('Supabase update failed');
    }

    console.log(
      `\u2705 ${email} is now a premium user with customer ID ${customerId}`
    );
  }


  let isPremium;
  if (type === 'invoice.payment_succeeded') {
    isPremium = true;
  } else if (
    type === 'customer.subscription.deleted' ||
    type === 'invoice.payment_failed'
  ) {
    isPremium = false;
  }

  if (typeof isPremium === 'boolean' && customerId) {
    const { error } = await supabase
      .from('users')
      .update({ is_premium: isPremium })
      .eq('stripe_customer_id', customerId);

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).send('Supabase update failed');
    }

    console.log(
      `Updated user with customer ID ${customerId}: is_premium -> ${isPremium}`
    );
  }

  res.status(200).json({ received: true });
}

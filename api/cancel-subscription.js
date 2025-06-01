import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { email } = req.body;

  // Supabaseからcustomer_idを取得
  const { data: user, error } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('email', email)
    .single();

  if (error || !user?.stripe_customer_id) {
    return res.status(400).json({ error: 'User or customer ID not found' });
  }

  // Stripeからサブスクリプション取得 → キャンセル
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripe_customer_id,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return res.status(400).json({ error: 'No active subscription found' });
  }

  const subscription = subscriptions.data[0];

  await stripe.subscriptions.del(subscription.id);

  // Supabase更新：is_premiumをfalseに
  await supabase
    .from('users')
    .update({ is_premium: false })
    .eq('email', email);

  return res.status(200).json({ message: 'Subscription canceled' });
}

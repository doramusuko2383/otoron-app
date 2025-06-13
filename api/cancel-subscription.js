import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { email } = req.body;

  // Supabaseからcustomer_idとuser_idを取得
  const { data: user, error } = await supabase
    .from('users')
    .select('id, stripe_customer_id')
    .eq('email', email)
    .single();

  if (error || !user?.stripe_customer_id) {
    return res.status(400).json({ error: 'User or customer ID not found' });
  }

  // Stripeからサブスクリプション取得
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripe_customer_id,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return res.status(400).json({ error: 'No active subscription found' });
  }

  const subscription = subscriptions.data[0];

  // 次回更新を停止 (cancel_at_period_end)
  const updated = await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
  });

  // Supabase更新：user_subscriptions.statusを'cancelled'に
  await supabase
    .from('user_subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)
    .eq('status', 'active');

  return res.status(200).json({
    message: 'Cancellation scheduled',
    current_period_end: new Date(updated.current_period_end * 1000).toISOString(),
  });
}

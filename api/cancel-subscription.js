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

// ① リクエストから userId と email を受け取る
const { userId, email } = req.body;

let user = null;
let error = null;

// ② userId がある場合、それで検索
if (userId) {
  const result = await supabase
    .from('users')
    .select('id, stripe_customer_id')
    .eq('id', userId)
    .maybeSingle();
  user = result.data;
  error = result.error;
}

// ③ userId が無かった、もしくは見つからなかった場合、email で検索
if ((!user || error) && email) {
  const result = await supabase
    .from('users')
    .select('id, stripe_customer_id')
    .eq('email', email)
    .maybeSingle();
  user = result.data;
  error = result.error;
}

// ④ 最終チェック
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

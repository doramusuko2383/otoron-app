import { createClient } from '@supabase/supabase-js';
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

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      console.error('Invalid JSON body');
      return res.status(400).json({ error: 'Invalid request' });
    }
  }

  const { userId } = body || {};
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const { data: updatedRows, error } = await supabase
    .from('user_subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .select();

  if (error || updatedRows.length === 0) {
    return res
      .status(400)
      .json({ error: 'No active subscription found or update failed' });
  }

  return res.status(200).json({ message: 'Subscription cancelled' });
}

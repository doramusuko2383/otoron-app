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

async function resetExpiredPremiums() {
  const { data: subscriptions, error } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .lt('ended_at', new Date().toISOString())
    .eq('status', 'active');

  if (error) {
    console.error('Failed to fetch expired subscriptions:', error);
    process.exit(1);
  }

  const userIds = subscriptions.map((s) => s.user_id);
  if (userIds.length === 0) {
    console.log('No expired subscriptions found');
    return;
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ is_premium: false })
    .in('id', userIds)
    .eq('is_premium', true);

  if (updateError) {
    console.error('Failed to update users:', updateError);
    process.exit(1);
  }

  console.log(`Updated ${userIds.length} users to is_premium=false`);
}

resetExpiredPremiums();

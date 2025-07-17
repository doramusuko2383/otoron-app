import { createClient } from '@supabase/supabase-js';
import { chordOrder } from '../data/chords.js';

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

async function fixUser(userId) {
  const { data: rows, error } = await supabase
    .from('user_chord_progress')
    .select('chord_key')
    .eq('user_id', userId);

  if (error) {
    console.error(`Failed to fetch progress for ${userId}:`, error);
    return;
  }

  const existing = rows.map(r => r.chord_key);
  const missing = chordOrder.filter(key => !existing.includes(key));

  if (missing.length === 0) {
    console.log(`User ${userId}: no missing progress`);
    return;
  }

  const insertData = missing.map(key => ({
    user_id: userId,
    chord_key: key,
    status: 'locked',
    unlocked_date: null,
  }));

  const { error: insertError } = await supabase
    .from('user_chord_progress')
    .insert(insertData);

  if (insertError) {
    console.error(`User ${userId}: insert failed`, insertError);
  } else {
    console.log(`User ${userId}: inserted ${insertData.length} rows`);
  }
}

async function main() {
  const userId = process.argv[2];
  let ids = [];

  if (userId) {
    ids = [userId];
  } else {
    const { data, error } = await supabase.from('users').select('id');
    if (error) {
      console.error('Failed to fetch users:', error);
      process.exit(1);
    }
    ids = data.map(u => u.id);
  }

  for (const id of ids) {
    await fixUser(id);
  }
}

main();

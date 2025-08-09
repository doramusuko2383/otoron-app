import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const auth = admin.auth();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      console.error('Invalid JSON body');
      return res.status(400).json({ error: 'Invalid request' });
    }
  }

  const { uid, email, idToken } = body || {};
  if (!uid || !idToken) {
    return res.status(400).json({ error: 'Missing uid or idToken' });
  }

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch (e) {
    console.error('Invalid idToken', e);
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (decoded.uid !== uid) {
    return res.status(403).json({ error: 'UID mismatch' });
  }

  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', uid)
    .maybeSingle();
  if (existingError) {
    console.error('❌ Existing user check error:', existingError);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }

  let isNew = false;
  let user = existing;

  if (!existing) {
    isNew = true;
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          firebase_uid: uid,
          email,
          name: '名前未設定',
          trial_active: true,
          trial_end_date: trialEnd,
        },
      ])
      .select()
      .maybeSingle();
    if (insertError || !inserted) {
      console.error('❌ Supabase insert failed:', insertError);
      return res.status(500).json({ error: 'Insert failed' });
    }
    user = inserted;
  } else if (email && existing.email !== email) {
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ email })
      .eq('id', existing.id)
      .select()
      .maybeSingle();
    if (updateError) {
      console.error('❌ Supabase update failed:', updateError);
      return res.status(500).json({ error: 'Update failed' });
    }
    if (updated) user = updated;
  }

  return res.status(200).json({ user, isNew });
}

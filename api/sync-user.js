import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    ),
  });
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { uid, email, idToken } = req.body || {};
  if (!uid || !idToken) {
    return res.status(400).json({ error: 'Missing uid or idToken' });
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
    if (decoded.uid !== uid) {
      return res.status(401).json({ error: 'UID mismatch' });
    }
  } catch (e) {
    console.error('verifyIdToken error', e);
    const code = e?.errorInfo?.code || e?.message || 'verify-failed';
    return res.status(401).json({ error: code });
  }

  const { data: existing, error: selErr } = await supabase
    .from('users')
    .select(
      'id, name, email, firebase_uid, is_premium, trial_active, trial_end_date'
    )
    .eq('firebase_uid', uid)
    .maybeSingle();
  if (selErr) {
    return res.status(500).json({ error: 'select failed', detail: selErr });
  }

  let inserted = false;
  let updated = false;
  let user = existing;

  if (!existing) {
    const { data: insData, error: insErr } = await supabase
      .from('users')
      .insert({
        firebase_uid: uid,
        email,
        created_at: new Date().toISOString(),
        trial_active: true,
        trial_end_date: new Date(Date.now() + 7 * 86400000)
          .toISOString()
          .split('T')[0],
        is_premium: false,
      })
      .select(
        'id, name, email, firebase_uid, is_premium, trial_active, trial_end_date'
      )
      .maybeSingle();
    if (insErr) {
      return res.status(500).json({ error: 'insert failed', detail: insErr });
    }
    inserted = true;
    user = insData;
  } else if (email && existing.email !== email) {
    const { data: updData, error: updErr } = await supabase
      .from('users')
      .update({ email })
      .eq('firebase_uid', uid)
      .select(
        'id, name, email, firebase_uid, is_premium, trial_active, trial_end_date'
      )
      .maybeSingle();
    if (updErr) {
      return res.status(500).json({ error: 'update failed', detail: updErr });
    }
    updated = true;
    user = updData;
  }

  const responseUser = {
    id: user.id,
    name: user.name ?? null,
    email: user.email,
    firebase_uid: user.firebase_uid,
    is_premium: user.is_premium ?? false,
    trial_active: user.trial_active ?? true,
    trial_end_date: user.trial_end_date,
  };
  const needsProfile = !(
    responseUser.name && String(responseUser.name).trim().length > 0
  );

  return res.status(200).json({
    user: responseUser,
    isNew: inserted || needsProfile,
    needsProfile,
    inserted,
    updated,
  });
}

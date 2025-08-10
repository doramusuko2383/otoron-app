import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { uid, email } = req.body || {};
    if (!uid || !email) {
      res.status(400).json({ error: 'Missing uid or email' });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const sb = createClient(supabaseUrl, serviceKey);

    const { data, error } = await sb
      .from('users')
      .upsert({ id: uid, uid, email }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ ok: true, user: data });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' }); return
  }

  try {
    const { uid, email, name } = req.body || {}
    if (!uid || !email) {
      res.status(400).json({ error: 'Missing uid or email' }); return
    }
    const _name = name || (email ? email.split('@')[0] : 'no-name')

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      res.status(500).json({ error: 'Server env not set' }); return
    }

    // REST upsert（on_conflict=id）
    const endpoint = `${supabaseUrl}/rest/v1/users?on_conflict=id`
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify([{ id: uid, email, name: _name }])
    })

    const text = await r.text()
    if (!r.ok) {
      console.error('sync-user REST error', r.status, text)
      res.status(500).json({ error: 'Supabase REST failed', status: r.status, body: text }); return
    }

    let data = null
    try { data = JSON.parse(text) } catch { data = text }
    res.status(200).json({ ok: true, user: Array.isArray(data) ? data[0] : data })
  } catch (e) {
    console.error('sync-user handler error', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
}

import * as admin from 'firebase-admin'

const app = admin.apps.length
  ? admin.app()
  : admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });

export default async function handler(req, res){
  if(req.method!=='POST'){ res.status(405).json({error:'Method not allowed'}); return }
  try{
    const { idToken, email, name } = req.body || {}
    if(!idToken) { res.status(400).json({ error:'Missing idToken' }); return }

    const decoded = await admin.auth().verifyIdToken(idToken)
    const uid = decoded.uid
    const _email = email || decoded.email || ''
    const _name  = name  || decoded.name  || (_email ? _email.split('@')[0]:'no-name')

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
    if(!supabaseUrl || !serviceKey){ res.status(500).json({error:'Server env not set'}); return }

    // 1) 既存メールの行を探す（重複防止）
    const sel = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(_email)}&select=id,email,name`, {
      headers:{ apikey: serviceKey, Authorization:`Bearer ${serviceKey}` }
    })
    const found = sel.ok ? await sel.json() : []
    const exists = Array.isArray(found) && found.length>0
    const targetId = exists ? found[0].id : uid

    // 2) upsert（id=既存id または Firebase uid）
    const up = await fetch(`${supabaseUrl}/rest/v1/users?on_conflict=id`, {
      method:'POST',
      headers:{
        apikey: serviceKey, Authorization:`Bearer ${serviceKey}`,
        'Content-Type':'application/json',
        'Prefer':'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify([ { id: targetId, email: _email, name: _name, auth_provider: 'firebase' } ])
    })
    const txt = await up.text()
    if(!up.ok){ res.status(500).json({ error:'Supabase REST failed', status:up.status, body:txt }); return }

    const row = JSON.parse(txt)[0]
    res.status(200).json({ ok:true, is_new: !exists, user: row })
  }catch(e){
    res.status(500).json({ error: String(e?.message||e) })
  }
}

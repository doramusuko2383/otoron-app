import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function ensureAdmin() {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const json = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(json) });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { uid, email, idToken, priceId } = req.body || {};
  if (!uid || !idToken || !priceId) return res.status(400).json({ error: 'Missing params' });

  try {
    ensureAdmin();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  // 1) Firebase トークン検証
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (decoded.uid !== uid) return res.status(401).json({ error: 'UID mismatch' });
  } catch (e) {
    return res.status(401).json({ error: e?.errorInfo?.code || 'Invalid token' });
  }

  // 2) Supabase ユーザー取得（firebase_uid で）
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data: user, error: selErr } = await supabase
    .from('users')
    .select('id,email,stripe_customer_id')
    .eq('firebase_uid', uid)
    .maybeSingle();
  if (selErr) return res.status(500).json({ error: 'select failed', detail: selErr });

  // 3) Stripe Customer 用意
  let customerId = user?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: email || user?.email });
    customerId = customer.id;
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('firebase_uid', uid);
  }

  // 4) Checkout Session 作成
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.PUBLIC_BASE_URL}/mypage?canceled=1`,
  });

  return res.status(200).json({ sessionId: session.id });
}


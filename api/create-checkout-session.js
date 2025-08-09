import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end();

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('Invalid JSON body', e);
        return res.status(400).json({ error: 'Invalid request' });
      }
    }

    const { priceId, userId, email } = body || {};
    if (!priceId || !userId) {
      return res.status(400).json({ error: 'Missing params' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data: user, error: selErr } = await supabase
      .from('users')
      .select('email,stripe_customer_id')
      .eq('id', userId)
      .maybeSingle();
    if (selErr) {
      return res.status(500).json({ error: 'select failed', detail: selErr });
    }

    let customerId = user?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || user?.email,
      });
      customerId = customer.id;
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_BASE_URL}/mypage`,
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}


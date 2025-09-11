import { renderHeader } from './header.js';
import { startCheckout } from '../utils/stripeCheckout.js';
import { showToast } from '../utils/toast.js';
import { supabase } from '../utils/supabaseClient.js';

export function renderPricingScreen(user) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  renderHeader(app, user);

  const cancelFlag = localStorage.getItem('showCancelToast');
  if (cancelFlag) {
    showToast('決済がキャンセルされました');
    localStorage.removeItem('showCancelToast');
  }

  const main = document.createElement('main');
  main.className = 'pricing-page';
  app.appendChild(main);

  (async () => {
    if (user && user.is_premium) {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('ended_at')
        .eq('user_id', user.id)
        .order('ended_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.ended_at && new Date(data.ended_at) > new Date()) {
        const msg = document.createElement('p');
        msg.className = 'plan-note';
        msg.textContent = `ご利用中（有効期限: ${new Date(data.ended_at).toLocaleString()}）`;
        main.appendChild(msg);
        return;
      }
    }

    const plans = [
      {
        key: 'plan12',
        months: 12,
        monthly: 990,
        total: 11880,
        benefit: '約4ヶ月分お得',
        recommended: true,
      },
      {
        key: 'plan6',
        months: 6,
        monthly: 1290,
        total: 7740,
        benefit: '約1ヶ月分お得',
        recommended: false,
      },
      {
        key: 'plan1',
        months: 1,
        monthly: 1490,
        total: 1490,
        benefit: '',
        recommended: false,
      },
    ];

    plans.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'plan-card' + (p.recommended ? ' recommended' : '');

      if (p.recommended) {
        const rec = document.createElement('div');
        rec.className = 'recommend-badge';
        rec.textContent = 'おすすめ';
        card.appendChild(rec);
      }

      const title = document.createElement('div');
      title.className = 'plan-title';
      title.textContent = p.title || `${p.months}ヶ月プラン`;
      card.appendChild(title);

      const price = document.createElement('div');
      price.className = 'monthly-price';
      price.textContent = `税込 ${p.monthly.toLocaleString()}円／月`;
      card.appendChild(price);

      const total = document.createElement('div');
      total.className = 'total-price';
      total.textContent = `一括：${p.total.toLocaleString()}円`;
      card.appendChild(total);

      if (p.benefit) {
        const badge = document.createElement('div');
        badge.className = 'plan-badge';
        badge.textContent = p.benefit;
        card.appendChild(badge);
      }

      const btn = document.createElement('button');
      btn.className = 'choose-plan';
      btn.textContent = 'このプランを選ぶ';
      btn.dataset.plan = p.key;
      btn.onclick = () => startCheckout(btn);
      card.appendChild(btn);

      main.appendChild(card);
    });

    const note = document.createElement('p');
    note.className = 'plan-note';
    note.textContent = '※ プランの料金は、登録時に一括でお支払いいただきます';
    main.appendChild(note);
  })();
}

import { renderHeader } from './header.js';
import { startCheckout } from '../utils/stripeCheckout.js';
import { renderPlanInfoScreen } from './planInfo.js';

export function renderPricingScreen(user) {
  if (user?.is_premium) {
    renderPlanInfoScreen(user);
    return;
  }
  const app = document.getElementById('app');
  app.innerHTML = '';
  renderHeader(app, user);

  const main = document.createElement('main');
  main.className = 'pricing-page';

  const plans = [
    {
      months: 12,
      monthly: 990,
      total: 11880,
      benefit: '約4ヶ月分お得',
      priceId: 'price_1RWGURGGyh8a8OqPruLWkksD',
      recommended: true,
    },
    {
      months: 6,
      monthly: 1290,
      total: 7740,
      benefit: '約1ヶ月分お得',
      priceId: 'price_1RWGnSGGyh8a8OqPQxFPJXg0',
      recommended: false,
    },
    {
      months: 1,
      monthly: 1490,
      total: 1490,
      benefit: '',
      priceId: 'price_1RWGmmGGyh8a8OqPBX1DSJ8I',
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
    title.textContent = `${p.months}ヶ月プラン`;
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
    btn.onclick = () => startCheckout(p.priceId);
    card.appendChild(btn);

    main.appendChild(card);
  });

  const note = document.createElement('p');
  note.className = 'plan-note';
  note.textContent = '※ プランの料金は、登録時に一括でお支払いいただきます';
  main.appendChild(note);

  app.appendChild(main);
}

import { renderHeader } from './header.js';
import { supabase } from '../utils/supabaseClient.js';
import { switchScreen } from '../main.js';

const priceMap = {
  'price_1RWGmmGGyh8a8OqPBX1DSJ8I': { name: '1ヶ月プラン', monthly: 1490, total: 1490 },
  'price_1RWGnSGGyh8a8OqPQxFPJXg0': { name: '6ヶ月プラン', monthly: 1290, total: 7740 },
  'price_1RWGURGGyh8a8OqPruLWkksD': { name: '12ヶ月プラン', monthly: 990, total: 11880 },
};

async function fetchLatestSubscription(userId) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('price_id, expire_date')
    .eq('user_id', userId)
    .order('expire_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('Failed to fetch subscription', error);
  }
  return data || null;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年${m}月${d}日まで`;
}

async function createPlanInfoContent(user) {
  const sub = await fetchLatestSubscription(user.id);
  const container = document.createElement('div');
  container.className = 'current-plan';

  if (!sub) {
    container.textContent = '現在プランは無効です';
    return container;
  }

  const info = priceMap[sub.price_id] || {};

  const nameEl = document.createElement('div');
  nameEl.className = 'plan-name';
  nameEl.textContent = info.name || '不明なプラン';
  container.appendChild(nameEl);

  if (info.monthly) {
    const priceEl = document.createElement('div');
    priceEl.className = 'monthly-price';
    priceEl.textContent = `税込 ${info.monthly.toLocaleString()}円／月`;
    container.appendChild(priceEl);

    const totalEl = document.createElement('div');
    totalEl.className = 'total-price';
    totalEl.textContent = `一括：${info.total.toLocaleString()}円`;
    container.appendChild(totalEl);
  }

  if (sub.expire_date) {
    const exp = new Date(sub.expire_date);
    const expireEl = document.createElement('div');
    expireEl.className = 'expire-date';
    expireEl.textContent = formatDate(exp);
    container.appendChild(expireEl);
  }

  const btnWrap = document.createElement('div');
  btnWrap.className = 'plan-info-buttons';

  const changeBtn = document.createElement('button');
  changeBtn.textContent = 'プランを変更する';
  changeBtn.onclick = () => switchScreen('pricing');
  btnWrap.appendChild(changeBtn);

  if (user.is_premium) {
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'プレミア解約する';
    cancelBtn.onclick = async () => {
      if (!confirm('本当に解約しますか？')) return;
      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        alert('解約手続きを受け付けました');
        switchScreen('home');
      } else {
        alert('解約に失敗しました');
      }
    };
    btnWrap.appendChild(cancelBtn);
  }

  container.appendChild(btnWrap);
  return container;
}

export async function renderPlanInfoScreen(user) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  renderHeader(app, () => renderPlanInfoScreen(user));

  const main = document.createElement('main');
  main.className = 'plan-info-screen';

  const content = await createPlanInfoContent(user);
  main.appendChild(content);

  app.appendChild(main);
}

export { createPlanInfoContent };

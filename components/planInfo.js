import { renderHeader } from './header.js';
import { supabase } from '../utils/supabaseClient.js';
import { switchScreen } from '../main.js';
import { showCustomConfirm } from './home.js';

const planMap = {
  plan1: { name: '1ヶ月プラン', monthly: 1490, total: 1490 },
  plan6: { name: '6ヶ月プラン', monthly: 1290, total: 7740 },
  plan12: { name: '12ヶ月プラン', monthly: 990, total: 11880 },
};

async function fetchLatestSubscription(userId) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('plan_type, ended_at, status')
    .eq('user_id', userId)
    .order('ended_at', { ascending: false })
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
  return `${y}年${m}月${d}日`;
}

async function createPlanInfoContent(user) {
  const sub = await fetchLatestSubscription(user.id);
  const container = document.createElement('div');
  container.className = 'current-plan';

  if (!sub) {
    container.textContent = '現在プランは無効です';
    return container;
  }

  const info = planMap[sub.plan_type] || {};

  const nameEl = document.createElement('div');
  nameEl.className = 'plan-name';
  nameEl.textContent = `ご利用中のプラン：${info.name || '不明なプラン'}`;
  container.appendChild(nameEl);

  if (info.monthly) {
    const priceEl = document.createElement('div');
    priceEl.className = 'monthly-price';
    priceEl.textContent = `税込 ${info.monthly.toLocaleString()}円／月（一括払い)`;
    container.appendChild(priceEl);
  }

  let expireDate;
  if (sub.ended_at) {
    const exp = new Date(sub.ended_at);
    expireDate = exp;
    const expireEl = document.createElement('div');
    expireEl.className = 'expire-date';
    const diffMs = exp.getTime() - Date.now();
    const remaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    expireEl.textContent = `次回更新日：${formatDate(exp)}（残り${remaining}日）`;
    container.appendChild(expireEl);
  }

  const btnWrap = document.createElement('div');
  btnWrap.className = 'plan-info-buttons';

  const changeBtn = document.createElement('button');
  changeBtn.textContent = 'プランを変更する';
  changeBtn.onclick = () => switchScreen('pricing');
  btnWrap.appendChild(changeBtn);

  if (user.is_premium) {
    if (sub.status === 'cancelled') {
      const msg = document.createElement('div');
      msg.textContent = `ご契約は${formatDate(expireDate)}まで有効です。それ以降、自動的に無料プランに戻ります。`;
      msg.className = 'plan-info-msg';
      btnWrap.appendChild(msg);
    } else {
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'プレミア解約する';
      cancelBtn.onclick = async () => {
        showCustomConfirm('本当に解約しますか？', async () => {
          const res = await fetch('/api/cancel-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          });
          if (res.ok) {
            alert('解約処理が完了しました');
            switchScreen('home');
          } else {
            alert('解約に失敗しました');
          }
        });
      };
      btnWrap.appendChild(cancelBtn);
    }
  }

  container.appendChild(btnWrap);
  return container;
}

export async function renderPlanInfoScreen(user) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  renderHeader(app, user);

  const main = document.createElement('main');
  main.className = 'plan-info-screen';

  const content = await createPlanInfoContent(user);
  main.appendChild(content);

  app.appendChild(main);
}

export { createPlanInfoContent };

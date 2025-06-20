import { renderHeader } from './header.js';
import { switchScreen } from '../main.js';

const CONTENT = {
  trial_expired: {
    title: '無料体験が終了しました',
    message: '引き続きご利用いただくには、有料プランへの登録が必要です。',
    button: 'プランを確認する',
  },
  premium_expired: {
    title: '有料期間が終了しました',
    message: 'ご契約期間が終了しています。更新または再登録をお願いいたします。',
    button: 'プランを更新する',
  },
};

export function renderLockScreen(user, { lockType = 'trial_expired', url } = {}) {
  const info = CONTENT[lockType] || CONTENT.trial_expired;
  const app = document.getElementById('app');
  app.innerHTML = '';
  renderHeader(app, user);

  const main = document.createElement('main');
  main.className = 'lock-screen screen';

  const titleEl = document.createElement('h1');
  titleEl.textContent = info.title;
  main.appendChild(titleEl);

  const msgEl = document.createElement('p');
  msgEl.textContent = info.message;
  main.appendChild(msgEl);

  const btn = document.createElement('button');
  btn.textContent = info.button;
  btn.onclick = () => {
    if (url) {
      location.href = url;
    } else {
      switchScreen('pricing', user);
    }
  };
  main.appendChild(btn);

  app.appendChild(main);
}

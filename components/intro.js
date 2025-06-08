// components/intro.js
import { switchScreen } from '../main.js';

export function renderIntroScreen() {
  const app = document.getElementById('app');
  console.log('Intro: app element:', app);
  if (!app) {
    console.error('Intro: #app element not found');
    return;
  }

  // Debug: minimal content to ensure something is rendered
  app.innerHTML = '<h1 id="intro-debug">Intro Screen Debug</h1>';
  const debugElem = document.getElementById('intro-debug');
  console.log('Intro: debug element inserted?', !!debugElem);

  app.innerHTML = `
    <div class="intro-wrapper">
      <h1 class="intro-title">絶対音感トレーニング「オトロン」</h1>
      <p class="intro-description">
        色で覚える、楽しい絶対音感トレーニング！<br>
        「音の色」を覚えながら、遊ぶように絶対音感が身につくアプリです。<br>
        はじめての音感トレーニングに、ちょうどいい。
      </p>
      <div class="intro-buttons">
        <button id="login-btn">ログイン</button>
        <button id="signup-btn">無料会員登録</button>
      </div>
    </div>
  `;

  document.getElementById('login-btn').addEventListener('click', () => {
    switchScreen('login');
  });

  document.getElementById('signup-btn').addEventListener('click', () => {
    switchScreen('signup');
  });
}

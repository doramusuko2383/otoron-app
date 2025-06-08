// components/intro.js
import { switchScreen } from '../main.js';

export function renderIntroScreen() {
  const app = document.getElementById('app');
  console.log('Intro: app element:', app);
  if (!app) {
    console.error('Intro: #app element not found');
    return;
  }

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

  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      switchScreen('login');
    });
  } else {
    console.log('Intro: ボタンがDOMに存在しません (login)');
  }

  const signupBtn = document.getElementById('signup-btn');
  if (signupBtn) {
    signupBtn.addEventListener('click', () => {
      switchScreen('signup');
    });
  } else {
    console.log('Intro: ボタンがDOMに存在しません (signup)');
  }
}

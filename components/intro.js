// components/intro.js
import { switchScreen } from "../main.js";

export function renderIntroScreen() {
  const app = document.getElementById('app');
  if (!app) {
    console.error('Intro: #app element not found');
    return;
  }

  app.classList.add("with-header");
  app.innerHTML = `
    <header class="app-header intro-header">
      <button class="home-icon" id="intro-home-btn">
        <img src="images/otolon_face.webp" alt="トップへ" />
      </button>
      <div class="header-right">
        <button id="login-btn" class="intro-login">ログイン</button>
        <button id="signup-btn" class="intro-signup">無料会員登録</button>
      </div>
    </header>
    <div id="lp-top" class="intro-wrapper">
      <section class="hero">
        <h1 class="hero-title">もうドレミは、「ドレミ」から教えない。</h1>
        <p class="hero-sub">2歳からはじめる、色と和音で育てる絶対音感トレーニングアプリ</p>
        <div class="hero-visual">
          <img src="images/otolon.webp" alt="アプリ画面イメージ" />
        </div>
        <button id="hero-cta" class="cta-button">今すぐ無料体験する</button>
      </section>

      <section class="problems">
        <h2>こんなお悩みありませんか？</h2>
        <ul class="problem-list">
          <li>子どもが音感に興味を持ち始めたけど、どう教えればいいかわからない</li>
          <li>ドレミを覚えるよりも“耳でわかる”力を育てたい</li>
          <li>毎日少しだけでも練習を習慣化したい</li>
          <li>ピアノ教室の教材に“遊び感覚”のものがほしい</li>
        </ul>
      </section>

      <section class="features">
        <h2>4ステップで身につく絶対音感</h2>
        <div class="step">
          <h3>Step 01：色と和音で楽しくトレーニング</h3>
          <p>色旗×コードの組み合わせで、小さな子どもでも直感的に音を覚えていける</p>
        </div>
        <div class="step">
          <h3>Step 02：進捗に応じて和音が増える「育成モード」</h3>
          <p>毎日のがんばりで和音がアンロックされる、ゲーム感覚の育成モード搭載</p>
        </div>
        <div class="step">
          <h3>Step 03：結果は保護者と共有して見守れる</h3>
          <p>分析グラフは未搭載。代わりに、保護者と成績を「共有」できる機能を提供</p>
        </div>
        <div class="step">
          <h3>Step 04：単音分化モードあり</h3>
          <p>和音から単音への移行トレーニングも搭載。柔軟な設定も多数（出題比率、構成音限定など）</p>
        </div>
      </section>

      <section class="result-example">
        <h2>トレーニング結果表示例</h2>
        <div class="result-block">
          <p>🗓 トレーニング実施日数：8日間</p>
          <p>✅ 合格日数：0日間（1日あたり2回以上のトレーニング・各和音4問以上・正答率98%以上）</p>
          <p>📊 合計出題数：0問</p>
          <p>🎯 正答率：0.0%</p>
          <p>🔓 解放済み和音（色）：赤、黄色、青</p>
          <p>🔍 ミス傾向：</p>
          <p>📣 コメント：</p>
        </div>
      </section>

      <section class="faq">
        <h2>よくある質問</h2>
        <details><summary>Q. 2歳半でも使えますか？</summary></details>
        <details><summary>Q. 音楽の知識がなくても使えますか？</summary></details>
        <details><summary>Q. ピアノ教室の教材として使えますか？</summary></details>
        <details><summary>Q. どの端末で使えますか？</summary></details>
        <details><summary>Q. 間違えても大丈夫ですか？</summary></details>
        <details><summary>Q. 有料版はいくらで、何ができますか？</summary></details>
      </section>

      <footer class="lp-footer">
        <button id="footer-cta" class="cta-button">無料体験する</button>
        <p>&copy; 2024 Otoron</p>
      </footer>
    </div>
  `;

  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      switchScreen('login');
    });
  }

  const signupBtn = document.getElementById('signup-btn');
  if (signupBtn) {
    signupBtn.addEventListener('click', () => {
      switchScreen('signup');
    });
  }

  const heroCta = document.getElementById('hero-cta');
  const footerCta = document.getElementById('footer-cta');
  [heroCta, footerCta].forEach((btn) => {
    if (btn) btn.addEventListener('click', () => switchScreen('signup'));
  });

  const topBtn = document.getElementById('intro-home-btn');
  if (topBtn) {
    topBtn.addEventListener('click', () => {
      const top = document.getElementById('lp-top');
      top?.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

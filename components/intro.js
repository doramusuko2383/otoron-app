// components/intro.js
import { switchScreen } from "../main.js";

export function renderIntroScreen() {
  const app = document.getElementById('app');
  if (!app) {
    console.error('Intro: #app element not found');
    return;
  }

  document.body.classList.add('intro-scroll');

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
          <li>子どもに絶対音感を身に着かせたいけど、どう教えればいいかわからない</li>
          <li>絶対音感を教えてくれる教室が近所にない</li>
          <li>毎日の絶対音感トレーニングの負担が大きい</li>
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
          <p>🗓 トレーニング実施日数：7日間 </p>
          <p>✅ 合格日数：7日間（1日あたり2回以上のトレーニング・各和音4問以上・正答率98%以上）</p>
          <p>📊 合計出題数：840問</p>
          <p>🎯 正答率：98.3%</p>

          <p>🔓 解放済み和音（色）：</p>
          <p>赤、黄色、薄橙、藤色、灰色、水色、青、黒、緑、オレンジ、紫、ピンク、茶色、黄緑</p>

          <p>🔍 ミス傾向：</p>
          <p>・「A-C#-E」→「C#-E-A」（転回形ミス）×6<br>
             ・「D-F#-A」→「F#-A-D」（転回形ミス）×2<br>
             ・「E-G#-B」→「G#-B-E」（転回形ミス）×2<br>
             ・「F-A-C」→「A-C-F」（転回形ミス）×2<br>
             ・「C-E-G」→「E-G-C」（転回形ミス）×2</p>

          <p>📣 コメント：<br>
            正答率が非常に高く、音の感覚が安定してきました！ 今週も全日クリアできています。継続して努力を積み上げている姿勢が素晴らしいです。 転回形の和音が少し難しいようです。同じ構成音でも形に注意しましょう。
          </p>
        </div>
      </section>

      <section class="faq">
        <h2>よくある質問</h2>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span class="q-icon">Q</span>
            <span class="q-text">2歳半でも使えますか？</span>
            <span class="toggle-icon" aria-hidden="true"></span>
          </button>
          <div class="faq-answer" hidden>
            <span class="a-label">A</span>
            <p>はい、ご使用いただけます。オトロンは2歳半〜6歳の「絶対音感の適齢期」に合わせて設計されています。色や音で楽しく反応できるので、文字が読めなくても安心して使えます。</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span class="q-icon">Q</span>
            <span class="q-text">音楽の知識がなくても使えますか？</span>
            <span class="toggle-icon" aria-hidden="true"></span>
          </button>
          <div class="faq-answer" hidden>
            <span class="a-label">A</span>
            <p>はい、大丈夫です！ 特別な知識がなくても、アプリの指示通りに進めるだけでOK。保護者用の成績表示も「色」や「正答率」で視覚的にわかるようになっています。</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span class="q-icon">Q</span>
            <span class="q-text">ピアノ教室の教材としても使えますか？</span>
            <span class="toggle-icon" aria-hidden="true"></span>
          </button>
          <div class="faq-answer" hidden>
            <span class="a-label">A</span>
            <p>はい、補助教材としてご活用いただける設計にしております。短時間でできるため、レッスンの冒頭や宿題にも最適です。進捗を保護者と共有できるので、ご家庭での練習もスムーズになります。</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span class="q-icon">Q</span>
            <span class="q-text">どんな端末で使えますか？</span>
            <span class="toggle-icon" aria-hidden="true"></span>
          </button>
          <div class="faq-answer" hidden>
            <span class="a-label">A</span>
            <p>スマートフォン（iPhone／Android）、タブレット、パソコンでもご利用いただけます。特にタブレットでの操作が、子どもには見やすくておすすめです。</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span class="q-icon">Q</span>
            <span class="q-text">間違えても大丈夫ですか？子どもが自信をなくしませんか？</span>
            <span class="toggle-icon" aria-hidden="true"></span>
          </button>
          <div class="faq-answer" hidden>
            <span class="a-label">A</span>
            <p>大丈夫です。オトロンでは、間違えたときも優しくガイドされる設計になっており、子どもが嫌な気持ちにならないよう工夫されています。「できた！」を積み重ねて、自信を育てることを大切にしています。</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span class="q-icon">Q</span>
            <span class="q-text">有料版では何ができますか？価格は？</span>
            <span class="toggle-icon" aria-hidden="true"></span>
          </button>
          <div class="faq-answer" hidden>
            <span class="a-label">A</span>
            <p>無料体験では一部の和音や機能をご利用いただけます。有料版では、すべての和音や育成モード、進捗管理、共有機能などが解放され、より本格的なトレーニングが可能になります。料金の詳細はアプリ内または登録ページにてご確認ください。</p>
          </div>
        </div>
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

  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      const answer = btn.nextElementSibling;
      if (answer) {
        if (expanded) {
          answer.setAttribute('hidden', '');
        } else {
          answer.removeAttribute('hidden');
        }
      }
    });
  });
}

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
        <p class="hero-sub">2歳からはじめる、色と和音で育てる 絶対音感トレーニングアプリ</p>
        <p class="note">※推奨対象年齢：2歳半〜6歳</p>
        <p class="hero-highlight">＼遊びながら“聴く力”が伸びる！／</p>
        <div class="hero-visual">
          <img src="images/otolon.webp" alt="アプリ画面イメージ" />
        </div>
        <button id="hero-cta" class="cta-button">今すぐ無料体験をはじめる！</button>
      </section>

      <section class="problems">
        <p class="trouble-lead">絶対音感に興味はあるけど...</p>
        <h2 class="trouble-title">こんなお悩みありませんか？</h2>
        <div class="trouble-bubbles">
          <div class="bubble">ちょっと調べたけどレッスンがかなり高額になる...</div>
          <div class="bubble">教えてくれる先生や教室が近所にない...</div>
          <div class="bubble">独学でやってみたいけど、どう教えればいいかわからない</div>
          <div class="bubble">ちゃんと続けられるかが不安...</div>
          <div class="bubble">既に取り組んでいるけど、毎日のトレーニングの負担が大きい</div>
        </div>
      </section>

      <section class="features">
        <h2>4ステップで身につく絶対音感</h2>
        <div class="step">
          <div class="step-icon">1</div>
          <div class="step-body">
            <h3>色と和音で楽しくトレーニング</h3>
            <p>色旗×コードの組み合わせで、小さな子どもでも直感的に音を覚えていける</p>
          </div>
        </div>
        <div class="step">
          <div class="step-icon">2</div>
          <div class="step-body">
            <h3>進捗に応じて和音が増える「育成モード」</h3>
            <p>毎日のがんばりで和音がアンロックされる、ゲーム感覚の育成モード搭載</p>
          </div>
        </div>
        <div class="step">
          <div class="step-icon">3</div>
          <div class="step-body">
            <h3>結果は保護者と共有して見守れる</h3>
            <p>分析グラフは未搭載。代わりに、保護者と成績を「共有」できる機能を提供</p>
          </div>
        </div>
        <div class="step">
          <div class="step-icon">4</div>
          <div class="step-body">
            <h3>単音分化モードあり</h3>
            <p>和音から単音への移行トレーニングも搭載。柔軟な設定も多数（出題比率、構成音限定など）</p>
          </div>
        </div>
        <button id="step-cta" class="cta-button">アプリの進化を体験してみる</button>
      </section>

      <section class="result-example">
        <h2>トレーニング結果表示例</h2>
        <div class="result-block">
          <div class="result-card">
            <span class="result-icon">🗓</span>
            <div>
              <h4>トレーニング実施日数</h4>
              <p>7日間</p>
            </div>
          </div>
          <div class="result-card">
            <span class="result-icon">✅</span>
            <div>
              <h4>合格日数</h4>
              <p>7日間（条件：1日2回以上＋4問以上＋98%以上）</p>
            </div>
          </div>
          <div class="result-card">
            <span class="result-icon">📊</span>
            <div>
              <h4>合計出題数</h4>
              <p>840問</p>
            </div>
          </div>
          <div class="result-card">
            <span class="result-icon">🎯</span>
            <div>
              <h4>正答率</h4>
              <p>98.3%</p>
            </div>
          </div>
          <div class="result-card">
            <span class="result-icon">🔓</span>
            <div>
              <h4>解放済み和音</h4>
              <p>赤、黄色、薄橙、藤色、灰色、水色、青、黒、緑、オレンジ、紫、ピンク、茶色、黄緑</p>
            </div>
          </div>
          <div class="result-card">
            <span class="result-icon">🔍</span>
            <div>
              <h4>ミス傾向</h4>
              <p>・「A-C#-E」→「C#-E-A」（転回形ミス）×6<br>・「F-A-C」→「A-C-F」など</p>
            </div>
          </div>
          <div class="result-card">
            <span class="result-icon">📣</span>
            <div>
              <h4>コメント</h4>
              <p>正答率が非常に高く、音の感覚が安定してきました。特に転回形ミスに注意。</p>
            </div>
          </div>
        </div>
      </section>

      <section class="age-info">
        <h2>なぜ2歳半〜6歳が絶対音感の適齢期なの？</h2>
        <p>絶対音感の習得は、生まれつきの才能ではなく「何歳のうちに訓練を始めたか」が大きく関わっています。一般に、2歳半〜6歳頃までは「耳の臨界期」と呼ばれ、音の高さ・響きの違いを区別する力が自然に育ちやすい時期とされています。</p>
        <p>この時期に、楽しく・繰り返し・感覚的に音を聴く体験を積むことで、音の記憶や聴き分け能力が脳内に定着しやすくなるのです。</p>
        <p>一方で、7歳以降になると相対音感に頼る傾向が強まり、絶対音感の習得が難しくなることが多いとされています。</p>
        <p>そのため、「楽しく遊びながら耳を育てられる」時期にスタートすることがとても大切なのです。※江口式、鈴木式、海外の音楽心理学研究などでも「2歳半〜6歳が絶対音感習得の黄金期」とされています。</p>
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
        <button id="footer-cta" class="cta-button">気になる方はこちらから無料体験へ！</button>
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
  const stepCta = document.getElementById('step-cta');
  const footerCta = document.getElementById('footer-cta');
  [heroCta, stepCta, footerCta].forEach((btn) => {
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

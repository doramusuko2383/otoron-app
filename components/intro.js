// components/intro.js
import { switchScreen } from "../main.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseAuth } from "../firebase/firebase-init.js";
import { supabase } from "../utils/supabaseClient.js";
import { showCustomAlert } from "./home.js";

export function renderIntroScreen() {
  const app = document.getElementById('app');
  if (!app) {
    console.error('Intro: #app element not found');
    return;
  }

  document.body.classList.add('intro-scroll');

  app.innerHTML = `
    <header id="lp-top" class="hero-header">
      <div class="hero-container">
        <div class="hero">
          <h1 class="hero-title">絶対音感はもう、<br>特別な才能じゃない。</h1>

          <p class="hero-sub">遊びながら耳を育てる、新しいトレーニングのかたち。</p>

          <p class="note">※推奨対象年齢：2歳半〜6歳</p>

          <p class="hero-highlight">＼遊びながら“聴く力”が<span class="accent">伸びる！</span>／</p>
          <img class="mato-image" src="images/otolon.webp" alt="まとオトロン" />
          <button id="hero-cta" class="cta-button">今すぐ無料体験をはじめる！</button>
        </div>
        <div class="hero-image"></div>
      </div>
      <div class="app-header intro-header">
        <button class="home-icon" id="intro-home-btn">
          <img src="images/otolon_face.webp" alt="トップへ" />
        </button>
        <div class="header-right">
          <div class="info-menu">
          <button id="info-menu-btn" aria-label="インフォメーション">ℹ️</button>
          <div id="info-dropdown" class="info-dropdown">
            <button id="terms-btn">利用規約</button>
            <button id="privacy-btn">プライバシーポリシー</button>
            <button id="contact-btn">お問い合わせ</button>
            <button id="help-btn">必ずお読みください</button>
            <button id="faq-btn">よくある質問</button>
            <button id="law-btn">特定商取引法に基づく表示</button>
            <button id="external-btn">外部送信ポリシー</button>
          </div>
        </div>
        <button id="login-btn" class="intro-login">ログイン</button>
        <button id="signup-btn" class="intro-signup">無料会員登録</button>
      </div>
    </header>
    <div class="intro-wrapper">

      <section class="problems">
        <p class="trouble-lead">絶対音感に興味はあるけど...</p>
        <h2 class="trouble-title">こんなお悩みありませんか？</h2>
        <div class="trouble-bubbles">
          <div class="speech-bubble">ちょっと調べたけどレッスンがかなり高額になる...</div>
          <div class="speech-bubble">教えてくれる先生や教室が近所にない...</div>
          <div class="speech-bubble">独学でやってみたいけど、どう教えればいいかわからない</div>
          <div class="speech-bubble">続けられるのが大変そうで、ちゃんと出来るかが不安...</div>
          <div class="speech-bubble">既に取り組んでいるけど、毎日のトレーニングの負担が大きい</div>
        </div>
      </section>

      <section class="features">
        <h2 class="features-heading">4ステップで身につく絶対音感</h2>

        <div class="intro-steps-container">
          <div class="intro-step">
            <div class="step-badge step1">🟡 Step 1</div>
            <div class="intro-step-video-wrapper">
              <video class="intro-step-video" src="/videos/training-demo.webm" autoplay muted loop playsinline></video>
            </div>
            <div class="intro-step-text">
              <div class="intro-step-header">
                <h3 class="intro-step-title">色と和音で楽しくトレーニング</h3>
              </div>
              <p class="intro-step-description">色旗×コードの組み合わせで、小さな子どもでも直感的に音を覚えていける</p>
            </div>
          </div>

          <div class="intro-step">
            <div class="step-badge step2">🟣 Step 2</div>
            <div class="intro-step-video-wrapper">
              <video class="intro-step-video" src="/videos/growth-mode-demo.webm" autoplay muted loop playsinline></video>
            </div>
            <div class="intro-step-text">
              <div class="intro-step-header">
                <h3 class="intro-step-title">進捗に応じて和音が解放</h3>
              </div>
              <p class="intro-step-description">毎日のがんばりで和音がアンロックされる、ゲーム感覚の育成モード搭載</p>
            </div>
          </div>

          <div class="intro-step">
            <div class="step-badge step3">🔵 Step 3</div>
            <div class="intro-step-video-wrapper">
              <video class="intro-step-video" src="/videos/analysis-screen-demo.webm" autoplay muted loop playsinline></video>
            </div>
            <div class="intro-step-text">
              <div class="intro-step-header">
                <h3 class="intro-step-title">結果は保護者と共有して見守れる</h3>
              </div>
              <p class="intro-step-description">トレーニング結果をさかのぼれる！分析結果を保護者と成績を「共有」できる機能を提供</p>
            </div>
          </div>

          <div class="intro-step">
            <div class="step-badge step4">🟢 Step 4</div>
            <div class="intro-step-video-wrapper">
              <video class="intro-step-video" src="/videos/settings-screen-demo.webm" autoplay muted loop playsinline></video>
            </div>
            <div class="intro-step-text">
              <div class="intro-step-header">
                <h3 class="intro-step-title">単音分化モード・設定も柔軟に</h3>
              </div>
              <p class="intro-step-description">和音から単音への移行トレーニングも搭載。柔軟な設定も多数（出題数、出題和音など）</p>
            </div>
          </div>
        </div>

        <div class="intro-step-cta">
          <button id="step-cta" class="cta-button">アプリの進化を体験してみる</button>
        </div>
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
        <ul class="age-points">
          <li><strong>✔ なぜ大切？</strong><br>絶対音感の習得は、生まれつきの才能ではなく、「何歳のうちに訓練を始めたか」が大きく関係しています。一般に2歳半〜6歳頃までは耳の臨界期と呼ばれ、音を区別する力が育ちやすい時期です。</li>
          <li><strong>✔ 何を鍛えるのか？</strong><br>この時期に楽しく繰り返し音を聴くことで、音の記憶や聴き分け能力が脳内に定着しやすくなります。</li>
          <li><strong>✔ 7歳以降は？</strong><br>7歳以降になると相対音感に頼る傾向が強まり、絶対音感の習得が難しくなることが多いとされています。</li>
        </ul>
        <p class="age-note">そのため、「楽しく遊びながら耳を育てられる」時期にスタートすることがとても大切なのです。<br>※この臨界期の考え方は、日本国内の音楽教育法や海外の音楽心理学研究などにおいても広く言及されています。</p>
      </section>

      <section class="intro-pricing">
        <h2>料金プラン</h2>
        <div class="intro-plans"></div>
        <p class="plan-note">※ プランの料金は、登録時に一括でお支払いいただきます</p>
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
            <p>無料体験では、1日のトレーニング回数に<strong>2回の制限</strong>がありますが、その他の機能は<strong>7日間すべてご利用いただけます</strong>。有料版では、トレーニング回数の制限がなくなり、引き続きすべての機能（全和音・育成モード・進捗管理・共有機能など）をご利用いただけます。料金の詳細はアプリ内または登録ページにてご確認ください。</p>
          </div>
        </div>
      </section>

      <footer class="lp-footer">
        <button id="footer-cta" class="cta-button">気になる方は「オトロン」の無料体験へ！</button>
        <div class="social-links">
          <a href="https://x.com/otoron_onkanDev" target="_blank" rel="noopener">
            <img src="images/x-logo.png" alt="Xのロゴ" />
          </a>
          <a href="https://note.com/otoron" target="_blank" rel="noopener">
            <img src="images/note-logo.png" alt="noteのロゴ" />
          </a>
        </div>
        <p>&copy; 2024 Otoron</p>
      </footer>
    </div>
  `;

  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      try {
        await signOut(firebaseAuth);
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('intro logout error', e);
      }
      switchScreen('login');
    });
  }

  const signupBtn = document.getElementById('signup-btn');
  if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
      try {
        await signOut(firebaseAuth);
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('intro logout error', e);
      }
      switchScreen('signup');
    });
  }

  // ▼ インフォメーションメニュー
  const infoMenuBtn = document.getElementById('info-menu-btn');
  const infoDropdown = document.getElementById('info-dropdown');
  const termsBtn = document.getElementById('terms-btn');
  const privacyBtn = document.getElementById('privacy-btn');
  const contactBtn = document.getElementById('contact-btn');
  const helpBtn = document.getElementById('help-btn');
  const faqBtn = document.getElementById('faq-btn');
  const lawBtn = document.getElementById('law-btn');
  const externalBtn = document.getElementById('external-btn');

  if (infoMenuBtn && infoDropdown) {
    infoMenuBtn.onclick = (e) => {
      e.stopPropagation();
      const willShow = !infoDropdown.classList.contains('show');
      infoDropdown.classList.toggle('show');
      if (willShow) {
        document.addEventListener(
          'click',
          function handler(ev) {
            if (!infoDropdown.contains(ev.target) && ev.target !== infoMenuBtn) {
              infoDropdown.classList.remove('show');
              document.removeEventListener('click', handler);
            }
          }
        );
      }
    };
  }

  // Always show the intro-style header when navigating to these pages
  // from the landing page, regardless of login status.
  const introOptions = null; // force header rendering for intro pages

  if (termsBtn) termsBtn.onclick = () => switchScreen('terms', introOptions);
  if (privacyBtn) privacyBtn.onclick = () => switchScreen('privacy', introOptions);
  if (contactBtn) contactBtn.onclick = () => switchScreen('contact', introOptions);
  if (helpBtn) helpBtn.onclick = () => switchScreen('help', introOptions);
  if (faqBtn)
    faqBtn.onclick = () => switchScreen('faq', introOptions, { hideReselect: true });
  if (lawBtn) lawBtn.onclick = () => switchScreen('law', introOptions);
  if (externalBtn) externalBtn.onclick = () => switchScreen('external', introOptions);

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

  const planWrap = document.querySelector('.intro-plans');
  if (planWrap) {
    const plans = [
      { months: 12, monthly: 990, total: 11880, benefit: '約4ヶ月分お得', recommended: true },
      { months: 6, monthly: 1290, total: 7740, benefit: '約1ヶ月分お得', recommended: false },
      { months: 1, monthly: 1490, total: 1490, benefit: '', recommended: false },
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
      btn.addEventListener('click', () => {
        showCustomAlert(
          'このプランは無料会員登録後にお申し込みいただけます。',
          async () => {
            try {
              await signOut(firebaseAuth);
              await supabase.auth.signOut();
            } catch (e) {
              console.warn('intro logout error', e);
            }
            switchScreen('signup');
          }
        );
      });
      card.appendChild(btn);

      planWrap.appendChild(card);
    });
  }

  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      const answer = btn.nextElementSibling;
      if (answer) {
        if (expanded) {
          answer.classList.remove('show');
          setTimeout(() => {
            answer.setAttribute('hidden', '');
          }, 300);
        } else {
          answer.removeAttribute('hidden');
          // allow CSS transition to run
          requestAnimationFrame(() => answer.classList.add('show'));
        }
      }
    });
  });
}

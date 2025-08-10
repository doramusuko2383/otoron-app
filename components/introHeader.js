import { switchScreen } from "../main.js";
import { AuthController } from "../src/authController.js";

export function renderIntroHeader(container) {
  const auth = AuthController.get();
  const header = document.createElement("header");
  header.className = "app-header intro-header";
  header.innerHTML = `
    <button class="home-icon" id="intro-home-btn">
      <img src="images/otolon_face.webp" alt="絶対音感トレーニングアプリ『オトロン』トップへ戻るボタン" />
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
  `;
  container.prepend(header);
  container.classList.add("with-header");

  const loginBtn = header.querySelector("#login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      try {
        await auth.logout();
      } catch (e) {
        console.warn("intro logout error", e);
      }
      switchScreen("login");
    });
  }

  const signupBtn = header.querySelector("#signup-btn");
  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
      try {
        await auth.logout();
      } catch (e) {
        console.warn("intro logout error", e);
      }
      switchScreen("signup");
    });
  }

  const infoMenuBtn = header.querySelector("#info-menu-btn");
  const infoDropdown = header.querySelector("#info-dropdown");
  const termsBtn = header.querySelector("#terms-btn");
  const privacyBtn = header.querySelector("#privacy-btn");
  const contactBtn = header.querySelector("#contact-btn");
  const helpBtn = header.querySelector("#help-btn");
  const faqBtn = header.querySelector("#faq-btn");
  const lawBtn = header.querySelector("#law-btn");
  const externalBtn = header.querySelector("#external-btn");

  if (infoMenuBtn && infoDropdown) {
    infoMenuBtn.onclick = (e) => {
      e.stopPropagation();
      const willShow = !infoDropdown.classList.contains("show");
      infoDropdown.classList.toggle("show");
      if (willShow) {
        document.addEventListener(
          "click",
          function handler(ev) {
            if (!infoDropdown.contains(ev.target) && ev.target !== infoMenuBtn) {
              infoDropdown.classList.remove("show");
              document.removeEventListener("click", handler);
            }
          }
        );
      }
    };
  }

  if (termsBtn) termsBtn.onclick = () => switchScreen("terms");
  if (privacyBtn) privacyBtn.onclick = () => switchScreen("privacy");
  if (contactBtn) contactBtn.onclick = () => switchScreen("contact");
  if (helpBtn) helpBtn.onclick = () => switchScreen("help");
  if (faqBtn) faqBtn.onclick = () => switchScreen("faq", undefined, { hideReselect: true });
  if (lawBtn) lawBtn.onclick = () => switchScreen("law");
  if (externalBtn) externalBtn.onclick = () => switchScreen("external");

  const topBtn = header.querySelector("#intro-home-btn");
  if (topBtn) {
    topBtn.addEventListener("click", () => switchScreen("intro"));
  }
}

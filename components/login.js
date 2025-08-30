import {
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { firebaseAuth } from "../firebase/firebase-init.js";
import { switchScreen } from "../main.js";
import { t } from "../js/i18n.js";
import { addDebugLog } from "../utils/loginDebug.js";
import { ensureSupabaseAuth } from "../utils/supabaseOptionalAuth.js";
import { ensureAppUserRecord } from "../utils/userStore.js";
import { showCustomAlert } from "./home.js";

export function renderLoginScreen(container) {
  container.innerHTML = `
    <div class="login-wrapper">
      <h2 class="login-title" data-i18n="nav_login"></h2>
      <p class="login-success" style="display:none"></p>
      <div class="login-note">
        <p>・Googleでログインしたことがある場合は、必ず「Googleでログイン」を使ってください。</p>
        <p>・メールアドレスとパスワードは、最初にメール認証を使った場合のみ有効です。</p>
      </div>
      <form class="login-form">
        <input type="email" id="email" required data-i18n="ph_email" data-i18n-attr="placeholder" />
        <div class="password-wrapper">
          <input type="password" id="password" required data-i18n="ph_password" data-i18n-attr="placeholder" />
          <img src="images/Visibility_off.svg" class="toggle-password" alt="絶対音感トレーニングアプリ『オトロン』パスワード表示切り替えアイコン" />
        </div>
        <button type="submit" data-i18n="btn_login"></button>
      </form>
      <p class="login-error" style="display:none"></p>

      <div class="login-divider">または</div>

      <button id="google-login" class="google-button">Googleでログイン</button>

      <div class="login-actions">
        <button id="forgot-btn" class="login-secondary">パスワードを忘れた方はこちら</button>
        <button id="back-btn" class="login-secondary">戻る</button>
        <button id="signup-btn" class="login-signup" data-i18n="nav_signup"></button>
      </div>
    </div>
  `;

  const pwInput = container.querySelector("#password");
  const pwToggle = container.querySelector(".toggle-password");
  const forgotBtn = container.querySelector("#forgot-btn");
  pwToggle.addEventListener("click", () => {
    const visible = pwInput.type === "text";
    pwInput.type = visible ? "password" : "text";
    pwToggle.src = visible ? "images/Visibility_off.svg" : "images/Visibility.svg";
  });

  const successMsg = sessionStorage.getItem("passwordResetSuccess");
  if (successMsg) {
    const msgEl = container.querySelector(".login-success");
    msgEl.textContent = "パスワードを変更しました";
    msgEl.style.display = "block";
    sessionStorage.removeItem("passwordResetSuccess");
  }

  const loginErrorEl = container.querySelector(".login-error");

  function showAuthError(code) {
    const key = `err_${code}`;
    const text = t(key) !== key ? t(key) : t('err_default');
    loginErrorEl.textContent = text;
    loginErrorEl.style.display = 'block';
  }

  async function onFirebaseLoginSuccess(firebaseUser) {
    const email = firebaseUser.email;
    try {
      await ensureSupabaseAuth(email, { quiet: true });
    } catch (_) {}
    const profile = await ensureAppUserRecord({
      uid: firebaseUser.uid,
      email,
      name: firebaseUser.displayName ?? null,
      avatar_url: firebaseUser.photoURL ?? null,
    });
    window.currentUser = profile;
    switchScreen("home", profile);
  }
  

  // メール・パスワードログイン処理
  const form = container.querySelector(".login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginErrorEl.style.display = "none";
    const email = form.querySelector("#email").value.trim();
    const password = form.querySelector("#password").value.trim();

    try {
      const methods = await fetchSignInMethodsForEmail(firebaseAuth, email);
      if (methods.includes('google.com') && !methods.includes('password')) {
        showCustomAlert('このメールアドレスはGoogleログイン専用です。Googleログインをご利用ください。');
        return;
      }

      await signInWithEmailAndPassword(firebaseAuth, email, password);
      sessionStorage.setItem("currentPassword", password);
      await onFirebaseLoginSuccess(firebaseAuth.currentUser);
    } catch (err) {
      showAuthError(err.code);
    }
  });

  // Googleログイン処理（ポップアップ方式）
  const googleProvider = new GoogleAuthProvider();
  container.querySelector("#google-login").addEventListener("click", async () => {
    addDebugLog("click google-login");
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      await onFirebaseLoginSuccess(result.user);
    } catch (e) {
      console.error("Google login failed:", e);
    }
  });

  // 戻るボタン
  container.querySelector("#back-btn").addEventListener("click", (e) => {
    e.preventDefault();
    switchScreen("intro");
  });

  // 新規登録ボタン
  container.querySelector("#signup-btn").addEventListener("click", (e) => {
    e.preventDefault();
    switchScreen("signup");
  });

  // パスワード忘れリンク
  if (forgotBtn) {
    forgotBtn.addEventListener("click", (e) => {
      e.preventDefault();
      switchScreen("forgot_password");
    });
  }
}

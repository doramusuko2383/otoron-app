import { switchScreen } from "../main.js";
import { firebaseAuth } from "../firebase/firebase-init.js";
import { t } from "../js/i18n.js";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ensureSupabaseAuth } from "../utils/supabaseClient.js";
import { ensureAppUserRecord } from "../utils/userStore.js";
import { addDebugLog } from "../utils/loginDebug.js";

import { showCustomAlert } from "./home.js";

export function renderSignUpScreen() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const container = document.createElement("div");
  container.className = "signup-wrapper";

  container.innerHTML = `
    <h2 class="signup-title" data-i18n="nav_signup"></h2>
    <form class="signup-form">
      <label for="signup-email" data-i18n="email"></label>
      <input type="email" id="signup-email" required data-i18n="ph_email" data-i18n-attr="placeholder" />

      <label for="signup-password" data-i18n="password"></label>
      <div class="password-wrapper">
        <input type="password" id="signup-password" required data-i18n="ph_password" data-i18n-attr="placeholder" />
        <img src="images/Visibility_off.svg" class="toggle-password" alt="絶対音感トレーニングアプリ『オトロン』パスワード表示切り替えアイコン" />
      </div>

      <button type="submit" class="signup-button" data-i18n="btn_signup"></button>
    </form>

    <div class="signup-divider" data-i18n="or"></div>
    <button id="google-signup" class="google-button" data-i18n="google_signup"></button>

    <div class="signup-actions">
      <button id="back-to-login" class="signup-secondary" data-i18n="nav_login"></button>
    </div>
  `;

  app.appendChild(container);

  const pwInput = container.querySelector("#signup-password");
  const pwToggle = container.querySelector(".toggle-password");
  pwToggle.addEventListener("click", () => {
    const visible = pwInput.type === "text";
    pwInput.type = visible ? "password" : "text";
    pwToggle.src = visible ? "images/Visibility_off.svg" : "images/Visibility.svg";
  });

  function showAuthError(code) {
    const key = `err_${code}`;
    const text = t(key) !== key ? t(key) : t('err_default');
    showCustomAlert(text);
  }



  // 通常のメールアドレス＋パスワード登録
  const form = container.querySelector(".signup-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector("#signup-email").value.trim();
    const password = form.querySelector("#signup-password").value.trim();
    if (!email || !password) {
      showCustomAlert(t('enter_email_password'));
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      location.hash = '#/setup';
      const { user } = await ensureSupabaseAuth(cred.user);
      if (user) {
        const profile = await ensureAppUserRecord({
          uid: cred.user.uid,
          email: cred.user.email,
          name: cred.user.displayName ?? null,
          avatar_url: cred.user.photoURL ?? null,
        });
        switchScreen("setup", profile);
      }
    } catch (e) {
      showAuthError(e.code);
    }
  });

  // Googleサインアップ処理（ポップアップ方式）
  const googleBtn = container.querySelector("#google-signup");
  const googleProvider = new GoogleAuthProvider();
  googleBtn.addEventListener("click", () => {
    addDebugLog("click google-signup");
    signInWithPopup(firebaseAuth, googleProvider)
      .then((result) => {
        if (getAdditionalUserInfo(result)?.isNewUser) {
          location.hash = '#/setup';
        }
      })
      .catch((e) => {
        showAuthError(e.code);
      });
  });

  // 戻るボタン
  const backBtn = container.querySelector("#back-to-login");
  backBtn.addEventListener("click", () => {
    switchScreen("login");
  });
}

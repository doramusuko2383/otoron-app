import { switchScreen } from "../main.js";
import { showCustomAlert } from "./home.js";
import { firebaseAuth } from "../firebase/firebase-init.js";
import { t } from "../js/i18n.js";
import {
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export function renderForgotPasswordScreen() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="login-wrapper">
      <h2 class="login-title" data-i18n="password_reset_title"></h2>
      <form class="login-form">
        <input type="email" id="reset-email" required data-i18n="ph_email" data-i18n-attr="placeholder" />
        <button type="submit" class="login-button" data-i18n="btn_send"></button>
      </form>
      <p class="reset-note" style="margin-top:1rem;font-size:0.9rem;color:#666;" data-i18n="password_reset_note"></p>
      <div class="login-actions"><button id="back-btn" class="login-secondary" data-i18n="btn_back"></button></div>
    </div>
  `;

  const form = app.querySelector(".login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector("#reset-email").value.trim();
    if (!email) {
      showCustomAlert(t('msg_enter_email'));
      return;
    }

    try {
      const methods = await fetchSignInMethodsForEmail(firebaseAuth, email);
      // Google専用（password 方法を持たない）なら弾く
      if (methods.includes("google.com") && !methods.includes("password")) {
        showCustomAlert(t('msg_google_only'));
        return;
      }

      await sendPasswordResetEmail(firebaseAuth, email, {
        url: `${location.origin}/reset-password.html`
      });
      showCustomAlert(t('password_reset_sent'));
      switchScreen("login");
    } catch (err) {
      showCustomAlert(t('msg_email_send_fail') + err.message);
    }
  });

  app.querySelector("#back-btn").addEventListener("click", () => switchScreen("login"));
}

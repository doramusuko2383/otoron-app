import { switchScreen } from "../main.js";
import { showCustomAlert } from "./home.js";
import { firebaseAuth } from "../firebase/firebase-init.js";
import {
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export function renderForgotPasswordScreen() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="login-wrapper">
      <h2 class="login-title">パスワードリセット</h2>
      <form class="login-form">
        <input type="email" id="reset-email" placeholder="メールアドレス" required />
        <button type="submit" class="login-button">送信</button>
      </form>
      <p class="reset-note" style="margin-top:1rem;font-size:0.9rem;color:#666;">
        ※ Googleなど外部サービスで登録されたアカウントはパスワード再設定できません。Googleでログインをご利用ください。
      </p>
      <div class="login-actions"><button id="back-btn" class="login-secondary">戻る</button></div>
    </div>
  `;

  const form = app.querySelector(".login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector("#reset-email").value.trim();
    if (!email) {
      showCustomAlert("メールアドレスを入力してください");
      return;
    }

    try {
      const methods = await fetchSignInMethodsForEmail(firebaseAuth, email);
      // Google専用（password 方法を持たない）なら弾く
      if (methods.includes("google.com") && !methods.includes("password")) {
        showCustomAlert("このメールはGoogleログイン専用です。Googleでログインをご利用ください。");
        return;
      }

      await sendPasswordResetEmail(firebaseAuth, email, {
        url: `${location.origin}/reset-password.html`
      });
      showCustomAlert("再設定用メールを送信しました。受信ボックスをご確認ください。");
      switchScreen("login");
    } catch (err) {
      showCustomAlert("メール送信に失敗しました：" + err.message);
    }
  });

  app.querySelector("#back-btn").addEventListener("click", () => switchScreen("login"));
}

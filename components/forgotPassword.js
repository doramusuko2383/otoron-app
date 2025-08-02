import { switchScreen } from "../main.js";
import { showCustomAlert } from "./home.js";
import { firebaseAuth } from "../firebase/firebase-init.js";
import { fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { supabase } from "../utils/supabaseClient.js";

export function renderForgotPasswordScreen() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const container = document.createElement("div");
  container.className = "login-wrapper";
  container.innerHTML = `
    <h2 class="login-title">パスワードリセット</h2>
    <form class="login-form">
      <input type="email" id="reset-email" placeholder="メールアドレス" required />
      <button type="submit" class="login-button">送信</button>
    </form>
    <p class="reset-note" style="margin-top:1rem;font-size:0.9rem;color:#666;">
      ※ Googleなど外部サービスで登録されたアカウントは、パスワードの再設定はできません。ログイン画面の『Googleでログイン』ボタンをご利用ください。
    </p>
    <div class="login-actions">
      <button id="back-btn" class="login-secondary">戻る</button>
    </div>
  `;
  app.appendChild(container);

  const form = container.querySelector(".login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector("#reset-email").value.trim();
    if (!email) {
      showCustomAlert("メールアドレスを入力してください");
      return;
    }
    try {
      const methods = await fetchSignInMethodsForEmail(firebaseAuth, email);
      if (methods.includes("google.com") && !methods.includes("password")) {
        showCustomAlert(
          "このメールアドレスはGoogleログイン専用です。Googleログインをご利用ください。",
        );
        return;
      }

      // Supabase sends the password reset email and embeds access_token and
      // refresh_token in the redirect URL hash. `reset-password.html` consumes
      // these tokens to finalize the update.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://otoron-app.vercel.app/reset-password.html",
      });
      if (error) throw error;
      showCustomAlert(
        "リセット用のメールを送信しました。※ Googleなど外部サービスで登録されたアカウントは、パスワードの再設定はできません。" +
          "ログイン画面の『Googleでログイン』ボタンをご利用ください。",
      );
      switchScreen("login");
    } catch (error) {
      showCustomAlert("メール送信に失敗しました：" + error.message);
    }
  });

  container.querySelector("#back-btn").addEventListener("click", () => {
    switchScreen("login");
  });
}

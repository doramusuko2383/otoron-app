import { supabase } from "../utils/supabaseClient.js";
import { switchScreen } from "../main.js";
import { showCustomAlert } from "./home.js";

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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password.html`,
    });
    if (error) {
      showCustomAlert("メール送信に失敗しました：" + error.message);
    } else {
      showCustomAlert("リセット用のメールを送信しました");
      switchScreen("login");
    }
  });

  container.querySelector("#back-btn").addEventListener("click", () => {
    switchScreen("login");
  });
}

import { switchScreen } from "../main.js";
import { showCustomAlert } from "./home.js";
import { firebaseAuth } from "../firebase/firebase-init.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
    try {
      await sendPasswordResetEmail(firebaseAuth, email, {
        url: `${location.origin}/reset-password.html`,
        handleCodeInApp: true,
      });
      showCustomAlert("リセット用のメールを送信しました");
      switchScreen("login");
    } catch (error) {
      showCustomAlert("メール送信に失敗しました：" + error.message);
    }
  });

  container.querySelector("#back-btn").addEventListener("click", () => {
    switchScreen("login");
  });
}

import { switchScreen } from "../main.js";
import { showCustomAlert } from "./home.js";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

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
      const actionCodeSettings = {
        url: `${window.location.origin}/reset-password.html`,
      };
      await sendPasswordResetEmail(getAuth(), email, actionCodeSettings);
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

import { switchScreen } from "../main.js";
import { showCustomAlert } from "./home.js";
import { AuthController } from "../src/authController.js";

export function renderLoginScreen(container, onLoginSuccess) {
  container.innerHTML = `
    <div class="login-wrapper">
      <h2 class="login-title">ログイン</h2>
      <form class="login-form">
        <input type="email" id="email" placeholder="メールアドレス" required autocomplete="username" />
        <div class="password-wrapper">
          <input type="password" id="password" placeholder="パスワード" required autocomplete="current-password" />
          <img src="images/Visibility_off.svg" class="toggle-password" alt="絶対音感トレーニングアプリ『オトロン』パスワード表示切り替えアイコン" />
        </div>
        <button type="submit">ログイン</button>
      </form>
      <div class="login-divider">または</div>
      <button id="google-login" class="google-button">Googleでログイン</button>
      <div class="login-actions">
        <button id="back-btn" class="login-secondary">戻る</button>
        <button id="signup-btn" class="login-signup">新規登録はこちら</button>
      </div>
    </div>
  `;

  const pwInput = container.querySelector("#password");
  const pwToggle = container.querySelector(".toggle-password");
  pwToggle.addEventListener("click", () => {
    const visible = pwInput.type === "text";
    pwInput.type = visible ? "password" : "text";
    pwToggle.src = visible ? "images/Visibility_off.svg" : "images/Visibility.svg";
  });

  const form = container.querySelector(".login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector("#email").value.trim();
    const password = form.querySelector("#password").value.trim();
    if (!email || !password) {
      showCustomAlert("メールとパスワードを入力してください");
      return;
    }
    try {
      await AuthController.get().loginWithPassword(email, password);
      onLoginSuccess?.();
    } catch (err) {
      showCustomAlert("ログイン失敗：" + (err.message || err));
    }
  });

  container.querySelector("#google-login").addEventListener("click", () => {
    AuthController.get().loginWithGoogle();
  });

  container.querySelector("#back-btn").addEventListener("click", (e) => {
    e.preventDefault();
    switchScreen("intro");
  });

  container.querySelector("#signup-btn").addEventListener("click", (e) => {
    e.preventDefault();
    switchScreen("signup");
  });
}

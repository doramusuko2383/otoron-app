import { switchScreen } from "../main.js";
import { AuthController } from "../src/authController.js";
import { addDebugLog } from "../utils/loginDebug.js";
import { showCustomAlert } from "./home.js";
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';

export function renderSignUpScreen() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const container = document.createElement("div");
  container.className = "signup-wrapper";

  container.innerHTML = `
    <h2 class="signup-title">新規登録</h2>
    <form class="signup-form">
      <label for="signup-email">メールアドレス</label>
      <input type="email" id="signup-email" required />

      <label for="signup-password">パスワード（6文字以上）</label>
      <div class="password-wrapper">
        <input type="password" id="signup-password" required />
        <img src="images/Visibility_off.svg" class="toggle-password" alt="絶対音感トレーニングアプリ『オトロン』パスワード表示切り替えアイコン" />
      </div>

      <button type="submit" class="signup-button">アカウントを作成</button>
    </form>

    <div class="signup-divider">または</div>
    <button id="google-signup" class="google-button">Googleで登録</button>

    <div class="signup-actions">
      <button id="back-to-login" class="signup-secondary">← ログイン画面に戻る</button>
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



  const auth = AuthController.get();

  // 通常のメールアドレス＋パスワード登録
  const form = container.querySelector(".signup-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector("#signup-email").value.trim();
    const password = form.querySelector("#signup-password").value.trim();
    if (!email || !password) {
      showCustomAlert("メールアドレスとパスワードを入力してください");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth.auth, email, password);
    } catch (e) {
      showCustomAlert("登録エラー：" + (e.message || e));
    }
  });

  // Googleサインアップ処理（リダイレクト方式）
  const googleBtn = container.querySelector("#google-signup");
  googleBtn.addEventListener("click", () => {
    addDebugLog("click google-signup");
    auth.loginWithGoogle();
  });

  // 戻るボタン
  const backBtn = container.querySelector("#back-to-login");
  backBtn.addEventListener("click", () => {
    switchScreen("login");
  });
}

import { switchScreen } from "../main.js";
import { addDebugLog } from "../utils/loginDebug.js";
import { showCustomAlert } from "./home.js";
import { AuthController } from "../src/authController.js";

export function renderLoginScreen(container, onLoginSuccess) {
  container.innerHTML = `
    <div class="login-wrapper">
      <h2 class="login-title">ログイン</h2>
      <p class="login-success" style="display:none"></p>
      <div class="login-note">
        <p>・Googleでログインしたことがある場合は、必ず「Googleでログイン」を使ってください。</p>
        <p>・メールアドレスとパスワードは、最初にメール認証を使った場合のみ有効です。</p>
      </div>
      <form class="login-form">
        <input type="email" id="email" placeholder="メールアドレス" required autocomplete="username" />
        <div class="password-wrapper">
          <input type="password" id="password" placeholder="パスワード" required autocomplete="current-password" />
          <img src="images/Visibility_off.svg" class="toggle-password" alt="絶対音感トレーニングアプリ『オトロン』パスワード表示切り替えアイコン" />
        </div>
        <button type="submit">ログイン</button>
      </form>
      <p class="login-error" style="display:none"></p>

      <div class="login-divider">または</div>

      <button id="google-login" class="google-button">Googleでログイン</button>

      <div class="login-actions">
        <button id="btnMagicLink" class="login-secondary">メールでログインリンクを送る</button>
        <button id="btnResetPw" class="login-secondary">パスワードを設定/再設定</button>
        <button id="forgot-btn" class="login-secondary">パスワードを忘れた方はこちら</button>
        <button id="back-btn" class="login-secondary">戻る</button>
        <button id="signup-btn" class="login-signup">新規登録はこちら</button>
      </div>
    </div>
  `;

  const pwInput = container.querySelector("#password");
  const pwToggle = container.querySelector(".toggle-password");
  const forgotBtn = container.querySelector("#forgot-btn");
  const magicBtn = container.querySelector("#btnMagicLink");
  const resetBtn = container.querySelector("#btnResetPw");
  if (window.location.hostname === "playotoron.com") {
    forgotBtn.style.display = "none";
  }
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



  

  // メール・パスワードログイン処理
  const form = container.querySelector(".login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginErrorEl.style.display = "none";
    const email = form.querySelector("#email").value.trim();
    const password = form.querySelector("#password").value.trim();

    try {
      await AuthController.get().loginWithPassword(email, password);
      onLoginSuccess?.();
    } catch (err) {
      const code = err?.code || "";
      if (code === "invalid_credentials") {
        showChoices(
          "このメールではパスワードが未設定の可能性があります。",
          { label: "メールでログインリンクを送る", onClick: () => onMagicLink(email) },
          { label: "パスワードを設定/再設定", onClick: () => onResetPassword(email) }
        );
      } else {
        showCustomAlert("ログイン失敗：" + err.message);
      }
    }
  });

  // Googleログイン処理（リダイレクト方式）
  container.querySelector("#google-login").addEventListener("click", () => {
    addDebugLog("click google-login");
    AuthController.get().loginWithGoogle();
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

  magicBtn?.addEventListener("click", () => onMagicLink());
  resetBtn?.addEventListener("click", () => onResetPassword());

  // パスワード忘れリンク
  if (forgotBtn) {
    forgotBtn.addEventListener("click", (e) => {
      e.preventDefault();
      switchScreen("forgot_password");
    });
  }

  async function onMagicLink(presetEmail) {
    const email = presetEmail || container.querySelector("#email")?.value.trim();
    if (!email) {
      showCustomAlert("メールを入力してください");
      return;
    }
    try {
      await AuthController.get().signInWithOtp(email);
      showCustomAlert("ログインリンクを送信しました。メールを確認してください。");
    } catch (e) {
      showCustomAlert("送信に失敗: " + (e.message || e));
    }
  }

  async function onResetPassword(presetEmail) {
    const email = presetEmail || container.querySelector("#email")?.value.trim();
    if (!email) {
      showCustomAlert("メールを入力してください");
      return;
    }
    try {
      await AuthController.get().sendResetPassword(email);
      showCustomAlert(
        "再設定メールを送信しました。メールのリンクから新パスワードを設定してください。"
      );
    } catch (e) {
      showCustomAlert("送信に失敗: " + (e.message || e));
    }
  }

  function showChoices(msg, ...actions) {
    if (actions.length === 2) {
      const ok = window.confirm(`${msg}\n\nOK: ${actions[0].label}\nキャンセル: ${actions[1].label}`);
      if (ok) actions[0].onClick();
      else actions[1].onClick();
    } else {
      showCustomAlert(msg);
    }
  }
}

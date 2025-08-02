import {
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { firebaseAuth } from "../firebase/firebase-init.js";
import { switchScreen } from "../main.js";
import { addDebugLog } from "../utils/loginDebug.js";
import { supabase } from "../utils/supabaseClient.js";
import { ensureSupabaseAuth } from "../utils/supabaseAuthHelper.js";
import { ensureChordProgress } from "../utils/progressUtils.js";
import { showCustomAlert } from "./home.js";

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
        <input type="email" id="email" placeholder="メールアドレス" required />
        <div class="password-wrapper">
          <input type="password" id="password" placeholder="パスワード" required />
          <img src="images/Visibility_off.svg" class="toggle-password" alt="絶対音感トレーニングアプリ『オトロン』パスワード表示切り替えアイコン" />
        </div>
        <button type="submit">ログイン</button>
      </form>

      <div class="login-divider">または</div>

      <button id="google-login" class="google-button">Googleでログイン</button>

      <div class="login-actions">
        <button id="forgot-btn" class="login-secondary">パスワードを忘れた方はこちら</button>
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

  const successMsg = sessionStorage.getItem("passwordResetSuccess");
  if (successMsg) {
    const msgEl = container.querySelector(".login-success");
    msgEl.textContent = "パスワードを変更しました";
    msgEl.style.display = "block";
    sessionStorage.removeItem("passwordResetSuccess");
  }



  // 🔽 和音進捗の初期登録（必要なら）
  async function ensureUserAndProgress(user) {
    if (!user?.uid) return;
  
    // users テーブルに Firebase UID が登録されているか確認
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("firebase_uid", user.uid)
      .maybeSingle();

    if (existingUser && (!existingUser.email || existingUser.email !== user.email)) {
      const { data: updated } = await supabase
        .from("users")
        .update({ email: user.email })
        .eq("id", existingUser.id)
        .select()
        .maybeSingle();
      if (updated) {
        existingUser.email = updated.email;
      }
    }
  
    let userId;
  
    if (!existingUser) {
      const { data: inserted, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            firebase_uid: user.uid,
            name: "名前未設定",
            email: user.email,
          },
        ])
        .select()
        .single();
  
      if (insertError || !inserted) {
        console.error("❌ Supabaseユーザー登録失敗:", insertError);
        return;
      }
      userId = inserted.id;
      
    } else {
      userId = existingUser.id;
      
    }
  
    await ensureChordProgress(userId);
  }
  

  // メール・パスワードログイン処理
  const form = container.querySelector(".login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector("#email").value.trim();
    const password = form.querySelector("#password").value.trim();

    try {
      const methods = await fetchSignInMethodsForEmail(firebaseAuth, email);
      if (methods.includes('google.com') && !methods.includes('password')) {
        showCustomAlert('このメールアドレスはGoogleログイン専用です。Googleログインをご利用ください。');
        return;
      }

      await signInWithEmailAndPassword(firebaseAuth, email, password);
      sessionStorage.setItem("currentPassword", password);
      const user = firebaseAuth.currentUser;
      try {
        await ensureSupabaseAuth(user);
      } catch (e) {
        console.error("❌ Supabaseサインイン処理でエラー:", e);
        return;
      }
      await ensureUserAndProgress(user);
      onLoginSuccess();
    } catch (err) {
      if (err.code === "auth/missing-password" || err.code === "auth/wrong-password") {
        showCustomAlert("このアカウントはGoogleで登録されている可能性があります。Googleログインをお試しください。");
      } else {
        showCustomAlert("ログイン失敗：" + err.message);
      }
    }
  });

  // Googleログイン処理（ポップアップ方式）
  const googleProvider = new GoogleAuthProvider();
  container.querySelector("#google-login").addEventListener("click", () => {
    addDebugLog("click google-login");
    signInWithPopup(firebaseAuth, googleProvider);
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

  // パスワード忘れリンク
  container.querySelector("#forgot-btn").addEventListener("click", (e) => {
    e.preventDefault();
    switchScreen("forgot_password");
  });
}

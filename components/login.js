import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { firebaseAuth } from "../firebase/firebase-init.js";
import { switchScreen } from "../main.js";
import { supabase } from "./supabaseClient.js";

export function renderLoginScreen(container, onLoginSuccess) {
  container.innerHTML = `
    <div class="login-wrapper">
      <h2 class="login-title">ログイン</h2>
      <form class="login-form">
        <input type="email" id="email" placeholder="メールアドレス" required />
        <input type="password" id="password" placeholder="パスワード" required />
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

  // メール・パスワードログイン処理
  const form = container.querySelector(".login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector("#email").value;
    const password = form.querySelector("#password").value;

    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      onLoginSuccess();
    } catch (err) {
      alert("ログイン失敗：" + err.message);
    }
  });

  // Googleログイン処理
  container.querySelector("#google-login").addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(firebaseAuth, provider);
      const user = result.user;

      // Supabaseに登録されていなければ新規作成
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("firebase_uid", user.uid)
        .maybeSingle();

      if (!existingUser) {
        await supabase.from("users").insert([{
          firebase_uid: user.uid,
          name: user.displayName || "名前未設定"
        }]);
      }

      onLoginSuccess();
    } catch (err) {
      alert("Googleログイン失敗：" + err.message);
    }
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
}

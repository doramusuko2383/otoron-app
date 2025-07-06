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
import { chords } from "../data/chords.js";
import { showCustomAlert } from "./home.js";

export function renderLoginScreen(container, onLoginSuccess) {
  container.innerHTML = `
    <div class="login-wrapper">
      <h2 class="login-title">ログイン</h2>
      <form class="login-form">
        <input type="email" id="email" placeholder="メールアドレス" required />
        <div class="password-wrapper">
          <input type="password" id="password" placeholder="パスワード" required />
          <img src="images/Visibility_off.svg" class="toggle-password" alt="表示切替" />
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
  
    // user_chord_progress にすでにデータがあるか確認
    const { data: progress } = await supabase
      .from("user_chord_progress")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
  
    if (!progress || progress.length === 0) {
      const chordKeys = chords.map(ch => ch.key);
      const insertData = chordKeys.map((key, index) => ({
        user_id: userId,
        chord_key: key,
        status: index === 0 ? "in_progress" : "locked"
      }));
  
      const { error } = await supabase
        .from("user_chord_progress")
        .insert(insertData);
  
      if (error) {
        console.error("❌ 和音進捗の初期登録失敗:", error);
      } else {
        
      }
    }
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
      showCustomAlert("ログイン失敗：" + err.message);
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
}

import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { firebaseAuth } from "../firebase/firebase-init.js";
import { switchScreen } from "../main.js";
import { supabase } from "../utils/supabaseClient.js";
import { chords } from "../data/chords.js";

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

  // 🔽 和音進捗の初期登録（必要なら）
  async function ensureUserAndProgress(user) {
    if (!user?.uid) return;
  
    // users テーブルに Firebase UID が登録されているか確認
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("firebase_uid", user.uid)
      .maybeSingle();
  
    let userId;
  
    if (!existingUser) {
      const { data: inserted, error: insertError } = await supabase.from("users").insert([{
        firebase_uid: user.uid,
        name: user.displayName || "名前未設定"
      }]).select().single();
  
      if (insertError || !inserted) {
        console.error("❌ Supabaseユーザー登録失敗:", insertError);
        return;
      }
      userId = inserted.id;
      console.log("✅ Supabaseユーザーを新規登録:", inserted);
    } else {
      userId = existingUser.id;
      console.log("✅ Supabaseに既存ユーザー:", existingUser);
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
        console.log("✅ 和音進捗を初期化しました");
      }
    }
  }
  

  // メール・パスワードログイン処理
  const form = container.querySelector(".login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector("#email").value;
    const password = form.querySelector("#password").value;

    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = firebaseAuth.currentUser;
      await ensureUserAndProgress(user);
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
      await ensureUserAndProgress(user);
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

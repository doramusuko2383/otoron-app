import { switchScreen } from "../main.js";
import { firebaseAuth } from "../firebase/firebase-init.js";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { supabase } from "../utils/supabaseClient.js";
import { createInitialChordProgress } from "../utils/progressUtils.js";

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
      <input type="password" id="signup-password" required />

      <button type="submit" class="signup-button">アカウントを作成</button>
    </form>

    <div class="signup-divider">または</div>
    <button id="google-signup" class="google-button">Googleで登録</button>

    <div class="signup-actions">
      <button id="back-to-login" class="signup-secondary">← ログイン画面に戻る</button>
    </div>
  `;

  app.appendChild(container);

  // 通常のメールアドレス＋パスワード登録
  const form = container.querySelector(".signup-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector("#signup-email").value.trim();
    const password = form.querySelector("#signup-password").value.trim();
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }

    try {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
      alert("登録が完了しました！");
    } catch (e) {
      alert("登録エラー：" + e.message);
    }
  });

  // Googleサインアップ処理
  const googleBtn = container.querySelector("#google-signup");
  googleBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(firebaseAuth, provider);
      const user = result.user;
      const { data: existingUser, error } = await supabase
        .from("users")
        .select("*")
        .eq("firebase_uid", user.uid)
        .maybeSingle();

      let userId = existingUser?.id;

      if (!existingUser) {
        const { data: inserted, error: insertError } = await supabase
          .from("users")
          .insert([
            { firebase_uid: user.uid, name: user.displayName || "名前未設定" }
          ])
          .select()
          .maybeSingle();

        if (insertError || !inserted) {
          console.error("❌ Supabaseユーザー登録失敗:", insertError);
        } else {
          userId = inserted.id;
        }
      }

      if (userId) {
        const { data: progress, error: progressError } = await supabase
          .from("user_chord_progress")
          .select("id")
          .eq("user_id", userId)
          .limit(1);

        if (!progressError && (!progress || progress.length === 0)) {
          await createInitialChordProgress(userId);
        }
      }
    } catch (err) {
      alert("Google登録失敗：" + err.message);
    }
  });

  // 戻るボタン
  const backBtn = container.querySelector("#back-to-login");
  backBtn.addEventListener("click", () => {
    switchScreen("login");
  });
}

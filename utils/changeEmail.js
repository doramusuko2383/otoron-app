import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  fetchSignInMethodsForEmail,
  verifyBeforeUpdateEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { supabase } from "./supabaseClient.js";

/**
 * Firebase Email/Passwordユーザーのメールアドレスを変更する。
 * 1) 再認証 → 2) 重複チェック → 3) 検証メール送信（verifyBeforeUpdateEmail） → 4) Supabaseのusers.emailを同期
 */
export async function changeEmail({ auth, currentPassword, newEmail }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  if (newEmail === user.email) {
    throw Object.assign(new Error("Email already in use"), {
      code: "auth/email-already-in-use",
    });
  }

  // provider確認（UI側でも分岐しているが、保険で）
  const providerId = user.providerData?.[0]?.providerId;
  if (providerId !== "password") {
    throw new Error(
      "This account uses a social provider. Email change is not allowed here."
    );
  }

  // --- 1) 再認証 ---
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // --- 2) 既存メール確認 ---
  const methods = await fetchSignInMethodsForEmail(auth, newEmail);
  if (methods.length > 0) {
    throw Object.assign(new Error("Email already in use"), {
      code: "auth/email-already-in-use",
    });
  }

  const { data: dup, error: dupErr } = await supabase
    .from("users")
    .select("id")
    .eq("email", newEmail)
    .neq("firebase_uid", user.uid)
    .limit(1);

  if (dupErr) {
    console.error("Supabase duplicate check error:", dupErr);
  } else if (dup && dup.length > 0) {
    throw Object.assign(new Error("Email already in use"), {
      code: "auth/email-already-in-use",
    });
  }

  // --- 3) 検証メール送信（新メール宛て） ---
  await verifyBeforeUpdateEmail(user, newEmail);

  // --- 4) Supabase 側の users.email を同期 ---
  const { error: upErr } = await supabase
    .from("users")
    .update({ email: newEmail })
    .eq("firebase_uid", user.uid);

  if (upErr) {
    if (upErr.code === "23505") {
      throw Object.assign(new Error("Email already in use"), {
        code: "auth/email-already-in-use",
      });
    }
    console.error("Supabase email sync error:", upErr);
  }
}


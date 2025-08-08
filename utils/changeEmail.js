import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { supabase } from "./supabaseClient.js";

/**
 * Firebase Email/Passwordユーザーのメールアドレスを変更する。
 * 1) 再認証 → 2) メール更新 → 3) 検証メール送信 → 4) Supabaseのusers.emailを同期
 */
export async function changeEmail({ auth, currentPassword, newEmail }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

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

  // --- 2) メール更新 ---
  await updateEmail(user, newEmail);

  // --- 3) 検証メール送信（新メール宛て） ---
  await sendEmailVerification(user);

  // --- 4) Supabase 側の users.email を同期 ---
  const { error: upErr } = await supabase
    .from("users")
    .update({ email: newEmail })
    .eq("firebase_uid", user.uid);

  if (upErr) {
    console.error("Supabase email sync error:", upErr);
  }
}


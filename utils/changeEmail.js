import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  fetchSignInMethodsForEmail,
  verifyBeforeUpdateEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/**
 * Firebase Email/Passwordユーザーのメールアドレスを変更する。
 * 1) 再認証 → 2) 重複チェック → 3) 検証メール送信（verifyBeforeUpdateEmail）
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
  const currentMethods = await fetchSignInMethodsForEmail(auth, user.email);
  if (!currentMethods.includes("password")) {
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

  // --- 3) 検証メール送信（新メール宛て） ---
  await verifyBeforeUpdateEmail(user, newEmail);
}

export async function canChangeEmail(auth, email) {
  const methods = await fetchSignInMethodsForEmail(auth, email);
  return methods.includes("password");
}


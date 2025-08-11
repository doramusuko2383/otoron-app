import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseAuth } from "../firebase/firebase-init.js";

let resolved = false;
let lastUser = null;

/**
 * Firebase の auth 状態が「確定」するまで待つ。
 * - user が来たら即 resolve(user)
 * - タイムアウト(maxMs)でも resolve(lastUser) する（null の可能性あり）
 */
export function whenAuthSettled(maxMs = 4000) {
  // すでに確定済み/現在値があるなら即返す
  if (firebaseAuth.currentUser) return Promise.resolve(firebaseAuth.currentUser);
  if (resolved) return Promise.resolve(lastUser);

  return new Promise((resolve) => {
    const started = Date.now();
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      lastUser = u;
      // 初回確定（null でも user でも）で解決
      if (!resolved || u) {
        resolved = true;
        unsub();
        resolve(u);
      }
      // タイムアウトでも確定
      if (Date.now() - started > maxMs) {
        resolved = true;
        unsub();
        resolve(u);
      }
    });
  });
}

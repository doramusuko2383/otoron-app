import { renderHomeScreen } from "./components/home.js";
import { renderTrainingScreen } from "./components/training.js";
import { renderSettingsScreen } from "./components/settings.js";
import { renderResultScreen } from "./components/result.js";
import { renderSummaryScreen } from "./components/summary.js";
import { renderGrowthScreen } from "./logic/growth.js";
import { renderLoginScreen } from './components/login.js';
import { renderIntroScreen } from "./components/intro.js";
import { renderSignUpScreen } from "./components/signup.js";
import { supabase } from "./components/supabaseClient.js";

// Firebase初期化
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAunlq7BhL9A4JvcXszpYkDoXAPPSvhlxo",
  authDomain: "otoron-app.firebaseapp.com",
  projectId: "otoron-app",
  storageBucket: "otoron-app.appspot.com",
  messagingSenderId: "572910581480",
  appId: "1:572910581480:web:3ddfb2b11404713be2fb5d",
  measurementId: "G-7Q3MX6Z3XK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
window.firebaseAuth = auth;

console.log("🧭 main.js にて全コンポーネント統合済み");

// ✅ 開発中は true にすればログインスキップ
const DEBUG_AUTO_LOGIN = false;

let currentUser = null; // 🔑 Supabaseのユーザー情報

export const switchScreen = (screen, user = currentUser) => {
  const app = document.getElementById("app");
  app.innerHTML = "";

  currentUser = user; // 呼び出し時に毎回上書き

  if (screen === "intro") renderIntroScreen();
  else if (screen === "login") renderLoginScreen(app, () => switchScreen("home", user));
  else if (screen === "home") renderHomeScreen(user);
  else if (screen === "training") renderTrainingScreen(user);
  else if (screen === "settings") renderSettingsScreen(user);
  else if (screen === "summary") renderSummaryScreen(user);
  else if (screen === "growth") renderGrowthScreen(user);
  else if (screen === "signup") renderSignUpScreen(user);
  else if (screen === "result") renderResultScreen(user);
};

// Firebase認証状態の監視とSupabaseへの登録処理
onAuthStateChanged(auth, async (firebaseUser) => {
  if (!firebaseUser) {
    console.log("🔒 ログインしていません");
    return;
  }

  console.log("🔓 Firebaseログイン済み:", firebaseUser.email);

  const { data: existingUser, error } = await supabase
    .from("users")
    .select("*")
    .eq("firebase_uid", firebaseUser.uid)
    .maybeSingle();

  if (error) {
    console.error("❌ Supabaseユーザー確認エラー:", error);
    return;
  }

  let user = existingUser;

  if (!user) {
    const { data: inserted, error: insertError } = await supabase
      .from("users")
      .insert([{
        firebase_uid: firebaseUser.uid,
        name: firebaseUser.displayName || "名前未設定"
      }])
      .select()
      .maybeSingle();

    if (insertError || !inserted) {
      console.error("❌ Supabaseユーザー登録失敗:", insertError);
      return;
    } else {
      console.log("✅ Supabaseにユーザー登録完了");
      user = inserted;
    }
  } else {
    console.log("✅ Supabaseに既存ユーザー:", user);
  }

  currentUser = user;
  switchScreen("home", user);
});

// 初期表示制御
window.addEventListener("DOMContentLoaded", () => {
  if (DEBUG_AUTO_LOGIN) {
    switchScreen("home");
  } else {
    switchScreen("intro");
  }
});

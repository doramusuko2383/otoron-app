// main.js

import { renderHomeScreen } from "./components/home.js";
import { renderTrainingScreen } from "./components/training.js"; // 和音トレーニング
import { renderTrainingScreen as renderTrainingFull } from "./components/training_full.js"; // 単音（全88鍵）
import { renderTrainingScreen as renderTrainingEasy } from "./components/training_easy_note.js"; // 単音（3オクターブ）
import { renderTrainingScreen as renderTrainingWhite } from "./components/training_white_keys.js"; // 単音（白鍵のみ）
import { renderTrainingFullResultScreen } from "./components/result_full.js";
import { renderTrainingEasyResultScreen } from "./components/result_easy.js";
import { renderTrainingWhiteResultScreen } from "./components/result_white.js";
import { renderSettingsScreen } from "./components/settings.js";
import { renderResultScreen } from "./components/result.js";
import { renderSummaryScreen } from "./components/summary.js";
import { renderGrowthScreen } from "./logic/growth.js";
import { renderLoginScreen } from "./components/login.js";
import { renderIntroScreen } from "./components/intro.js";
import { renderSignUpScreen } from "./components/signup.js";
import { renderInitialSetupScreen } from "./components/initialSetup.js";
import { supabase } from "./utils/supabaseClient.js";
import { createInitialChordProgress } from "./utils/progressUtils.js";
import { renderMyPageScreen } from "./components/mypage.js";
import { clearTimeOfDayStyling } from "./utils/timeOfDay.js";
import { renderTermsScreen } from "./components/info/terms.js";
import { renderPrivacyScreen } from "./components/info/privacy.js";
import { renderContactScreen } from "./components/info/contact.js";
import { renderLawScreen } from "./components/info/law.js";
import { renderExternalScreen } from "./components/info/external.js";
import { renderHelpScreen } from "./components/info/help.js";
import { renderPricingScreen } from "./components/pricing.js";


import { firebaseAuth } from "./firebase/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// console.log("🧭 main.js にて全コンポーネント統合済み");

const DEBUG_AUTO_LOGIN = false;


let currentUser = null;

export const switchScreen = (screen, user = currentUser, options = {}) => {
  const { replace = false } = options;

  const app = document.getElementById("app");
  app.innerHTML = "";

  if (screen !== "home") {
    clearTimeOfDayStyling();
  }

  currentUser = user;

  const state = { screen };
  if (replace) {
    history.replaceState(state, "", `#${screen}`);
  } else {
    history.pushState(state, "", `#${screen}`);
  }

  if (screen === "intro") renderIntroScreen();
  else if (screen === "login") renderLoginScreen(app, () => {});
  else if (screen === "home") renderHomeScreen(user);
  else if (screen === "training") renderTrainingScreen(user);
  else if (screen === "training_easy") renderTrainingEasy(user);
  else if (screen === "training_full") renderTrainingFull(user);
  else if (screen === "training_white") renderTrainingWhite(user);
  else if (screen === "settings") renderSettingsScreen(user);
  else if (screen === "summary") renderSummaryScreen(user);
  else if (screen === "growth") renderGrowthScreen(user);
  else if (screen === "signup") renderSignUpScreen(user);
  else if (screen === "setup") renderInitialSetupScreen(user, (u) => switchScreen("home", u));
  else if (screen === "mypage") renderMyPageScreen(user);
  else if (screen === "result") renderResultScreen(user);
  else if (screen === "result_easy") renderTrainingEasyResultScreen(user);
  else if (screen === "result_full") renderTrainingFullResultScreen(user);
  else if (screen === "result_white") renderTrainingWhiteResultScreen(user);
  else if (screen === "terms") renderTermsScreen();
  else if (screen === "privacy") renderPrivacyScreen();
  else if (screen === "contact") renderContactScreen();
  else if (screen === "help") renderHelpScreen();
  else if (screen === "law") renderLawScreen();
  else if (screen === "external") renderExternalScreen();
  else if (screen === "pricing") renderPricingScreen(user);
};

// ブラウザ戻る/進む操作に対応
window.addEventListener("popstate", (e) => {
  const state = e.state;
  if (state && state.screen) {
    switchScreen(state.screen, currentUser, { replace: true });
  }
});

onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
  if (!firebaseUser) {
    console.log("🔒 ログインしていません");
    return;
  }

  // console.log("🔓 Firebaseログイン済み:", firebaseUser.email);

  try {
    const idToken = await firebaseUser.getIdToken(true);
    const { error: signInError } = await supabase.auth.signInWithIdToken({
      provider: "firebase",
      token: idToken,
    });
    if (signInError) {
      console.error("❌ Supabaseサインイン失敗:", signInError.message);
    }
  } catch (err) {
    console.error("❌ Supabaseサインイン処理でエラー:", err);
  }

  const { data: existingUser, error } = await supabase
    .from("users")
    .select("*")
    .eq("firebase_uid", firebaseUser.uid)
    .maybeSingle();

  if (error) {
    console.error("❌ Supabaseユーザー確認エラー:", error);
    return;
  }

  // Ensure email is stored when existing user has no email
  if (existingUser && (!existingUser.email || existingUser.email !== firebaseUser.email)) {
    const { data: updated, error: updateError } = await supabase
      .from("users")
      .update({ email: firebaseUser.email })
      .eq("id", existingUser.id)
      .select()
      .maybeSingle();
    if (!updateError && updated) {
      existingUser.email = updated.email;
    }
  }

  let user = existingUser;

  if (!user) {
    const { data: inserted, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          firebase_uid: firebaseUser.uid,
          name: firebaseUser.displayName || "名前未設定",
          email: firebaseUser.email,
        },
      ])
      .select()
      .maybeSingle();

    if (insertError || !inserted) {
      console.error("❌ Supabaseユーザー登録失敗:", insertError);
      return;
    } else {
      console.log("✅ Supabaseにユーザー登録完了");
      user = inserted;
      await createInitialChordProgress(user.id);

    }
  } else {
    // console.log("✅ Supabaseに既存ユーザー:", user);
  }

  currentUser = user;
  if (!user.name || user.name === "名前未設定") {
    switchScreen("setup", user);
  } else {
    switchScreen("home", user);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const initial = DEBUG_AUTO_LOGIN ? "home" : "intro";
  const hash = location.hash.replace("#", "");
  const startScreen = hash || initial;
  switchScreen(startScreen, undefined, { replace: true });
});

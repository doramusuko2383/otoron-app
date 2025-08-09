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
import { ensureSupabaseUser } from "./utils/supabaseUser.js";
import { getLockType } from "./utils/accessControl.js";
import { ensureChordProgress } from "./utils/progressUtils.js";
import { loadTrainingRecords } from "./utils/recordStore_supabase.js";
import { getToday } from "./utils/growthUtils.js";
import { showCustomAlert } from "./components/home.js";
import { renderMyPageScreen } from "./components/mypage.js";
import { clearTimeOfDayStyling } from "./utils/timeOfDay.js";
import { renderTermsScreen } from "./components/info/terms.js";
import { renderPrivacyScreen } from "./components/info/privacy.js";
import { renderContactScreen } from "./components/info/contact.js";
import { renderLawScreen } from "./components/info/law.js";
import { renderExternalScreen } from "./components/info/external.js";
import { renderHelpScreen } from "./components/info/help.js";
import { renderFaqScreen } from "./components/info/faq.js";
import { renderChordResetScreen } from "./components/info/chordReset.js";
import { renderPricingScreen } from "./components/pricing.js";
import { renderLockScreen } from "./components/lock.js";
import { renderForgotPasswordScreen } from "./components/forgotPassword.js";


import { firebaseAuth } from "./firebase/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const INFO_SCREENS = [
  "terms",
  "privacy",
  "contact",
  "help",
  "faq",
  "chord_reset",
  "law",
  "external",
];

// console.log("🧭 main.js にて全コンポーネント統合済み");

const DEBUG_AUTO_LOGIN = false;

let helpOutsideHandler = null;
let helpKeyHandler = null;

export async function openHelp(topic) {
  let help;
  try {
    const res = await fetch('helpData.json');
    const data = await res.json();
    help = data[topic];
  } catch (e) {
    console.error('Failed to load help data', e);
    return;
  }
  if (!help) return;

  document.getElementById('help-title').innerText = help.title;
  const textHtml = help.description.map(line => `<p>${line}</p>`).join('');
  document.getElementById('help-text').innerHTML = textHtml;

  if (help.tableTitle && help.table.length > 0) {
    let tableHtml = `<h3>${help.tableTitle}</h3><table>`;
    help.table.forEach(row => {
      tableHtml += `<tr><td>${row.range}</td><td>${row.required}</td></tr>`;
    });
    tableHtml += `</table>`;
    document.getElementById('help-table').innerHTML = tableHtml;
  } else {
    document.getElementById('help-table').innerHTML = '';
  }

  const modal = document.getElementById('help-modal');
  modal.style.display = 'flex';

  helpOutsideHandler = (e) => {
    if (e.target === modal) closeHelp();
  };
  helpKeyHandler = (e) => {
    if (e.key === 'Escape') closeHelp();
  };
  modal.addEventListener('click', helpOutsideHandler);
  document.addEventListener('keydown', helpKeyHandler);
}

export function closeHelp() {
  const modal = document.getElementById('help-modal');
  modal.style.display = 'none';
  if (helpOutsideHandler) {
    modal.removeEventListener('click', helpOutsideHandler);
    helpOutsideHandler = null;
  }
  if (helpKeyHandler) {
    document.removeEventListener('keydown', helpKeyHandler);
    helpKeyHandler = null;
  }
}

// make closeHelp available for inline onclick handlers
window.closeHelp = closeHelp;

window.addEventListener("error", (e) => {
  console.error("Uncaught error", e.error);
});


let currentUser = null;
let baseUser = null;
let tempUser = null;

export function setTempUser(user) {
  tempUser = user;
  currentUser = user;
}

export function clearTempUser() {
  tempUser = null;
  currentUser = baseUser;
}

export function getBaseUser() {
  return baseUser;
}

async function checkTrainingLimit(user) {
  // Test mode: temporarily disable the free user daily training limit
  return true;
}

export const switchScreen = async (screen, user = currentUser, options = {}) => {
  const { replace = false } = options;

  if (currentUser && currentUser.isTemp && screen !== "settings") {
    clearTempUser();
    user = currentUser;
  }

  // If the user is locked (trial or premium expired),
  // always redirect to the lock screen except for a few allowed pages.
  const lockType = getLockType(user);
  if (
    lockType &&
    screen !== "lock" &&
    screen !== "pricing" &&
    screen !== "login" &&
    screen !== "signup" &&
    screen !== "intro"
  ) {
    return switchScreen("lock", user, { replace, lockType });
  }

  if (
    ["training", "training_easy", "training_full", "training_white"].includes(screen)
  ) {
    const allowed = await checkTrainingLimit(user);
    if (!allowed) return;
  }

  const app = document.getElementById("app");
  app.innerHTML = "";
  document.body.classList.remove("intro-scroll");
  document.body.classList.remove("summary-scroll");
  document.body.classList.remove("info-bg");

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

  if (INFO_SCREENS.includes(screen)) {
    document.body.classList.add("info-bg");
  }

  if (screen === "intro") {
    document.body.classList.add("intro-scroll");
    renderIntroScreen();
  }
  else if (screen === "login") renderLoginScreen(app, () => {});
  else if (screen === "forgot_password") renderForgotPasswordScreen();
  else if (screen === "home") renderHomeScreen(user, options);
  else if (screen === "training") renderTrainingScreen(user);
  else if (screen === "training_easy") renderTrainingEasy(user);
  else if (screen === "training_full") renderTrainingFull(user);
  else if (screen === "training_white") renderTrainingWhite(user);
  else if (screen === "settings") renderSettingsScreen(user);
  else if (screen === "summary") {
    document.body.classList.add("summary-scroll");
    renderSummaryScreen(user);
  }
  else if (screen === "growth") renderGrowthScreen(user);
  else if (screen === "signup") renderSignUpScreen(user);
  else if (screen === "setup") renderInitialSetupScreen(user, (u) => switchScreen("home", u, options));
  else if (screen === "mypage") await renderMyPageScreen(user);
  else if (screen === "result") renderResultScreen(user);
  else if (screen === "result_easy") renderTrainingEasyResultScreen(user);
  else if (screen === "result_full") renderTrainingFullResultScreen(user);
  else if (screen === "result_white") renderTrainingWhiteResultScreen(user);
  else if (screen === "terms") renderTermsScreen(user);
  else if (screen === "privacy") renderPrivacyScreen(user);
  else if (screen === "contact") renderContactScreen(user);
  else if (screen === "help") renderHelpScreen(user);
  else if (screen === "faq") renderFaqScreen(user, options);
  else if (screen === "chord_reset") renderChordResetScreen(user);
  else if (screen === "law") renderLawScreen(user);
  else if (screen === "external") renderExternalScreen(user);
  else if (screen === "pricing") renderPricingScreen(user);
  else if (screen === "lock") renderLockScreen(user, options);
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
    return;
  }

  // console.log("🔓 Firebaseログイン済み:", firebaseUser.email);

  let authResult;
  try {
    authResult = await ensureSupabaseUser(firebaseAuth);
  } catch (e) {
    console.error("❌ Supabase認証処理エラー:", e);
    return;
  }
  const { user, needsProfile } = authResult;
  if (!user) {
    console.warn('⚠️ Firebase logged in but Supabase link failed.');
    return;
  }

  await ensureChordProgress(user.id);

  const lockType = getLockType(user);
  if (lockType) {
    switchScreen("lock", user, { lockType });
    return;
  }

  if (needsProfile ?? !(user?.name)) {
    window.location.href = "/register-thankyou.html";
    return;
  }

  baseUser = user;
  currentUser = user;
  if (!user.name || user.name === "名前未設定") {
    switchScreen("setup", user, { showWelcome: true });
  } else {
    switchScreen("home", user, { showWelcome: false });
  }
});

const initApp = () => {
  const hash = location.hash;
  const initial = DEBUG_AUTO_LOGIN ? "home" : "intro";
  const screenHash = hash.replace("#", "");
  const startScreen = screenHash || initial;

  switchScreen(startScreen, undefined, { replace: true });

};

if (document.readyState !== "loading") {
  initApp();
} else {
  window.addEventListener("DOMContentLoaded", initApp);
}

window.addEventListener("load", () => {});

// expose utilities for dynamically loaded modules
window.switchScreen = switchScreen;
window.setTempUser = setTempUser;
window.clearTempUser = clearTempUser;
window.getBaseUser = getBaseUser;

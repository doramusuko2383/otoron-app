import { switchScreen } from "../main.js";
import { loadTrainingRecords } from "../utils/recordStore_supabase.js";
import { getToday } from "../utils/growthUtils.js";
import { renderHeader } from "./header.js";
import {
  getGreeting,
  getTimeOfDay,
  clearTimeOfDayStyling,
} from "../utils/timeOfDay.js";
import { getAudio } from "../utils/audioCache.js";
import { safePlayAudio } from "../utils/audioPlayback.js";

export async function renderHomeScreen(user, options = {}) {
  const { showWelcome = false } = options;
  const app = document.getElementById("app");
  app.innerHTML = "";

  // Remove any previous time-of-day classes/intervals before applying new one
  clearTimeOfDayStyling();

  // ✅ ヘッダー（固定表示、上部に表示）
  renderHeader(app, user);

  // ✅ メインコンテンツ（ヘッダーの下に表示）
  const container = document.createElement("div");
  let timeClass = getTimeOfDay();
  // console.log('[home] time class:', timeClass);
  container.className = `home-screen active ${timeClass}`;
  document.body.classList.add(timeClass);
  app.appendChild(container);

  // ✅ あいさつテキスト
  const titleText = document.createElement("h1");
  const userName = user?.name || "";
　titleText.innerHTML = `${userName}ちゃん<br>${getGreeting()}`;
  titleText.className = "greeting";
  container.appendChild(titleText);

  // ✅ 今日のトレーニング回数
  const today = getToday();
  const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const records = await loadTrainingRecords(user?.id, sinceDate);
  const todayRecord = records[today] || { sets: 0 };

  const info = document.createElement("p");
  info.className = "today-count";
  info.innerHTML = `🎯 きょう の がんばり：<strong>${todayRecord.sets}</strong>かい`;
  container.appendChild(info);

  // Create trial info element ahead of time to preserve layout
  const trialInfo = document.createElement("p");
  trialInfo.className = "trial-info";
  trialInfo.style.visibility = "hidden";
  container.appendChild(trialInfo);

  if (
    user &&
    user.trial_active &&
    !user.is_premium &&
    user.trial_end_date
  ) {
    const end = new Date(user.trial_end_date);
    const now = new Date();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (days <= 3) {
      trialInfo.classList.add("warning");
    }
    trialInfo.textContent = `無料体験期間は残り${days}日`;
    trialInfo.style.visibility = "visible";
  }

  // ✅ オトロン画像とスタートボタン
  const logoContainer = document.createElement("div");
  logoContainer.className = "logo-container";

  const faceImg = document.createElement("img");
  faceImg.src =
    timeClass === "night" ? "images/night_otolon.webp" : "images/otolon.webp";
  faceImg.alt = "おとろん";
  faceImg.className = "otolon-face";
  faceImg.addEventListener("pointerdown", () => {
    const audio = getAudio("audio/touch.mp3");
    safePlayAudio(audio, "touch");
    faceImg.classList.add("bounce");
    faceImg.addEventListener(
      "animationend",
      () => faceImg.classList.remove("bounce"),
      { once: true }
    );
  });

  // ✅ トレーニング開始ボタン（ひとつに集約）
  const startButton = document.createElement("button");
  startButton.textContent = "とれーにんぐ かいし";
  startButton.className = "main-start-button"; // CSSでデザイン指定
  startButton.onclick = () => switchScreen("training");

  logoContainer.appendChild(faceImg);
  logoContainer.appendChild(startButton);

  container.appendChild(logoContainer);

  if (showWelcome) {
    showCustomAlert(
      "\u2728 ようこそオトロンへ!\n\nあなたは現在\u300c7日間の無料体験\u300dをご利用中です。\n毎日のトレーニングや記録機能を、全て自由にお試しいただけます。\n\n残り日数はホーム画面に表示されます。"
    );
  }

  // ▼ 時間帯の変化に合わせて背景などを更新
  if (window.homeTimeInterval) {
    clearInterval(window.homeTimeInterval);
  }

  window.homeTimeInterval = setInterval(() => {
    if (!container.isConnected) {
      clearInterval(window.homeTimeInterval);
      window.homeTimeInterval = null;
      return;
    }

    const newClass = getTimeOfDay();
    if (newClass !== timeClass) {
      container.classList.remove(timeClass);
      container.classList.add(newClass);
      document.body.classList.remove(timeClass);
      document.body.classList.add(newClass);
      faceImg.src =
        newClass === "night" ? "images/night_otolon.webp" : "images/otolon.webp";
      titleText.textContent = `${userName}ちゃん ${getGreeting()}`;
      timeClass = newClass;
    }
  }, 60 * 1000);
}

// ✅ 他の画面から再利用できるカスタム confirm 関数
export function showCustomConfirm(message, onConfirm, options = {}) {
  if (typeof message === "function") {
    onConfirm = message;
    message = "本当に和音を解放しますか？";
    options = {};
  }
  const {
    title = "",
    okText = "OK",
    cancelText = "キャンセル",
    showCancel = true,
  } = options;
  let modal = document.getElementById("custom-confirm");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "custom-confirm";
    modal.className = "modal";

    const box = document.createElement("div");
    box.className = "modal-box";

    const titleNode = document.createElement("h3");
    titleNode.id = "custom-confirm-title";
    titleNode.textContent = title;
    titleNode.className = "modal-title";
    box.appendChild(titleNode);

    const messageEl = document.createElement("p");
    messageEl.id = "custom-confirm-message";
    messageEl.textContent = message;
    messageEl.className = "modal-message";
    box.appendChild(messageEl);

    const buttons = document.createElement("div");
    buttons.className = "modal-buttons";

    const okBtn = document.createElement("button");
    okBtn.className = "ok-btn";
    okBtn.onclick = () => {
      modal.style.display = "none";
      if (typeof modal.callback === "function") {
        modal.callback();
      }
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "cancel-btn";
    cancelBtn.onclick = () => {
      modal.style.display = "none";
    };

    buttons.appendChild(okBtn);
    buttons.appendChild(cancelBtn);
    box.appendChild(buttons);
    modal.appendChild(box);
    document.body.appendChild(modal);
  }

  const titleEl = modal.querySelector("#custom-confirm-title");
  if (titleEl) {
    titleEl.textContent = title;
    titleEl.style.display = title ? "block" : "none";
  }

  const msgEl = modal.querySelector("#custom-confirm-message");
  if (msgEl) {
    msgEl.textContent = message;
  }

  const okBtnEl = modal.querySelector(".ok-btn");
  if (okBtnEl) {
    okBtnEl.textContent = okText;
  }
  const cancelBtnEl = modal.querySelector(".cancel-btn");
  if (cancelBtnEl) {
    cancelBtnEl.textContent = cancelText;
    cancelBtnEl.style.display = showCancel ? "inline-block" : "none";
  }

  modal.callback = onConfirm;
  modal.style.display = "flex";
}

export function showCustomAlert(message, onOk, options = {}) {
  if (typeof message === "function") {
    onOk = message;
    message = "";
    options = {};
  }
  showCustomConfirm(message, onOk, { ...options, showCancel: false });
}

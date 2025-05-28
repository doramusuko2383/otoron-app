import { switchScreen } from "../main.js";
import { loadGrowthData } from "../utils/growthStore.js";
import { getToday } from "../utils/growthUtils.js";
import { renderHeader } from "./header.js";
import { getGreeting, getTimeOfDay } from "../utils/timeOfDay.js";

export function renderHomeScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  // ✅ ヘッダー（固定表示、上部に表示）
  renderHeader(app);

  // ✅ メインコンテンツ（ヘッダーの下に表示）
  const container = document.createElement("div");
  let timeClass = getTimeOfDay();
  console.log('[home] time class:', timeClass);
  container.className = `home-screen active ${timeClass}`;
  document.body.classList.remove(
    "morning",
    "day",
    "noon",
    "evening",
    "night"
  );
  document.body.classList.add(timeClass);
  app.appendChild(container);

  // ✅ あいさつテキスト
  const titleText = document.createElement("h1");
  const userName = user?.name || "";
  titleText.textContent = `${userName}ちゃん ${getGreeting()}`;
  titleText.style.fontSize = "2.2rem";
  titleText.style.margin = "0";
  titleText.style.color = "#543014";
  titleText.style.textAlign = "center";
  container.appendChild(titleText);

  // ✅ 今日のトレーニング回数
  const today = getToday();
  const growthData = loadGrowthData();
  const todayRecord = growthData[today] || { sets: 0 };

  const info = document.createElement("p");
  info.className = "today-count";
  info.innerHTML = `🎯 きょう の がんばり：<strong>${todayRecord.sets}</strong>かい`;
  container.appendChild(info);

  // ✅ オトロン画像とスタートボタン
  const logoContainer = document.createElement("div");
  logoContainer.className = "logo-container";

  const faceImg = document.createElement("img");
  faceImg.src =
    timeClass === "night" ? "images/night_otolon.png" : "images/otolon.png";
  faceImg.alt = "おとろん";
  faceImg.className = "otolon-face";
  faceImg.style.marginBottom = "0.5em";
  logoContainer.appendChild(faceImg);

  // ✅ トレーニング開始ボタン（ひとつに集約）
  const startButton = document.createElement("button");
  startButton.textContent = "とれーにんぐ かいし";
  startButton.className = "main-start-button"; // CSSでデザイン指定
  startButton.onclick = () => switchScreen("training");
  logoContainer.appendChild(startButton);

  container.appendChild(logoContainer);

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
        newClass === "night" ? "images/night_otolon.png" : "images/otolon.png";
      titleText.textContent = `${userName}ちゃん ${getGreeting()}`;
      timeClass = newClass;
    }
  }, 60 * 1000);
}

// ✅ 他の画面から再利用できるカスタム confirm 関数
export function showCustomConfirm(onConfirm) {
  let modal = document.getElementById("custom-confirm");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "custom-confirm";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    // Prevent potential overflow caused by viewport units
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.background = "rgba(0,0,0,0.6)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "1000";

    const box = document.createElement("div");
    box.style.background = "#fff";
    box.style.padding = "1.5em";
    box.style.borderRadius = "10px";
    box.style.textAlign = "center";

    const message = document.createElement("p");
    message.textContent = "本当に和音を解放しますか？";
    box.appendChild(message);

    const buttons = document.createElement("div");
    buttons.style.marginTop = "1em";

    const okBtn = document.createElement("button");
    okBtn.textContent = "OK";
    okBtn.style.margin = "0 0.5em";
    okBtn.onclick = () => {
      modal.style.display = "none";
      if (typeof modal.callback === "function") {
        modal.callback();
      }
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "キャンセル";
    cancelBtn.style.margin = "0 0.5em";
    cancelBtn.onclick = () => {
      modal.style.display = "none";
    };

    buttons.appendChild(okBtn);
    buttons.appendChild(cancelBtn);
    box.appendChild(buttons);
    modal.appendChild(box);
    document.body.appendChild(modal);
  }

  modal.callback = onConfirm;
  modal.style.display = "flex";
}

import { switchScreen } from "../main.js";
import { loadGrowthData } from "../utils/growthStore.js";
import { getToday } from "../utils/growthUtils.js";
import { renderHeader } from "./header.js";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "おはよう";
  if (hour < 18) return "こんにちは";
  return "こんばんわ";
}

export function renderHomeScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  // ✅ ヘッダー（固定表示、上部に表示）
  renderHeader(app);

  // ✅ メインコンテンツ（ヘッダーの下に表示）
  const container = document.createElement("div");
  container.className = "home-screen active";
  app.appendChild(container);

  // ✅ ロゴ・タイトル・サブタイトル
  const logoContainer = document.createElement("div");
  logoContainer.style.textAlign = "center";
  logoContainer.style.marginTop = "2em";

  const faceImg = document.createElement("img");
  faceImg.src = "images/otolon.png";
  faceImg.alt = "おとろん";
  faceImg.style.height = "180px";
  faceImg.style.marginBottom = "0.5em";

  const titleText = document.createElement("h1");
  const userName = user?.name || "";
  titleText.textContent = `${userName}ちゃん ${getGreeting()}`;
  titleText.style.fontSize = "2.2rem";
  titleText.style.margin = "0";
  titleText.style.color = "#543014";

  logoContainer.appendChild(faceImg);
  logoContainer.appendChild(titleText);
  container.appendChild(logoContainer);

  // ✅ トレーニング開始ボタン（ひとつに集約）
  const startButton = document.createElement("button");
  startButton.textContent = "とれーにんぐ かいし";
  startButton.className = "main-start-button"; // CSSでデザイン指定
  startButton.style.marginTop = "2em";
  startButton.onclick = () => switchScreen("training");
  logoContainer.appendChild(startButton);

  // ✅ 今日のトレーニング回数
  const today = getToday();
  const growthData = loadGrowthData();
  const todayRecord = growthData[today] || { sets: 0 };

  const info = document.createElement("p");
  info.innerHTML = `🎯 きょう の がんばり：<strong>${todayRecord.sets}</strong> かい`;
  info.style.marginTop = "2em";
  info.style.fontSize = "1.1em";
  info.style.textAlign = "center";
  info.style.color = "#543014";
  container.appendChild(info);
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

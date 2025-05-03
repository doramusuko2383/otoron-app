import { switchScreen } from "../main.js";
import { loadGrowthData } from "../utils/growthStore.js";
import { getToday } from "../utils/growthUtils.js";

export function renderHomeScreen() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const container = document.createElement("div");
  container.className = "screen active";

  const title = document.createElement("h1");
  title.textContent = "絶対音感トレーニング";
  title.style.textAlign = "center";

  const today = getToday();
  const growthData = loadGrowthData();
  const todayRecord = growthData[today] || { sets: 0 };

  const info = document.createElement("p");
  info.innerHTML = `🎯 今日のトレーニング数：<strong>${todayRecord.sets}</strong>`;
  info.style.marginTop = "1em";
  info.style.fontSize = "1.1em";
  info.style.textAlign = "center";

  const buttons = document.createElement("div");
  buttons.className = "home-buttons";

  const trainingBtn = document.createElement("button");
  trainingBtn.textContent = "🎵 トレーニング";
  trainingBtn.onclick = () => switchScreen("training");

  const settingBtn = document.createElement("button");
  settingBtn.textContent = "⚙️ 設定";
  settingBtn.onclick = () => switchScreen("settings");

  const summaryBtn = document.createElement("button");
  summaryBtn.textContent = "📊 診断結果";
  summaryBtn.onclick = () => switchScreen("summary");

  const growthBtn = document.createElement("button");
  growthBtn.textContent = "🌱 育成モード";
  growthBtn.onclick = () => switchScreen("growth");

  buttons.appendChild(trainingBtn);
  buttons.appendChild(settingBtn);
  buttons.appendChild(summaryBtn);
  buttons.appendChild(growthBtn);

  const mascot = document.createElement("img");
  mascot.src = "/images/otoron.png";
  mascot.alt = "オトロン";
  mascot.style.position = "fixed";
  mascot.style.bottom = "20px";
  mascot.style.right = "20px";
  mascot.style.width = "100px";
  mascot.style.height = "auto";
  mascot.style.zIndex = "10";

  container.appendChild(title);
  container.appendChild(info);
  container.appendChild(buttons);
  container.appendChild(mascot);
  app.appendChild(container);
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
    modal.style.width = "100vw";
    modal.style.height = "100vh";
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
    message.innerHTML = "ほんとうにやめちゃうの？<br>記録されなくなるよ。";
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

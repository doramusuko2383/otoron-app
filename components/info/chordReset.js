import { renderIntroHeader } from "../introHeader.js";
import { renderHeader } from "../header.js";
import { chords } from "../../data/chords.js";
import { resetProgressAndUnlock } from "../../utils/progressUtils.js";
import { showCustomConfirm, showCustomAlert } from "../home.js";
import { switchScreen } from "../../main.js";

export function renderChordResetScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  if (user) {
    renderHeader(app, user);
  } else {
    renderIntroHeader(app);
  }

  const main = document.createElement("main");
  main.className = "info-page";
  main.innerHTML = `
    <h1>和音の進捗範囲を選び直す</h1>
    <select id="start-chord"></select>
    <button id="apply-btn">選び直す</button>
    <button id="back-btn" class="link-btn">戻る</button>
  `;
  app.appendChild(main);

  const select = main.querySelector("#start-chord");
  // include every chord option, including black key inversions
  chords.forEach((ch, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    let label = ch.label;
    if (idx !== 0) label += "まで"; // 赤以外は「まで」を追加
    opt.textContent = label;
    select.appendChild(opt);
  });

  main.querySelector("#apply-btn").onclick = () => {
    const idx = parseInt(select.value, 10);
    showCustomConfirm("本当に進捗をリセットして選び直しますか？", async () => {
      const ok = await resetProgressAndUnlock(user.id, idx);
      if (ok) {
        showCustomAlert("進捗をリセットしました");
      } else {
        showCustomAlert("リセットに失敗しました");
      }
    });
  };

  main.querySelector("#back-btn").onclick = () => {
    switchScreen("faq");
  };
}

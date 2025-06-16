import { renderHeader } from "../header.js";
import { chords } from "../../data/chords.js";
import { resetProgressAndUnlock } from "../../utils/progressUtils.js";

export function renderChordResetScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app, user);

  const main = document.createElement("main");
  main.className = "info-page";
  main.innerHTML = `
    <h1>開始和音を選び直す</h1>
    <select id="start-chord"></select>
    <button id="apply-btn">選び直す</button>
  `;
  app.appendChild(main);

  const select = main.querySelector("#start-chord");
  chords.forEach((ch, idx) => {
    if (idx <= 13) { // up to mizuiro (basic 14 colors)
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = ch.label;
      select.appendChild(opt);
    }
  });

  main.querySelector("#apply-btn").onclick = async () => {
    const idx = parseInt(select.value, 10);
    if (!window.confirm("本当に進捗をリセットして選び直しますか？")) return;
    const ok = await resetProgressAndUnlock(user.id, idx);
    if (ok) {
      alert("進捗をリセットしました");
    } else {
      alert("リセットに失敗しました");
    }
  };
}

import { renderHeader } from "../header.js";
import { switchScreen } from "../../main.js";

export function renderFaqScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app, user);

  const main = document.createElement("main");
  main.className = "info-page";
  main.innerHTML = `
    <h1>よくある質問</h1>
    <h2>Q. 和音の選択を間違えてしまいました。最初からやり直せますか？</h2>
    <p>はい、できます。以下のボタンから和音の選び直しが可能です。<br />ただし、トレーニングの記録は全てリセットされます。</p>
    <p><button id="reselect-btn">和音を選び直す</button></p>
    <h2>Q. 初めて使います。どうすればいいですか？</h2>
    <p>「必ずお読みください」ページに使い方をまとめています。</p>
    <p><button id="guide-link">▶️ 必ずお読みください</button></p>
  `;
  app.appendChild(main);

  main.querySelector("#reselect-btn").onclick = () => switchScreen("chord_reset");
  main.querySelector("#guide-link").onclick = () => switchScreen("help");
}

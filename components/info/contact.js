import { renderHeader } from "../header.js";
import { switchScreen } from "../../main.js";

export function renderContactScreen() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app);

  const main = document.createElement("main");
  main.className = "info-page";
  main.innerHTML = `
    <h1>お問い合わせ</h1>
    <p>オトロンをご利用いただきありがとうございます。<br>
    ご不明な点やご質問は、下記のメールアドレス宛にご連絡ください。</p>
    <h2>連絡先</h2>
    <p>メールアドレス：<strong>otoron.app@example.com</strong></p>
    <p>※内容により返信まで数日いただく場合があります。<br>
    ※迷惑メールフォルダもご確認ください。</p>
    <h2>よくあるご質問</h2>
    <p>お急ぎの方は、<a href="#" id="help-link">ヘルプ・操作マニュアル</a> もあわせてご覧ください。</p>
    <hr />
    <p>2025年6月 作成</p>
  `;
  app.appendChild(main);

  const helpLink = main.querySelector('#help-link');
  helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchScreen('help');
  });
}

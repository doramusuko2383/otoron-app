import { renderHeader } from "../header.js";
import { switchScreen } from "../../main.js";

const GAS_URL = "https://script.google.com/macros/s/AKfycbxuLk3wnuOENw8lqC0oZq-rLTvH8MJbzSPeMMwDLPYNpfDg10qQ2koVcvsIiPEepLSu/exec";

export function renderContactScreen() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app);

  const main = document.createElement("main");
  main.className = "info-page";
  main.innerHTML = `
    <h1>お問い合わせ</h1>
    <form id="contact-form" class="contact-form">
      <div class="form-field">
        <label for="contact-name">お名前<span class="required">*</span></label>
        <input id="contact-name" name="name" type="text" required />
      </div>
      <div class="form-field">
        <label for="contact-email">メールアドレス<span class="required">*</span></label>
        <input id="contact-email" name="email" type="email" required />
      </div>
      <div class="form-field">
        <label for="contact-message">メッセージ<span class="required">*</span></label>
        <textarea id="contact-message" name="message" required></textarea>
      </div>
      <button type="submit">送信</button>
      <p id="contact-status" class="form-status"></p>
    </form>
    <p style="text-align:center;margin-top:1em;">
      お急ぎの方は、<a href="#" id="help-link">ヘルプ・操作マニュアル</a> もあわせてご覧ください。
    </p>
  `;

  app.appendChild(main);

  const form = main.querySelector("#contact-form");
  const statusEl = form.querySelector("#contact-status");
  const submitBtn = form.querySelector("button[type='submit']");
  const helpLink = main.querySelector('#help-link');

  helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchScreen('help');
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.textContent = "";

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();

    if (!name || !email || !message) {
      statusEl.textContent = "全ての項目を入力してください";
      statusEl.className = "form-status form-error";
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "送信中...";

    try {
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message })
      });
      form.reset();
      statusEl.textContent = "送信ありがとうございました！";
      statusEl.className = "form-status form-success";
    } catch (err) {
      console.error(err);
      statusEl.textContent = "送信に失敗しました。時間を置いて再度お試しください。";
      statusEl.className = "form-status form-error";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

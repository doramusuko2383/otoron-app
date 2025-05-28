// components/mypage.js
import { renderHeader } from "./header.js";


export function renderMyPageScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app, () => renderMyPageScreen(user));

  const container = document.createElement("div");
  container.className = "screen active mypage-screen";

  const tabHeader = document.createElement("div");
  tabHeader.className = "mypage-tabs";
  const tabs = [
    { id: "profile", label: "プロフィール変更" },
    { id: "password", label: "パスワード変更" },
    { id: "plan", label: "プラン・支払い情報" }
  ];
  tabs.forEach((t, i) => {
    const btn = document.createElement("button");
    btn.textContent = t.label;
    btn.className = "mypage-tab-button" + (i === 0 ? " active" : "");
    btn.dataset.tab = t.id;
    btn.onclick = () => showTab(t.id);
    tabHeader.appendChild(btn);
  });
  container.appendChild(tabHeader);

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "mypage-content";
  container.appendChild(contentWrapper);

  app.appendChild(container);

  function createProfileTab() {
    const div = document.createElement("div");
    div.className = "tab-section";

    // アイコン登録機能は一旦非表示

    const form = document.createElement("form");
    form.className = "profile-form";

    const nameField = createField("ユーザー名", true, () => {
      const input = document.createElement("input");
      input.type = "text";
      input.required = true;
      input.value = user?.name || "";
      return input;
    });
    form.appendChild(nameField);

    const genderField = createField("性別", false, () => {
      const select = document.createElement("select");
      ["", "おとこの子", "おんなの子", "その他"].forEach(v => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v ? v : "選択してください";
        select.appendChild(opt);
      });
      return select;
    });
    form.appendChild(genderField);

    const yearField = createField("誕生年", false, () => {
      const select = document.createElement("select");
      const current = new Date().getFullYear();
      for (let y = current; y > current - 10; y--) {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = `${y}年`;
        select.appendChild(opt);
      }
      return select;
    });
    form.appendChild(yearField);

    const emailField = createField("メールアドレス", true, () => {
      const input = document.createElement("input");
      input.type = "email";
      input.required = true;
      input.value = user?.email || "";
      return input;
    });
    form.appendChild(emailField);

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "保存";
    saveBtn.type = "submit";
    form.appendChild(saveBtn);

    div.appendChild(form);
    return div;
  }

  function createPasswordTab() {
    const div = document.createElement("div");
    div.className = "tab-section";

    const form = document.createElement("form");
    form.className = "password-form";

    const current = createField("現在のパスワード", true, () => {
      const input = document.createElement("input");
      input.type = "password";
      input.required = true;
      return input;
    });
    form.appendChild(current);

    const newpass = createField("新しいパスワード", true, () => {
      const input = document.createElement("input");
      input.type = "password";
      input.required = true;
      input.id = "new-pass";
      return input;
    });
    form.appendChild(newpass);

    const confirm = createField("新しいパスワード（確認）", true, () => {
      const input = document.createElement("input");
      input.type = "password";
      input.required = true;
      input.id = "confirm-pass";
      return input;
    });
    form.appendChild(confirm);

    const btn = document.createElement("button");
    btn.textContent = "変更する";
    btn.disabled = true;
    btn.type = "submit";
    form.appendChild(btn);

    form.addEventListener("input", () => {
      const np = form.querySelector("#new-pass").value;
      const cp = form.querySelector("#confirm-pass").value;
      btn.disabled = !(np && cp && np === cp);
    });

    div.appendChild(form);
    return div;
  }

  function createPlanTab() {
    const div = document.createElement("div");
    div.className = "tab-section";

    const info = document.createElement("div");
    info.className = "plan-info";
    info.innerHTML = `
      <p>現在のプラン: <strong>プレミアム</strong></p>
      <p>金額: <strong>500円/月</strong></p>
      <p>次回請求日: <strong>2024-09-01</strong></p>
      <p>有効期限: <strong>2024-09-30</strong></p>
      <p>支払い方法: <strong>Visa •••• 4242</strong></p>
    `;
    div.appendChild(info);

    const btnWrap = document.createElement("div");
    btnWrap.className = "plan-buttons";
    [
      { id: "change", label: "プランを変更する" },
      { id: "cancel", label: "プレミア解約する" },
      { id: "leave", label: "退会する" }
    ].forEach(b => {
      const btn = document.createElement("button");
      btn.textContent = b.label;
      btnWrap.appendChild(btn);
    });
    div.appendChild(btnWrap);
    return div;
  }

  function createField(labelText, required, inputFactory) {
    const wrapper = document.createElement("div");
    wrapper.className = "form-field";

    const label = document.createElement("label");
    label.textContent = labelText;
    const badge = document.createElement("span");
    badge.className = required ? "required" : "optional";
    badge.textContent = required ? "必須" : "任意";
    label.appendChild(badge);
    wrapper.appendChild(label);
    wrapper.appendChild(inputFactory());
    return wrapper;
  }

  const sections = {
    profile: createProfileTab(),
    password: createPasswordTab(),
    plan: createPlanTab()
  };

  function showTab(id) {
    contentWrapper.innerHTML = "";
    Object.values(tabHeader.children).forEach(btn =>
      btn.classList.toggle("active", btn.dataset.tab === id)
    );
    contentWrapper.appendChild(sections[id]);
  }

  showTab("profile");
}

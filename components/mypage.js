// components/mypage.js
import { renderHeader } from "./header.js";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  linkWithCredential,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseAuth } from "../firebase/firebase-init.js";
import { startCheckout } from "../utils/stripeCheckout.js";

export function renderMyPageScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app, () => renderMyPageScreen(user));

  const container = document.createElement("div");
  container.className = "screen active mypage-screen";

  const tabHeader = document.createElement("div");
  tabHeader.className = "mypage-tabs";

  const firebaseUser = firebaseAuth.currentUser;
  const hasPassword = firebaseUser?.providerData.some(
    (p) => p.providerId === "password"
  );
  const googleOnly =
    firebaseUser?.providerData.some((p) => p.providerId === "google.com") &&
    !hasPassword;

  const tabs = [
    { id: "profile", label: "プロフィール変更" },
    ...(hasPassword ? [{ id: "password", label: "パスワード変更" }] : []),
    { id: "plan", label: "プラン・支払い情報" },
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

    const emailField = googleOnly
      ? createField("ログインメールアドレス（変更不可）", null, () => {
          const span = document.createElement("div");
          span.className = "email-readonly";
          span.textContent = firebaseUser.email || user?.email || "";
          return span;
        })
      : createField("メールアドレス", true, () => {
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

    function createPasswordField(label, id) {
      const field = document.createElement("div");
      field.className = "form-field";

      const labelEl = document.createElement("label");
      labelEl.textContent = label;
      const badge = document.createElement("span");
      badge.className = "required";
      badge.textContent = "必須";
      labelEl.appendChild(badge);
      field.appendChild(labelEl);

      const wrap = document.createElement("div");
      wrap.className = "password-input-wrap";

      const input = document.createElement("input");
      input.type = "password";
      input.required = true;
      input.id = id;
      if (id === "current-pass") {
        input.value = sessionStorage.getItem("currentPassword") || "";
      }

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "toggle-password";
      toggle.textContent = "\u{1F441}"; // eye icon
      toggle.onclick = () => {
        const hidden = input.type === "password";
        input.type = hidden ? "text" : "password";
        toggle.textContent = hidden ? "\u{1F648}" : "\u{1F441}"; // 🙈 / 👁
      };

      wrap.appendChild(input);
      wrap.appendChild(toggle);
      field.appendChild(wrap);

      return { field, input };
    }

    const current = createPasswordField("現在のパスワード", "current-pass");
    form.appendChild(current.field);

    const newpass = createPasswordField("新しいパスワード", "new-pass");
    form.appendChild(newpass.field);

    const confirm = createPasswordField("新しいパスワード（確認）", "confirm-pass");
    const errorMsg = document.createElement("div");
    errorMsg.className = "password-error";
    errorMsg.textContent = "確認用パスワードが一致しません";
    errorMsg.style.display = "none";
    confirm.field.insertBefore(errorMsg, confirm.field.querySelector(".password-input-wrap"));
    form.appendChild(confirm.field);

    const btn = document.createElement("button");
    btn.textContent = "変更する";
    btn.disabled = true;
    btn.type = "submit";
    form.appendChild(btn);

    function validate() {
      const np = newpass.input.value;
      const cp = confirm.input.value;
      if (!np || !cp) {
        errorMsg.style.display = "none";
        btn.disabled = true;
        return;
      }
      if (np !== cp) {
        errorMsg.style.display = "block";
        btn.disabled = true;
      } else {
        errorMsg.style.display = "none";
        btn.disabled = false;
      }
    }

    form.addEventListener("input", validate);
    validate();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPw = form.querySelector("#current-pass").value;
      const newPw = form.querySelector("#new-pass").value;

      try {
        const cred = EmailAuthProvider.credential(
          firebaseUser.email,
          currentPw
        );
        await reauthenticateWithCredential(firebaseUser, cred);
        await updatePassword(firebaseUser, newPw);
        sessionStorage.setItem("currentPassword", newPw);
        alert("パスワードを変更しました");
        form.reset();
        current.input.value = newPw;
        validate();
      } catch (err) {
        alert("パスワード変更に失敗しました: " + err.message);
      }
    });

    div.appendChild(form);
    return div;
  }

  function createPasswordGuide() {
    const div = document.createElement("div");
    div.className = "tab-section password-guide";
    const p1 = document.createElement("p");
    p1.textContent = "このアカウントではパスワードは設定されていません。";
    const p2 = document.createElement("p");
    const linkBtn = document.createElement("button");
    linkBtn.textContent = "こちら";
    linkBtn.type = "button";
    linkBtn.onclick = async () => {
      const newPw = prompt("追加するパスワードを入力してください");
      if (!newPw) return;
      try {
        const cred = EmailAuthProvider.credential(firebaseUser.email, newPw);
        await linkWithCredential(firebaseUser, cred);
        alert("パスワードを追加しました");
        location.reload();
      } catch (err) {
        alert("追加に失敗しました: " + err.message);
      }
    };
    p2.textContent = "メールアドレス＋パスワードでのログインを追加する場合は";
    p2.appendChild(linkBtn);
    p2.appendChild(document.createTextNode("。"));
    div.appendChild(p1);
    div.appendChild(p2);
    return div;
  }

  function createPlanTab() {
    const div = document.createElement("div");
    div.className = "tab-section";

    const subscribeBtn = document.createElement("button");
    subscribeBtn.textContent = "月額プランに登録";
    subscribeBtn.onclick = startCheckout;

    const wrap = document.createElement("div");
    wrap.className = "plan-buttons";
    wrap.appendChild(subscribeBtn);
    div.appendChild(wrap);

    return div;
  }

  function createField(labelText, required, inputFactory) {
    const wrapper = document.createElement("div");
    wrapper.className = "form-field";

    const label = document.createElement("label");
    label.textContent = labelText;
    if (required !== null) {
      const badge = document.createElement("span");
      badge.className = required ? "required" : "optional";
      badge.textContent = required ? "必須" : "任意";
      label.appendChild(badge);
    }
    wrapper.appendChild(label);
    wrapper.appendChild(inputFactory());
    return wrapper;
  }

  const sections = {
    profile: createProfileTab(),
    ...(hasPassword ? { password: createPasswordTab() } : {}),
    plan: createPlanTab(),
  };

  if (!hasPassword) {
    const guide = createPasswordGuide();
    container.insertBefore(guide, contentWrapper);
  }

  function showTab(id) {
    contentWrapper.innerHTML = "";
    Object.values(tabHeader.children).forEach(btn =>
      btn.classList.toggle("active", btn.dataset.tab === id)
    );
    contentWrapper.appendChild(sections[id]);
  }

  showTab("profile");
}

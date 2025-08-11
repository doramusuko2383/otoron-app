// components/mypage.js
import { renderHeader } from "./header.js";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseAuth } from "../firebase/firebase-init.js";
import { isPasswordUser } from "../utils/authHelpers.js";
import { startCheckout } from "../utils/stripeCheckout.js";
import { whenAuthSettled } from "../utils/authReady.js";
import { supabase } from "../utils/supabaseClient.js";
import { switchScreen } from "../main.js";
import { createPlanInfoContent } from "./planInfo.js";
import { showCustomAlert } from "./home.js";

async function changeEmailFlow(newEmail, currentPassword) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("not signed in");

  if (!isPasswordUser(user)) return;

  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);

  await verifyBeforeUpdateEmail(user, newEmail);

  showCustomAlert(
    "確認メールを送信しました。メール内のリンクを開くとメールアドレスが更新されます。"
  );
}

export function renderMyPageScreen(user) {
  if (!window.currentUser) return;
  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app, user);

  const container = document.createElement("div");
  container.className = "screen active mypage-screen";

  const tabHeader = document.createElement("div");
  tabHeader.className = "mypage-tabs";

  const firebaseUser = firebaseAuth.currentUser;
  const hasPassword = isPasswordUser(firebaseUser);

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

    let emailField;
    if (hasPassword) {
      emailField = createField("メールアドレス", true, () => {
        const input = document.createElement("input");
        input.type = "email";
        input.required = true;
        input.value = user?.email || "";
        return input;
      });
      form.appendChild(emailField);
    }

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "保存";
    saveBtn.type = "submit";
    form.appendChild(saveBtn);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = nameField.querySelector("input").value.trim();
      const emailInput = hasPassword ? emailField.querySelector("input") : null;
      const email = emailInput ? emailInput.value.trim() : firebaseUser.email;

      try {
        const updates = { name };
        if (hasPassword) updates.email = email;

        const { data, error } = await supabase
          .from("users")
          .update(updates)
          .eq("id", user.id)
          .select()
          .maybeSingle();

        if (error) throw error;

        let emailChanged = false;
        if (hasPassword && firebaseUser.email !== email) {
          const currentPw = sessionStorage.getItem("currentPassword");
          await changeEmailFlow(email, currentPw);
          emailChanged = true;
        }

        const updated = data || { ...user, ...updates };
        if (!emailChanged) {
          showCustomAlert("プロフィールを更新しました");
        }
        switchScreen("mypage", updated, { replace: true });
      } catch (err) {
        showCustomAlert("更新に失敗しました: " + err.message);
      }
    });

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

      const input = document.createElement("input");
      input.type = "password";
      input.required = true;
      input.id = id;
      if (id === "current-pass") {
        input.value = sessionStorage.getItem("currentPassword") || "";
      }

      const wrap = document.createElement("div");
      wrap.className = "password-wrapper";
      const toggle = document.createElement("img");
      toggle.src = "images/Visibility_off.svg";
      toggle.alt = "表示切替";
      toggle.className = "toggle-password";
      wrap.appendChild(input);
      wrap.appendChild(toggle);
      field.appendChild(wrap);

      toggle.addEventListener("click", () => {
        const visible = input.type === "text";
        input.type = visible ? "password" : "text";
        toggle.src = visible ? "images/Visibility_off.svg" : "images/Visibility.svg";
      });

      return { field, input };
    }

    const current = createPasswordField("現在のパスワード", "current-pass");
    form.appendChild(current.field);

    const newpass = createPasswordField("新しいパスワード", "new-pass");
    form.appendChild(newpass.field);

    const confirm = createPasswordField("新しいパスワード（確認）", "confirm-pass");

    const lengthMsg = document.createElement("div");
    lengthMsg.className = "password-error";
    lengthMsg.textContent = "パスワードは6文字以上で入力してください";
    lengthMsg.style.display = "none";
    const newWrapper = newpass.field.querySelector(".password-wrapper");
    newpass.field.insertBefore(lengthMsg, newWrapper);

    const errorMsg = document.createElement("div");
    errorMsg.className = "password-error";
    errorMsg.textContent = "確認用パスワードが一致しません";
    errorMsg.style.display = "none";
    const wrapper = confirm.field.querySelector(".password-wrapper");
    confirm.field.insertBefore(errorMsg, wrapper);
    form.appendChild(confirm.field);

    const btn = document.createElement("button");
    btn.textContent = "変更する";
    btn.disabled = true;
    btn.type = "submit";
    form.appendChild(btn);

    function validate() {
      const cur = current.input.value;
      const np = newpass.input.value;
      const cp = confirm.input.value;

      let valid = true;

      if (np.length < 6) {
        lengthMsg.style.display = "block";
        valid = false;
      } else {
        lengthMsg.style.display = "none";
      }

      if (np && cp && np !== cp) {
        errorMsg.style.display = "block";
        valid = false;
      } else {
        errorMsg.style.display = "none";
      }

      if (!cur || !np || !cp) {
        valid = false;
      }

      btn.disabled = !valid;
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
        showCustomAlert("パスワードを変更しました");
        form.reset();
        current.input.value = newPw;
        validate();
      } catch (err) {
        showCustomAlert("パスワード変更に失敗しました: " + err.message);
      }
    });

    div.appendChild(form);
    return div;
  }

  function createPlanTab() {
    const div = document.createElement("div");
    div.className = "tab-section";
    if (user.is_premium) {
      createPlanInfoContent(user).then((content) => div.appendChild(content));
      return div;
    }

    const plans = [
      {
        key: "plan12",
        months: 12,
        monthly: 990,
        total: 11880,
        benefit: "約4ヶ月分お得",
        recommended: true,
      },
      {
        key: "plan6",
        months: 6,
        monthly: 1290,
        total: 7740,
        benefit: "約1ヶ月分お得",
        recommended: false,
      },
      {
        key: "plan1",
        months: 1,
        monthly: 1490,
        total: 1490,
        benefit: "",
        recommended: false,
      },
    ];

    const wrap = document.createElement("div");
    wrap.className = "pricing-page";

    plans.forEach((p) => {
      const card = document.createElement("div");
      card.className = "plan-card" + (p.recommended ? " recommended" : "");

      if (p.recommended) {
        const rec = document.createElement("div");
        rec.className = "recommend-badge";
        rec.textContent = "おすすめ";
        card.appendChild(rec);
      }

      const title = document.createElement("div");
      title.className = "plan-title";
      title.textContent = p.title || `${p.months}ヶ月プラン`;
      card.appendChild(title);

      const price = document.createElement("div");
      price.className = "monthly-price";
      price.textContent = `税込 ${p.monthly.toLocaleString()}円／月`;
      card.appendChild(price);

      const total = document.createElement("div");
      total.className = "total-price";
      total.textContent = `一括：${p.total.toLocaleString()}円`;
      card.appendChild(total);

      if (p.benefit) {
        const badge = document.createElement("div");
        badge.className = "plan-badge";
        badge.textContent = p.benefit;
        card.appendChild(badge);
      }

      const btn = document.createElement("button");
      btn.className = "choose-plan";
      btn.textContent = "このプランを選ぶ";
      btn.disabled = true;
      onAuthStateChanged(firebaseAuth, (u) => {
        btn.disabled = !u;
      });
      btn.onclick = async () => {
        if (btn.disabled) return;
        btn.disabled = true;
        const u = await whenAuthSettled(4000);
        if (!u?.email) {
          showCustomAlert('サインインを確認しています。数秒後にもう一度お試しください。');
          btn.disabled = false;
          return;
        }
        await startCheckout(p.key, btn);
      };
      card.appendChild(btn);

      wrap.appendChild(card);
    });

    const note = document.createElement("p");
    note.className = "plan-note";
    note.textContent = "※ プランの料金は、登録時に一括でお支払いいただきます";
    wrap.appendChild(note);

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


  function showTab(id) {
    contentWrapper.innerHTML = "";
    Object.values(tabHeader.children).forEach(btn =>
      btn.classList.toggle("active", btn.dataset.tab === id)
    );
    contentWrapper.appendChild(sections[id]);
  }

  showTab("profile");
}

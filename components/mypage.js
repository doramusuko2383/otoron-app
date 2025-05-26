// components/mypage.js
import { renderHeader } from "./header.js";
import { supabase } from "../utils/supabaseClient.js";
import { firebaseAuth } from "../firebase/firebase-init.js";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export async function renderMyPageScreen(user) {
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

  const firebaseUser = firebaseAuth.currentUser;
  let dbUser = null;
  if (firebaseUser) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("firebase_uid", firebaseUser.uid)
      .maybeSingle();
    if (error) {
      console.error("❌ ユーザー取得失敗:", error);
    } else {
      dbUser = data;
    }
  }

  function createProfileTab() {
    const div = document.createElement("div");
    div.className = "tab-section";

    const imgWrap = document.createElement("div");
    imgWrap.className = "profile-image-wrap";
    const img = document.createElement("img");
    img.src = dbUser?.avatar_url || "images/otolon_face.png";
    img.className = "profile-image";
    imgWrap.appendChild(img);
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        img.src = URL.createObjectURL(file);
      }
    };
    imgWrap.appendChild(fileInput);
    div.appendChild(imgWrap);

    const form = document.createElement("form");
    form.className = "profile-form";

    const nameField = createField("ユーザー名", true, () => {
      const input = document.createElement("input");
      input.type = "text";
      input.required = true;
      input.value = dbUser?.name || "";
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
      select.value = dbUser?.gender || "";
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
      if (dbUser?.birth_year) select.value = dbUser.birth_year;
      return select;
    });
    form.appendChild(yearField);

    const emailField = createField("メールアドレス", true, () => {
      const input = document.createElement("input");
      input.type = "email";
      input.required = true;
      input.value = firebaseUser?.email || "";
      input.readOnly = true;
      return input;
    });
    form.appendChild(emailField);

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "保存";
    saveBtn.type = "submit";
    form.appendChild(saveBtn);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!dbUser) return;
      const name = nameField.querySelector("input").value.trim();
      const gender = genderField.querySelector("select").value || null;
      const birthYearValue = yearField.querySelector("select").value;
      const birth_year = birthYearValue ? parseInt(birthYearValue) : null;

      let avatar_url = dbUser.avatar_url || null;
      const file = fileInput.files[0];
      if (file && firebaseUser) {
        const ext = file.name.split(".").pop();
        const filePath = `${firebaseUser.uid}.${ext}`;
        console.log("🟡 Avatar upload start", {
          filePath,
          type: file.type,
          size: file.size,
        });
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
          });
        console.log("🟢 Avatar upload result", { uploadData, uploadError });
        if (uploadError) {
          console.error("❌ Avatar upload error:", uploadError);
          alert("画像アップロード失敗: " + uploadError.message);
        } else {
          const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
          avatar_url = data.publicUrl;
          img.src = avatar_url;
        }
      }

      console.log("🟢 Updating user profile", {
        name,
        gender,
        birth_year,
        avatar_url,
      });
      const { data: updated, error } = await supabase
        .from("users")
        .update({ name, gender, birth_year, avatar_url })
        .eq("id", dbUser.id)
        .select()
        .single();

      if (error) {
        console.error("❌ ユーザー更新失敗:", error);
        alert("保存に失敗しました: " + error.message);
      } else {
        console.log("✅ プロフィール更新成功:", updated);
        alert("保存しました");
        dbUser = updated;
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

    const current = createField("現在のパスワード", true, () => {
      const input = document.createElement("input");
      input.type = "password";
      input.required = true;
      input.id = "current-pass";
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

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPw = form.querySelector("#current-pass").value;
      const newPw = form.querySelector("#new-pass").value;
      const user = firebaseAuth.currentUser;
      if (!user) return;
      try {
        const cred = EmailAuthProvider.credential(user.email, currentPw);
        await reauthenticateWithCredential(user, cred);
        await updatePassword(user, newPw);
        alert("パスワードを変更しました");
        form.reset();
        btn.disabled = true;
      } catch (err) {
        alert("パスワード変更失敗: " + err.message);
      }
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

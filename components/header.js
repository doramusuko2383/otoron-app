import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseAuth } from "../firebase/firebase-init.js"; // ✅ これだけでOK
import { switchScreen } from "../main.js";
import { checkRecentUnlockCriteria } from "../utils/progressStatus.js";
import { loadGrowthFlags } from "../utils/growthStore_supabase.js";
import { getCurrentTargetChord } from "../utils/growthUtils.js";
import { supabase } from "../utils/supabaseClient.js";
import { showCustomAlert } from "./home.js";

export function renderHeader(container, user) {
  const header = document.createElement("header");
  header.className = "app-header";
  header.innerHTML = `
    <button class="home-icon" id="home-button">
      <img src="images/otolon_face.webp" alt="ホーム" />
    </button>

    <button class="training-header-button" id="training-button">
      とれーにんぐ
    </button>

    <div class="header-right">
      <div class="info-menu">
        <button id="info-menu-btn" aria-label="インフォメーション">ℹ️</button>
        <div id="info-dropdown" class="info-dropdown">
          <button id="terms-btn">利用規約</button>
          <button id="privacy-btn">プライバシーポリシー</button>
          <button id="contact-btn">お問い合わせ</button>
          <button id="help-btn">ヘルプ</button>
          <button id="law-btn">特定商取引法に基づく表示</button>
          <button id="external-btn">外部送信ポリシー</button>
        </div>
      </div>

      <div class="parent-menu">
        <button id="parent-menu-btn" aria-label="設定">⚙️</button>
        <div id="parent-dropdown" class="parent-dropdown">
          <div class="user-info" style="display:none"></div>
          <button id="settings-btn">⚙️ 設定</button>
          <button id="summary-btn">📊 分析画面</button>
          <button id="growth-btn">🌱 育成モード</button>
          <button id="mypage-btn">👤 マイページ</button>
          <button id="pricing-btn">💳 プラン</button>
          <button id="logout-btn">🚪 ログアウト</button>
        </div>
      </div>
    </div>
  `;

  // ▼ ドロップダウン制御（クリックで開閉）
  const parentMenuBtn = header.querySelector("#parent-menu-btn");
  const dropdown = header.querySelector("#parent-dropdown");
  const infoMenuBtn = header.querySelector("#info-menu-btn");
  const infoDropdown = header.querySelector("#info-dropdown");
  const termsBtn = header.querySelector("#terms-btn");
  const privacyBtn = header.querySelector("#privacy-btn");
  const contactBtn = header.querySelector("#contact-btn");
  const helpBtn = header.querySelector("#help-btn");
  const lawBtn = header.querySelector("#law-btn");
  const externalBtn = header.querySelector("#external-btn");

  parentMenuBtn.onclick = (e) => {
    e.stopPropagation();
    const willShow = !dropdown.classList.contains("show");
    dropdown.classList.toggle("show");
    if (willShow) {
      infoDropdown.classList.remove("show");
    }
  };

  infoMenuBtn.onclick = (e) => {
    e.stopPropagation();
    const willShow = !infoDropdown.classList.contains("show");
    infoDropdown.classList.toggle("show");
    if (willShow) {
      dropdown.classList.remove("show");
    }
  };

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== parentMenuBtn) {
      dropdown.classList.remove("show");
    }
    if (!infoDropdown.contains(e.target) && e.target !== infoMenuBtn) {
      infoDropdown.classList.remove("show");
    }
  });

  // ▼ 情報ページ遷移
  termsBtn.onclick = () => switchScreen("terms");
  privacyBtn.onclick = () => switchScreen("privacy");
  contactBtn.onclick = () => switchScreen("contact");
  helpBtn.onclick = () => switchScreen("help");
  lawBtn.onclick = () => switchScreen("law");
  externalBtn.onclick = () => switchScreen("external");

  // ▼ ホームアイコン → ホーム画面へ
  header.querySelector("#home-button").onclick = () => switchScreen("home");

  // ▼ とれーにんぐボタン → トレーニング画面へ
  header.querySelector("#training-button").onclick = () => switchScreen("training");

  // ▼ その他画面遷移
  header.querySelector("#settings-btn").onclick = () => switchScreen("settings");
  header.querySelector("#summary-btn").onclick = () => switchScreen("result");
  header.querySelector("#growth-btn").onclick = () => switchScreen("growth");
  const pricingBtn = header.querySelector("#pricing-btn");
  if (pricingBtn) {
    if (user && !user.is_premium) {
      pricingBtn.onclick = () => switchScreen("pricing");
    } else {
      pricingBtn.style.display = "none";
    }
  }

  header.querySelector("#mypage-btn").onclick = () => switchScreen("mypage");

  const userDiv = header.querySelector(".user-info");
  if (userDiv) {
    const name =
      user?.name ||
      firebaseAuth.currentUser?.displayName ||
      firebaseAuth.currentUser?.email;
    if (name) {
      const icon = user?.is_premium ? "⭐ " : "";
      userDiv.textContent = icon + name;
      userDiv.style.display = "block";
    }
  }

  // ▼ 解放条件を満たした場合の通知バッジ
  if (user) {
    Promise.all([
      checkRecentUnlockCriteria(user.id),
      loadGrowthFlags(user.id),
    ])
      .then(([canUnlock, flags]) => {
        const target = getCurrentTargetChord(flags);
        if (canUnlock && target) {
          const dot = document.createElement("span");
          dot.className = "notify-dot";
          parentMenuBtn.appendChild(dot);

          const badge = document.createElement("span");
          badge.className = "notify-badge";
          badge.textContent = "!";
          header.querySelector("#growth-btn").appendChild(badge);
        }
      })
      .catch((e) => console.error("notify", e));
  }
  // ▼ ログアウト処理
  header.querySelector("#logout-btn").addEventListener("click", async () => {
    try {
      await signOut(firebaseAuth);
      try {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          console.error("❌ Supabaseサインアウト失敗:", signOutError.message);
        }
      } catch (e) {
        console.error("❌ Supabaseサインアウト処理でエラー:", e);
      }
      sessionStorage.removeItem("currentPassword");
      showCustomAlert("ログアウトしました！", () => {
        switchScreen("intro");
      });
    } catch (e) {
      showCustomAlert("ログアウトに失敗しました：" + e.message);
    }
  });

  // ▼ ヘッダーを最上部に追加
  container.prepend(header);
  container.classList.add("with-header");
}

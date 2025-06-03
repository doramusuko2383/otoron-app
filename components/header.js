import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseAuth } from "../firebase/firebase-init.js"; // ✅ これだけでOK
import { switchScreen } from "../main.js";

export function renderHeader(container) {
  const header = document.createElement("header");
  header.className = "app-header";
  header.innerHTML = `
    <button class="home-icon" id="home-button">
      <img src="images/otolon_face.webp" alt="ホーム" />
    </button>

    <button class="training-header-button" id="training-button">
      とれーにんぐ
    </button>

    <div class="parent-menu">
      <button id="parent-menu-btn" aria-label="設定">⚙️</button>
      <div id="parent-dropdown" class="parent-dropdown">
        <button id="settings-btn">⚙️ 設定</button>
        <button id="summary-btn">📊 分析画面</button>
        <button id="mypage-btn">👤 マイページ</button>
        <button id="growth-btn">🌱 育成モード</button>
        <button id="logout-btn">🚪 ログアウト</button>
      </div>
    </div>

    <div class="info-menu">
      <button id="info-menu-btn" aria-label="インフォメーション">ℹ️</button>
      <div id="info-dropdown" class="info-dropdown">
        <a href="terms.html">利用規約</a>
        <a href="privacy.html">プライバシーポリシー</a>
        <a href="contact.html">お問い合わせ</a>
        <a href="law.html">特定商取引法に基づく表示</a>
        <a href="external.html">外部送信ポリシー</a>
      </div>
    </div>
  `;

  // ▼ ドロップダウン制御（クリックで開閉）
  const parentMenuBtn = header.querySelector("#parent-menu-btn");
  const dropdown = header.querySelector("#parent-dropdown");
  const infoMenuBtn = header.querySelector("#info-menu-btn");
  const infoDropdown = header.querySelector("#info-dropdown");

  parentMenuBtn.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  };

  infoMenuBtn.onclick = (e) => {
    e.stopPropagation();
    infoDropdown.classList.toggle("show");
  };

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== parentMenuBtn) {
      dropdown.classList.remove("show");
    }
    if (!infoDropdown.contains(e.target) && e.target !== infoMenuBtn) {
      infoDropdown.classList.remove("show");
    }
  });

  // ▼ ホームアイコン → ホーム画面へ
  header.querySelector("#home-button").onclick = () => switchScreen("home");

  // ▼ とれーにんぐボタン → トレーニング画面へ
  header.querySelector("#training-button").onclick = () => switchScreen("training");

  // ▼ その他画面遷移
  header.querySelector("#settings-btn").onclick = () => switchScreen("settings");
  header.querySelector("#summary-btn").onclick = () => switchScreen("result");
  header.querySelector("#growth-btn").onclick = () => switchScreen("growth");

  header.querySelector("#mypage-btn").onclick = () => switchScreen("mypage");
  // ▼ ログアウト処理
  header.querySelector("#logout-btn").addEventListener("click", async () => {
    try {
      await signOut(firebaseAuth);
      sessionStorage.removeItem("currentPassword");
      alert("ログアウトしました！");
      switchScreen("intro");
    } catch (e) {
      alert("ログアウトに失敗しました：" + e.message);
    }
  });

  // ▼ ヘッダーを最上部に追加
  container.prepend(header);
  container.classList.add("with-header");
}

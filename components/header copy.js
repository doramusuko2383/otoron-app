import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "../firebase/firebase-init.js";
import { renderLoginScreen } from "./login.js";

export function renderHeader(container, onLogout) {
  const header = document.createElement("header");
  header.className = "app-header";
  header.innerHTML = `
    <div class="header-left">🎵 オトロン</div>
    <div class="header-right"><button class="logout-btn">ログアウト</button></div>
  `;

  header.querySelector(".logout-btn").addEventListener("click", async () => {
    await signOut(auth);
    const app = document.getElementById("app");
    renderLoginScreen(app, onLogout);
  });

  container.prepend(header);
}

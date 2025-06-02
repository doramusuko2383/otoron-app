// logic/growth.js

import { switchScreen } from "../main.js";
import {
  getToday,
  isQualifiedToday,
  getPassedDays,
  getCurrentTargetChord,
  applyRecommendedSelection,
  forceUnlock
} from "../utils/growthUtils.js";
import {
  loadGrowthFlags,
  generateMockGrowthData
} from "../utils/growthStore_supabase.js";
import { chords } from "../data/chords.js";
import { renderHeader } from "../components/header.js";
import { unlockChord, resetChordProgressToRed } from "../utils/progressUtils.js";
import { getAudio } from "../utils/audioCache.js";
import { updateGrowthStatusBar } from "../utils/progressStatus.js";
import { showCustomConfirm } from "../components/home.js";

export async function renderGrowthScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  renderHeader(app, () => renderGrowthScreen(user));

  const container = document.createElement("div");
  container.className = "screen active";

  const today = getToday();
  const passed = await getPassedDays(user.id);
  const qualifiedToday = await isQualifiedToday(user.id);
  const flags = await loadGrowthFlags(user.id);
  const target = getCurrentTargetChord(flags); // ← chordOrder に沿った未解放の最初の1つ

  const title = document.createElement("h2");
  title.textContent = "🎯 育成モード進捗と履歴";
  container.appendChild(title);

  const info = document.createElement("p");
  info.className = "today-info";
  info.innerHTML = `
    今日の日付: <strong>${today}</strong><br/>
    今日の状態: ${qualifiedToday ? "✅ 合格済み" : "❌ 未合格"}
  `;
  container.appendChild(info);

  const statusBar = document.createElement("div");
  statusBar.className = "status-bar";

  const unlockCard = document.createElement("div");
  unlockCard.className = "unlock-card";
  unlockCard.id = "unlockCard";

  const msgSpan = document.createElement("div");
  msgSpan.id = "growth-message";

  const unlockBtn = document.createElement("div");
  unlockBtn.id = "unlockBtn";
  unlockBtn.className = "unlock-button";
  unlockBtn.textContent = "解放する";
  unlockBtn.style.display = "none";

  const progressEl = document.createElement("div");
  progressEl.className = "progress";
  unlockBtn.appendChild(progressEl);

  unlockCard.appendChild(msgSpan);
  unlockCard.appendChild(unlockBtn);
  statusBar.appendChild(unlockCard);
  container.appendChild(statusBar);

  // ⭐ 進捗を星で表示
  const progressWrapper = document.createElement("div");
  progressWrapper.className = "progress-bar";

  const face = document.createElement("img");
  face.src = "images/otolon_face.webp";
  face.alt = "オトロン";
  face.className = "face-icon";
  progressWrapper.appendChild(face);

  const progressBar = document.createElement("div");
  progressBar.className = "growth-progress";

  const starsWrapper = document.createElement("div");
  starsWrapper.className = "stars";

  const filled = Math.max(0, Math.min(passed, 7));
  for (let i = 0; i < 7; i++) {
    const star = document.createElement("span");
    star.className = "star";
    star.textContent = "★";
    if (i < filled) star.classList.add("filled");
    starsWrapper.appendChild(star);
  }

  progressBar.appendChild(starsWrapper);
  progressWrapper.appendChild(progressBar);
  container.appendChild(progressWrapper);

  // 🛠 デバッグ機能
  const debugPanel = document.createElement("div");
  debugPanel.style.marginBottom = "1em";

  const actionSelect = document.createElement("select");
  [
    { value: "", label: "デバッグ機能（本番モードでは削除）" },
    { value: "reset", label: "進捗をリセット（赤のみ）" },
    { value: "unlock", label: "次の和音を解放" },
    { value: "mock4", label: "モック記録生成（4日分合格）" },
    { value: "mock7", label: "モック記録生成（7日分合格）" }
  ].forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    actionSelect.appendChild(o);
  });

  actionSelect.onchange = async () => {
    const val = actionSelect.value;
    actionSelect.value = "";
    if (!val) return;
    if (val === "reset") {
      const ok = confirm("本当に進捗を赤だけに戻しますか？");
      if (ok) {
        const success = await resetChordProgressToRed(user.id);
        alert(success ? "進捗をリセットしました" : "リセットに失敗しました");
      }
    } else if (val === "unlock") {
      const freshFlags = await loadGrowthFlags(user.id);
      const next = getCurrentTargetChord(freshFlags);
      if (next) {
        await unlockChord(user.id, next.key);
        await applyRecommendedSelection(user.id);
        forceUnlock();
        alert(`${next.label} を解放しました`);
      } else {
        alert("すべての和音が解放されています");
      }
    } else if (val === "mock4") {
      await generateMockGrowthData(user.id, 4);
      alert("モックデータ(4日分)を生成しました");
    } else if (val === "mock7") {
      await generateMockGrowthData(user.id, 7);
      alert("モックデータ(7日分)を生成しました");
    }
    await renderGrowthScreen(user);
  };

  debugPanel.appendChild(actionSelect);
  container.appendChild(debugPanel);


  // 和音進捗表示
  const chordStatus = document.createElement("div");
  chordStatus.style.display = "grid";
  chordStatus.style.gridTemplateColumns = "repeat(auto-fit, minmax(90px, 1fr))";
  chordStatus.style.gap = "10px";
  chordStatus.style.marginTop = "1.5em";

  for (const chord of chords) {
    const item = document.createElement("div");
    item.style.textAlign = "center";

    const circle = document.createElement("div");
    circle.classList.add("growth-chord-circle");

    const isUnlocked = flags[chord.key]?.unlocked === true;

    if (chord.type === "black-inv") {
      circle.classList.add("growth-locked");
      if (isUnlocked) {
        circle.textContent = "✅";
      }
    } else {
      if (isUnlocked) {
        circle.classList.add(chord.colorClass);
      } else {
        circle.classList.add("growth-locked");
      }
    }

    circle.onclick = () => {
      if (chord.file) {
        const audio = getAudio(`audio/${chord.file}`);
        audio.play();
      }
    };

    const label = document.createElement("div");
    label.style.fontSize = "0.85em";
    label.textContent = chord.label;

    item.appendChild(circle);
    item.appendChild(label);


    chordStatus.appendChild(item);
  }

  container.appendChild(chordStatus);

  // ✅ 全和音が解放済みだった場合の表示（解放ボタンなし）
  if (!target) {
    const done = document.createElement("p");
    done.textContent = "🎉 すべての和音が解放されています！";
    done.style.margin = "1.5em auto";
    done.style.textAlign = "center";
    done.style.color = "#666";
    container.appendChild(done);
  }


  const backBtn = document.createElement("button");
  backBtn.textContent = "🏠 ホームに戻る";
  backBtn.onclick = () => switchScreen("home", user);
  backBtn.style.marginTop = "2em";
  container.appendChild(backBtn);

  app.appendChild(container);

  await updateGrowthStatusBar(user, target, async () => {
    await renderGrowthScreen(user);
  });
}

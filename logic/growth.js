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
import { deleteTrainingDataThisWeek } from "../utils/trainingStore_supabase.js";
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

  // 🎲 すごろく形式の進捗ボード
  const board = document.createElement("div");
  board.className = "sugoroku-board";

  const stepCount = 8; // 0-7
  const filled = Math.max(0, Math.min(passed, stepCount - 1));

  // 波線SVG
  const spacing = 80;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("sugoroku-line");
  svg.setAttribute("viewBox", `0 0 ${(stepCount - 1) * spacing} 60`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "60");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  let d = "M0 30";
  for (let i = 1; i < stepCount; i++) {
    const x = i * spacing;
    const cpX = x - spacing / 2;
    const cpY = i % 2 === 0 ? 10 : 50;
    d += ` Q ${cpX} ${cpY} ${x} 30`;
  }
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#5b4636");
  path.setAttribute("stroke-width", "4");
  path.setAttribute("stroke-linecap", "round");
  svg.appendChild(path);
  board.appendChild(svg);

  // マス目
  const cells = document.createElement("div");
  cells.className = "sugoroku-cells";
  for (let i = 0; i < stepCount; i++) {
    const cell = document.createElement("div");
    cell.className = "sugoroku-cell";
    if (i === 0) {
      cell.classList.add("start");
      cell.textContent = "START";
    } else if (i === stepCount - 1) {
      cell.classList.add("goal");
      cell.textContent = "GOAL";
    } else {
      cell.textContent = i.toString();
    }
    cells.appendChild(cell);
  }
  board.appendChild(cells);

  const walker = document.createElement("img");
  walker.src = "images/walk.webp";
  walker.alt = "オトロン";
  walker.className = "sugoroku-walker";
  board.appendChild(walker);

  container.appendChild(board);

  // キャラクター位置
  const percent = (filled / (stepCount - 1)) * 100;
  walker.style.left = `calc(${percent}% )`;

  // 🛠 デバッグ機能
  const debugPanel = document.createElement("div");
  debugPanel.style.marginBottom = "1em";

  const actionSelect = document.createElement("select");
  [
    { value: "", label: "デバッグ機能（本番モードでは削除）" },
    { value: "reset", label: "進捗をリセット（赤のみ）" },
    { value: "unlock", label: "次の和音を解放" },
    { value: "clearWeek", label: "今週のトレーニングデータを削除" },
    { value: "mock1", label: "モック記録生成（1日分）" },
    { value: "mock2", label: "モック記録生成（2日分）" },
    { value: "mock3", label: "モック記録生成（3日分）" },
    { value: "mock4", label: "モック記録生成（4日分）" },
    { value: "mock5", label: "モック記録生成（5日分）" },
    { value: "mock6", label: "モック記録生成（6日分）" },
    { value: "mock7", label: "モック記録生成（7日分）" }
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
    } else if (val === "clearWeek") {
      const ok = confirm("今週のトレーニングデータを本当に削除しますか？");
      if (ok) {
        const success = await deleteTrainingDataThisWeek(user.id);
        alert(success ? "今週のデータを削除しました" : "削除に失敗しました");
      }
    } else if (val.startsWith("mock")) {
      const days = parseInt(val.replace("mock", ""), 10);
      await generateMockGrowthData(user.id, days);
      alert(`モックデータ(${days}日分)を生成しました`);
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

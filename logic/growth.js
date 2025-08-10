// logic/growth.js

import { switchScreen, openHelp } from "../main.js";
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
  generateMockGrowthData,
  generateMockSingleNoteData
} from "../utils/growthStore_supabase.js";
import { deleteTrainingDataThisWeek } from "../utils/trainingStore_supabase.js";
import { chords } from "../data/chords.js";
import { renderHeader } from "../components/header.js";
import { unlockChord, resetChordProgressToRed } from "../utils/progressUtils.js";
import { getAudio } from "../utils/audioCache.js";
import { updateGrowthStatusBar, countQualifiedDays } from "../utils/progressStatus.js";
import { showCustomConfirm, showCustomAlert } from "../components/home.js";
import { SHOW_DEBUG } from "../utils/debug.js";

export async function renderGrowthScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  // ヘッダーではユーザー情報が必要なため、コールバックではなく
  // 取得済みの user オブジェクトをそのまま渡す
  renderHeader(app, user);

  const container = document.createElement("div");
  container.className = "screen active growth-screen";

  const today = getToday();
  const passed = await getPassedDays(user.id);
  const qualifiedDays = await countQualifiedDays(user.id);
  const qualifiedToday = await isQualifiedToday(user.id);
  const flags = await loadGrowthFlags(user.id);
  const target = getCurrentTargetChord(flags); // ← chordOrder に沿った未解放の最初の1つ

  const titleRow = document.createElement("div");
  titleRow.className = "growth-title-row";

  const title = document.createElement("h2");
  title.textContent = "🎯 育成モード";

  const helpBtn = document.createElement("button");
  helpBtn.id = "growth-help-btn";
  helpBtn.className = "help-button";
  helpBtn.innerHTML = '<img src="images/icon_help.webp" alt="ヘルプ" />';
  helpBtn.onclick = () => openHelp("育成モード");

  titleRow.appendChild(title);
  titleRow.appendChild(helpBtn);
  container.appendChild(titleRow);

  const info = document.createElement("div");
  info.className = "today-info";
  info.innerHTML = `
    <div>今日の日付: <strong>${today}</strong></div>
    <div>連続合格日数: ${qualifiedDays}/7日</div>
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

  const showBoard = !!target;

  if (showBoard) {
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
        cell.textContent = "スタート";
      } else if (i === stepCount - 1) {
        cell.classList.add("goal");
        cell.textContent = "ゴール";
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

    const currentCell = cells.children[filled];
    currentCell.style.position = "relative";
    currentCell.appendChild(walker);

    container.appendChild(board);
  }

  if (SHOW_DEBUG) {
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
      { value: "mock7", label: "モック記録生成（7日分）" },
      { value: "mockNote", label: "単音テストダミーデータ" }
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
        showCustomConfirm(
          "本当に進捗を赤だけに戻しますか？",
          async () => {
            const success = await resetChordProgressToRed(user.id);
            showCustomAlert(
              success ? "進捗をリセットしました" : "リセットに失敗しました"
            );
          }
        );
      } else if (val === "unlock") {
        const freshFlags = await loadGrowthFlags(user.id);
        const next = getCurrentTargetChord(freshFlags);
        if (next) {
          await unlockChord(user.id, next.key);
          await applyRecommendedSelection(user.id);
          forceUnlock();
          showCustomAlert(`${next.label} を解放しました`);
        } else {
          showCustomAlert("すべての和音が解放されています");
        }
      } else if (val === "clearWeek") {
        showCustomConfirm(
          "今週のトレーニングデータを本当に削除しますか？",
          async () => {
            const success = await deleteTrainingDataThisWeek(user.id);
            showCustomAlert(
              success ? "今週のデータを削除しました" : "削除に失敗しました"
            );
          }
        );
      } else if (val === "mockNote") {
        await generateMockSingleNoteData(user.id);
        showCustomAlert("単音テストのダミーデータを生成しました");
      } else if (val.startsWith("mock")) {
        const days = parseInt(val.replace("mock", ""), 10);
        await generateMockGrowthData(user.id, days);
        const count = await countQualifiedDays(user.id);
        showCustomAlert(`モックデータ(${days}日分)を生成しました`);
      }
      await renderGrowthScreen(user);
    };

    debugPanel.appendChild(actionSelect);
    container.appendChild(debugPanel);
  }


  // 和音進捗表示
  const chordStatus = document.createElement("div");
  chordStatus.className = "chord-status-grid";

  chords.forEach((chord, index) => {
    const item = document.createElement("div");
    item.style.textAlign = "center";

    const circle = document.createElement("div");
    circle.classList.add("growth-chord-circle");
    circle.textContent = chord.label;

    const isUnlocked = flags[chord.key]?.unlocked === true;

    if (chord.type === "black-inv") {
      circle.classList.add("growth-locked");
      if (isUnlocked) {
        circle.classList.add("growth-unlocked-inv");
      }
    } else {
      if (isUnlocked) {
        circle.classList.add(chord.colorClass);
      } else {
        circle.classList.add("growth-locked");
      }
    }

    circle.onclick = async () => {
      if (chord.file) {
        const audio = getAudio(`audio/${chord.file}`);
        try {
          await audio.play();
        } catch (e) {
          console.warn("🎧 audio.play() エラー:", e);
        }
      }
    };

    item.appendChild(circle);

    chordStatus.appendChild(item);

    if (index === 8 || index === 13) {
      const br = document.createElement("div");
      br.className = "chord-row-break";
      chordStatus.appendChild(br);
    }
  });

  container.appendChild(chordStatus);




  app.appendChild(container);

  await updateGrowthStatusBar(user, target, async () => {
    await renderGrowthScreen(user);
  });
}

// logic/growth.js

import { switchScreen } from "../main.js";
import {
  getToday,
  isQualifiedToday,
  getPassedDays,
  getCurrentTargetChord,
  getSortedRecordArray,
  applyRecommendedSelection,
  forceUnlock
} from "../utils/growthUtils.js";
import {
  loadGrowthFlags,
  markChordAsUnlocked,
  generateMockGrowthData
} from "../utils/growthStore_supabase.js";
import { chords } from "../data/chords.js";
import { renderHeader } from "../components/header.js";
import { unlockChord, resetChordProgressToRed } from "../utils/progressUtils.js";
import { getAudio } from "../utils/audioCache.js";
import {
  updateGrowthStatusBar,
  getUnlockCriteriaStatus
} from "../utils/progressStatus.js";
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
  info.innerHTML = `
    今日の日付: <strong>${today}</strong><br/>
    合格した日数: <strong>${passed}</strong> / 7日<br/>
    今日の状態: ${qualifiedToday ? "✅ 合格済み" : "❌ 未合格"}
  `;
  container.appendChild(info);

  const statusBar = document.createElement("div");
  statusBar.style.margin = "1em 0";
  const msgSpan = document.createElement("span");
  msgSpan.id = "growth-message";

  const unlockBtn = document.createElement("div");
  unlockBtn.id = "unlockBtn";
  unlockBtn.className = "unlock-button";
  unlockBtn.textContent = "解放する";
  unlockBtn.style.marginLeft = "1em";

  const progressEl = document.createElement("div");
  progressEl.className = "progress";
  unlockBtn.appendChild(progressEl);

  statusBar.appendChild(msgSpan);
  statusBar.appendChild(unlockBtn);
  container.appendChild(statusBar);

  const progressBar = document.createElement("div");
  progressBar.style.height = "30px";
  progressBar.style.background = "#eee";
  progressBar.style.borderRadius = "10px";
  progressBar.style.margin = "1em 0";
  progressBar.style.overflow = "hidden";

  const progress = document.createElement("div");
  progress.style.height = "100%";
  progress.style.width = `${Math.min((passed / 7) * 100, 100)}%`;
  progress.style.background = passed >= 7 ? "#4caf50" : "#66bbff";
  progress.style.transition = "width 0.3s ease";
  progressBar.appendChild(progress);
  container.appendChild(progressBar);

  // 🛠 デバッグ: 進捗を赤のみの状態に戻す
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "🛠 進捗をリセット (赤のみ)";
  resetBtn.style.marginBottom = "1em";
  resetBtn.onclick = async () => {
    const ok = confirm("本当に進捗を赤だけに戻しますか？");
    if (!ok) return;
    const success = await resetChordProgressToRed(user.id);
    if (success) {
      alert("進捗をリセットしました");
      await renderGrowthScreen(user);
    } else {
      alert("リセットに失敗しました");
    }
  };
  container.appendChild(resetBtn);

  // 🛠 デバッグ: 任意和音解放やモックデータ生成
  const debugPanel = document.createElement("div");
  debugPanel.style.marginBottom = "1em";

  const select = document.createElement("select");
  chords.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.key;
    opt.textContent = c.label;
    select.appendChild(opt);
  });

  const manualBtn = document.createElement("button");
  manualBtn.textContent = "🛠 選択和音を解放";
  manualBtn.style.marginLeft = "0.5em";
  manualBtn.onclick = async () => {
    await markChordAsUnlocked(user.id, select.value);
    alert(`${select.value} を手動で解放しました`);
    await renderGrowthScreen(user);
  };

  const mockBtn = document.createElement("button");
  mockBtn.textContent = "🛠 モック記録生成";
  mockBtn.style.marginLeft = "0.5em";
  mockBtn.onclick = async () => {
    await generateMockGrowthData(user.id);
    alert("モックデータを生成しました");
    await renderGrowthScreen(user);
  };

  const logLabel = document.createElement("label");
  logLabel.style.marginLeft = "0.5em";
  const logChk = document.createElement("input");
  logChk.type = "checkbox";
  logChk.checked = window.unlockDebugLogs === true;
  logChk.onchange = () => {
    window.unlockDebugLogs = logChk.checked;
  };
  logLabel.appendChild(logChk);
  logLabel.appendChild(document.createTextNode("詳細ログ"));

  debugPanel.appendChild(select);
  debugPanel.appendChild(manualBtn);
  debugPanel.appendChild(mockBtn);
  debugPanel.appendChild(logLabel);
  container.appendChild(debugPanel);

  const debugInfo = document.createElement("pre");
  debugInfo.id = "unlock-debug-info";
  debugInfo.style.background = "#f8f8f8";
  debugInfo.style.padding = "0.5em";
  debugInfo.style.fontSize = "0.85em";
  debugInfo.style.whiteSpace = "pre-wrap";
  container.appendChild(debugInfo);

  async function refreshDebugInfo() {
    const info = await getUnlockCriteriaStatus(user.id);
    const daysSince =
      info.daysSinceUnlock === null
        ? "-"
        : info.daysSinceUnlock.toFixed(1);
    debugInfo.textContent =
      `連続合格日数: ${info.consecutiveDays} / ${info.requiredDays}\n` +
      `前回解放からの日数: ${daysSince} / ${info.requiredInterval}`;
  }

  refreshDebugInfo();

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

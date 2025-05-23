// logic/growth.js

import { switchScreen } from "../main.js";
import {
  getToday,
  isQualifiedToday,
  getPassedDays,
  getCurrentTargetChord,
  getSortedRecordArray
} from "../utils/growthUtils.js";
import { loadGrowthFlags } from "../utils/growthStore_supabase.js";
import { chords } from "../data/chords.js";
import { renderHeader } from "../components/header.js";
import { unlockChord, resetChordProgressToRed } from "../utils/progressUtils.js";
import { updateGrowthStatusBar } from "../utils/progressStatus.js";

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
    合格した日数: <strong>${passed}</strong> / 14日<br/>
    今日の状態: ${qualifiedToday ? "✅ 合格済み" : "❌ 未合格"}
  `;
  container.appendChild(info);

  const statusBar = document.createElement("div");
  statusBar.style.margin = "1em 0";
  const msgSpan = document.createElement("span");
  msgSpan.id = "growth-message";
  const unlockBtn = document.createElement("button");
  unlockBtn.id = "unlock-button";
  unlockBtn.textContent = "次の和音を解放する";
  unlockBtn.style.marginLeft = "1em";
  statusBar.appendChild(msgSpan);
  statusBar.appendChild(unlockBtn);
  container.appendChild(statusBar);

  await updateGrowthStatusBar(user, target);

  const progressBar = document.createElement("div");
  progressBar.style.height = "30px";
  progressBar.style.background = "#eee";
  progressBar.style.borderRadius = "10px";
  progressBar.style.margin = "1em 0";
  progressBar.style.overflow = "hidden";

  const progress = document.createElement("div");
  progress.style.height = "100%";
  progress.style.width = `${Math.min((passed / 14) * 100, 100)}%`;
  progress.style.background = passed >= 14 ? "#4caf50" : "#66bbff";
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
        const audio = new Audio(`audio/${chord.file}`);
        audio.play();
      }
    };

    const label = document.createElement("div");
    label.style.fontSize = "0.85em";
    label.textContent = chord.label;

    item.appendChild(circle);
    item.appendChild(label);

    // ✅ 「次の和音を解放」ボタン表示（すべて解放済みの場合は出ない）
    if (target && chord.key === target.key) {
      const button = document.createElement("button");
      button.style.marginTop = "4px";
      button.textContent = "🔓 次の和音を解放する";
      button.onclick = async () => {
        const confirmed = confirm(`「${chord.label}」を解放しますか？`);
        if (!confirmed) return;

        const success = await unlockChord(user.id, chord.key);
        if (success) {
          alert(`🎉 ${chord.label} を解放しました！`);
          await renderGrowthScreen(user);
        }
      };
      item.appendChild(button);
    }

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

  // 📆 過去7日間履歴
  const historyTitle = document.createElement("h3");
  historyTitle.textContent = "📆 過去7日間の履歴";
  container.appendChild(historyTitle);

  const allRecords = await getSortedRecordArray(user.id);
  const recent = allRecords.slice(-7).reverse();

  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.width = "100%";

  const headerRow = document.createElement("tr");
  ["日付", "出題数", "正答数", "正答率", "セット数"].forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    th.style.border = "1px solid #ccc";
    th.style.padding = "6px";
    th.style.background = "#f0f0f0";
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  recent.forEach(r => {
    const rate = r.count ? ((r.correct / r.count) * 100).toFixed(1) : "0.0";
    const tr = document.createElement("tr");
    [r.date, r.count, r.correct, `${rate}%`, r.sets].forEach(text => {
      const td = document.createElement("td");
      td.textContent = text;
      td.style.border = "1px solid #ccc";
      td.style.padding = "6px";
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  container.appendChild(table);

  const backBtn = document.createElement("button");
  backBtn.textContent = "🏠 ホームに戻る";
  backBtn.onclick = () => switchScreen("home", user);
  backBtn.style.marginTop = "2em";
  container.appendChild(backBtn);

  app.appendChild(container);
}

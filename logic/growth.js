// logic/growth.js
import { switchScreen } from "../main.js";
import { loadGrowthData, mockGrowthDebug, loadGrowthFlags, markChordAsUnlocked, saveGrowthFlags } from "../utils/growthStore.js";
import { getToday, isQualifiedToday, getPassedDays, forceUnlock, getCurrentTargetChord } from "../utils/growthUtils.js";
import { chords } from "../data/chords.js";

export function renderGrowthScreen() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const container = document.createElement("div");
  container.className = "screen active";

  const today = getToday();
  const passed = getPassedDays();
  const qualifiedToday = isQualifiedToday();
  const target = getCurrentTargetChord();
  const flags = loadGrowthFlags();

  // タイトル
  const title = document.createElement("h2");
  title.textContent = "🎯 育成モード進捗と履歴";
  container.appendChild(title);

  // 現在挑戦中の和音
  if (target) {
    const challenge = document.createElement("div");
    challenge.style.margin = "1em 0";
    challenge.style.padding = "1em";
    challenge.style.border = "2px dashed #ccc";
    challenge.style.borderRadius = "10px";
    challenge.style.background = "#f9f9f9";
    const remain = 14 - passed;
    challenge.innerHTML = `
      <p>🧪 <strong>いま、「${target.label}（${target.name}）」に挑戦中！</strong></p>
      <p>解放まであと <strong>${remain}</strong> 回の合格が必要です。</p>
    `;
    container.appendChild(challenge);
  }

  // 合格状況
  const info = document.createElement("p");
  info.innerHTML = `
    今日の日付: <strong>${today}</strong><br/>
    合格した日数: <strong>${passed}</strong> / 14日<br/>
    今日の状態: ${qualifiedToday ? "✅ 合格済み" : "❌ 未合格"}
  `;
  container.appendChild(info);

  // 進捗バー
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

  // 和音の進捗表示（色＋状態）
  const chordStatus = document.createElement("div");
  chordStatus.style.display = "grid";
  chordStatus.style.gridTemplateColumns = "repeat(auto-fit, minmax(90px, 1fr))";
  chordStatus.style.gap = "10px";
  chordStatus.style.marginTop = "1.5em";

  chords.forEach(chord => {
    if (!chord.colorClass || chord.type === "black-inv") return;
    const item = document.createElement("div");
    item.style.textAlign = "center";

    const circle = document.createElement("div");
    circle.style.width = "36px";
    circle.style.height = "36px";
    circle.style.borderRadius = "50%";
    circle.style.margin = "0 auto";
    circle.style.backgroundColor = chord.colorClass;
    circle.style.border = "2px solid #aaa";

    const label = document.createElement("div");
    label.style.fontSize = "0.85em";
    label.textContent = chord.label;

    const status = document.createElement("div");
    status.style.fontSize = "0.7em";
    status.textContent = flags[chord.name]?.unlocked ? "✅ 解放済み" : "🔒 未解放";

    item.appendChild(circle);
    item.appendChild(label);
    item.appendChild(status);
    chordStatus.appendChild(item);
  });
  container.appendChild(chordStatus);

  // 転回系の任意解放セクション
  const optionalTitle = document.createElement("h3");
  optionalTitle.textContent = "🔧 転回系の任意解放";
  container.appendChild(optionalTitle);

  const optionalInversions = chords.filter(ch => ch.type === "black-inv");
  optionalInversions.forEach(chord => {
    const item = document.createElement("div");
    item.style.marginBottom = "1em";

    const label = document.createElement("span");
    label.textContent = `${chord.label}（${chord.name}）`;
    label.style.marginRight = "1em";

    const btn = document.createElement("button");
    if (flags[chord.name]?.unlocked) {
      btn.textContent = "✅ 解放済み";
      btn.disabled = true;
    } else {
      btn.textContent = "🔓 解放する";
      btn.onclick = () => {
        if (confirm(`「${chord.label}」を解放しますか？`)) {
          flags[chord.name] = { unlocked: true };
          saveGrowthFlags(flags);
          alert(`「${chord.label}」を解放しました！`);
          renderGrowthScreen();
        }
      };
    }

    item.appendChild(label);
    item.appendChild(btn);
    container.appendChild(item);
  });

  // 強制解放
  if (passed < 14) {
    const unlockBtn = document.createElement("button");
    unlockBtn.textContent = "🔓 強制解放する";
    unlockBtn.onclick = () => {
      if (confirm("本当に強制解放しますか？ 進捗はリセットされます。")) {
        forceUnlock();
        alert("強制解放しました。");
        renderGrowthScreen();
      }
    };
    container.appendChild(unlockBtn);
  } else {
    const done = document.createElement("p");
    done.textContent = "🎉 新しい和音が解放されます！";
    done.style.color = "green";
    container.appendChild(done);
  }

  // 今日の概要
  const data = loadGrowthData();
  const todayData = data[today] || { count: 0, correct: 0, sets: 0 };
  const summary = document.createElement("div");
  summary.innerHTML = `
    <h3>📈 今日のトレーニング概要</h3>
    <p>出題数：<strong>${todayData.count}</strong></p>
    <p>正答数：<strong>${todayData.correct}</strong></p>
    <p>セット数：<strong>${todayData.sets}</strong></p>
    <p>正答率：<strong>${todayData.count > 0 ? ((todayData.correct / todayData.count) * 100).toFixed(1) : 0}%</strong></p>
  `;
  container.appendChild(summary);

  // 過去7日間履歴
  const historyTitle = document.createElement("h3");
  historyTitle.textContent = "📆 過去7日間の履歴";
  container.appendChild(historyTitle);

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

  const sortedKeys = Object.keys(data).sort().reverse().slice(0, 7);
  sortedKeys.forEach(date => {
    const d = data[date];
    const rate = d.count ? ((d.correct / d.count) * 100).toFixed(1) : "0.0";
    const tr = document.createElement("tr");
    [date, d.count, d.correct, rate + "%", d.sets].forEach(text => {
      const td = document.createElement("td");
      td.textContent = text;
      td.style.border = "1px solid #ccc";
      td.style.padding = "6px";
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  container.appendChild(table);

  // ボタン群
  const btnBox = document.createElement("div");
  btnBox.style.marginTop = "2em";
  btnBox.style.display = "flex";
  btnBox.style.justifyContent = "center";
  btnBox.style.gap = "1em";

  const backBtn = document.createElement("button");
  backBtn.textContent = "🏠 ホームに戻る";
  backBtn.onclick = () => switchScreen("home");
  btnBox.appendChild(backBtn);

  const debugBtn = document.createElement("button");
  debugBtn.textContent = "🐞 デバッグ追加";
  debugBtn.onclick = () => {
    mockGrowthDebug();
    renderGrowthScreen();
  };
  btnBox.appendChild(debugBtn);

  container.appendChild(btnBox);
  app.appendChild(container);
}

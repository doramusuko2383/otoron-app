あ// logic/growth.js
import { switchScreen } from "../main.js";
import {
  getToday,
  isQualifiedToday,
  getPassedDays,
  forceUnlock,
  getCurrentTargetChord,
  getSortedRecordArray
} from "../utils/growthUtils.js";
import { loadGrowthFlags, markChordAsUnlocked } from "../utils/growthStore_supabase.js";
import { chords } from "../data/chords.js";
import { renderHeader } from "../components/header.js";

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
  const target = getCurrentTargetChord(flags);

  const title = document.createElement("h2");
  title.textContent = "🎯 育成モード進捗と履歴";
  container.appendChild(title);

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

  const info = document.createElement("p");
  info.innerHTML = `
    今日の日付: <strong>${today}</strong><br/>
    合格した日数: <strong>${passed}</strong> / 14日<br/>
    今日の状態: ${qualifiedToday ? "✅ 合格済み" : "❌ 未合格"}
  `;
  container.appendChild(info);

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
      btn.onclick = async () => {
        if (confirm(`「${chord.label}」を解放しますか？`)) {
          await markChordAsUnlocked(user.id, chord.name);
          alert(`「${chord.label}」を解放しました！`);
          renderGrowthScreen(user);
        }
      };
    }

    item.appendChild(label);
    item.appendChild(btn);
    container.appendChild(item);
  });

  if (passed < 14) {
    const unlockBtn = document.createElement("button");
    unlockBtn.textContent = "🔓 強制解放する";
    unlockBtn.onclick = () => {
      if (confirm("本当に強制解放しますか？ 進捗はリセットされます。")) {
        forceUnlock();
        alert("強制解放しました。");
        renderGrowthScreen(user);
      }
    };
    container.appendChild(unlockBtn);
  } else {
    const done = document.createElement("p");
    done.textContent = "🎉 新しい和音が解放されます！";
    done.style.color = "green";
    container.appendChild(done);
  }

  // 📆 過去7日間履歴
  const historyTitle = document.createElement("h3");
  historyTitle.textContent = "📆 過去7日間の履歴";
  container.appendChild(historyTitle);

  const allRecords = await getSortedRecordArray(user.id);
  const recent = allRecords.slice(-7).reverse(); // 直近7日分・新しい順

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

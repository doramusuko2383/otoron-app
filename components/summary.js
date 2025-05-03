// components/summary.js
import { stats, mistakes, firstMistakeInSession, correctCount } from "./training.js";
import { switchScreen } from "../main.js";
import { chords } from "../data/chords.js";

export function renderSummaryScreen(debug = false) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const container = document.createElement("div");
  container.className = "screen active";

  const title = document.createElement("h2");
  title.textContent = "🎹 トレーニング結果";
  title.style.color = "#333";
  title.style.textAlign = "center";
  container.appendChild(title);

  const chordMeta = {};
  chords.forEach(c => chordMeta[c.name] = c);

  const resultBox = document.createElement("div");
  resultBox.style.margin = "1em auto";
  resultBox.style.maxWidth = "600px";

  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.width = "100%";
  const headerRow = document.createElement("tr");
  ["和音", "正解", "出題", "正答率"].forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    th.style.border = "1px solid #ccc";
    th.style.padding = "6px";
    th.style.background = "#f0f0f0";
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  for (const name in stats) {
    const { correct: c, total: t } = stats[name];
    if (c === t) continue; // 全問正解なら省略
    const tr = document.createElement("tr");
    [name, c, t, `${((c / t) * 100).toFixed(1)}%`].forEach((text, i) => {
      const td = document.createElement("td");
      td.textContent = text;
      td.style.border = "1px solid #ccc";
      td.style.padding = "6px";
      if (i === 0) td.style.fontWeight = "bold";
      tr.appendChild(td);
    });
    table.appendChild(tr);
  }

  resultBox.appendChild(table);
  container.appendChild(resultBox);

  // ★ここが修正版！★
  const totalQuestions = correctCount + Object.values(stats).reduce((sum, s) => sum + (s.total - s.correct), 0);
  const rate = totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).toFixed(1) : 0;

  const summary = document.createElement("p");
  summary.innerHTML = `<strong>✅ 正解率：</strong>${correctCount} / ${totalQuestions}（${rate}%）`;
  summary.style.textAlign = "center";
  summary.style.margin = "1em 0";
  container.appendChild(summary);

  const canvas = document.createElement("canvas");
  canvas.id = "summaryChart";
  canvas.width = 400;
  canvas.height = 300;
  canvas.style.margin = "2em auto";
  container.appendChild(canvas);

  const btnBox = document.createElement("div");
  btnBox.style.display = "flex";
  btnBox.style.justifyContent = "center";
  btnBox.style.gap = "1em";
  btnBox.style.margin = "2em 0";

  const backBtn = document.createElement("button");
  backBtn.textContent = "🏠 ホームに戻る";
  backBtn.onclick = () => switchScreen("home");
  btnBox.appendChild(backBtn);

  container.appendChild(btnBox);

  app.appendChild(container);

  setTimeout(() => {
    const ctx = document.getElementById("summaryChart").getContext("2d");
    const labels = [];
    const data = [];
    for (const name in stats) {
      const s = stats[name];
      if (s.correct === s.total) continue;
      labels.push(name);
      data.push(((s.correct / s.total) * 100).toFixed(1));
    }
    new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "正答率 %",
          data,
          backgroundColor: "#ff6666"
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }, 100);
}

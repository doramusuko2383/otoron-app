import { stats, mistakes, firstMistakeInSession, correctCount } from "./training.js";
import { switchScreen } from "../main.js";
import { chords } from "../data/chords.js";
import { renderHeader } from "./header.js";

function getChordDisplayName(name) {
  const chord = chords.find(c => c.name === name);
  if (!chord) return name;
  if (chord.italian) {
    return `${chord.label}（${chord.italian.join('')}）`;
  }
  return chord.label || name;
}

export function saveSessionToHistory() {
  const sanitizedStats = {};
  for (const [key, stat] of Object.entries(stats)) {
    sanitizedStats[key] = {
      correct: stat.correct || 0,
      wrong: stat.wrong || 0,
      unknown: stat.unknown || 0
    };
  }

  const actualQuestions = Object.values(sanitizedStats).reduce((count, stat) => {
    return count + stat.correct + stat.wrong + stat.unknown;
  }, 0);

  const correctAnswers = Object.values(sanitizedStats).reduce((count, stat) => {
    return count + stat.correct;
  }, 0);

  const today = new Date().toISOString().slice(0, 10);
  const sessionRecord = {
    date: today,
    stats: sanitizedStats,
    mistakes: JSON.parse(JSON.stringify(mistakes)),
    correctCount: correctAnswers,
    totalQuestions: actualQuestions,
    firstMistakeInSession: JSON.parse(JSON.stringify(firstMistakeInSession))
  };

  const history = JSON.parse(localStorage.getItem("training-history") || "{}");
  if (!history[today]) history[today] = [];
  history[today].push(sessionRecord);
  localStorage.setItem("training-history", JSON.stringify(history));
}

export function renderSummaryScreen() {
  const today = new Date().toISOString().slice(0, 10);
  renderSummaryScreenForDate(today);
}

window.saveSessionToHistory = saveSessionToHistory;
window.renderSummaryScreen = renderSummaryScreen;

export function renderSummaryScreenForDate(date) {
  const history = JSON.parse(localStorage.getItem("training-history") || "{}");
  const sessions = history[date] || [];

  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app, renderSummaryScreen);

  const container = document.createElement("div");
  container.className = "screen active";

  const calendarInput = document.createElement("input");
  calendarInput.type = "text";
  calendarInput.id = "calendar";
  calendarInput.style.margin = "1em auto";
  calendarInput.style.display = "block";
  container.appendChild(calendarInput);

  const allDates = Object.keys(history).sort();
  const enabledDates = allDates.filter(d => history[d]?.length).map(d => d.trim());

  if (window.flatpickrInstance) window.flatpickrInstance.destroy();

  app.appendChild(container);

  const todayObj = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(todayObj.getFullYear() - 2);

  window.flatpickrInstance = flatpickr(calendarInput, {
    enable: enabledDates,
    minDate: twoYearsAgo,
    maxDate: todayObj,
    dateFormat: "Y-m-d",
    defaultDate: date,
    disableMobile: true,
    onChange: function (_, dateStr) {
      renderSummaryScreenForDate(dateStr);
    }
  });

  // 🎹 最新セッションの結果（←ここを最新のみに修正）
  const latestSession = sessions[sessions.length - 1] || {};
  const latestStats = latestSession.stats || {};
  const latestCorrect = latestSession.correctCount || 0;
  const latestTotal = latestSession.totalQuestions || 0;
  const latestRate = latestTotal > 0 ? ((latestCorrect / latestTotal) * 100).toFixed(1) : "0.0";

  const title = document.createElement("h2");
  title.textContent = `🎹 ${date} の最新セッション結果`;
  title.style.color = "#333";
  title.style.textAlign = "center";
  container.appendChild(title);

  const dayTotal = document.createElement("p");
  dayTotal.textContent = `正解数：${latestCorrect} / ${latestTotal}（${latestRate}%）`;
  dayTotal.style.textAlign = "center";
  dayTotal.style.fontWeight = "bold";
  container.appendChild(dayTotal);

  // 各セッションの表示
  sessions.forEach((session, sessionIndex) => {
    const sessionCorrect = session.correctCount ?? Object.values(session.stats).reduce((sum, stat) => sum + stat.correct, 0);
    const sessionTotal = session.totalQuestions ?? Object.values(session.stats).reduce((sum, stat) => sum + stat.correct + stat.wrong + (stat.unknown || 0), 0);
    const sessionRate = sessionTotal > 0 ? ((sessionCorrect / sessionTotal) * 100).toFixed(1) : 0;

    const sessionSummary = document.createElement("div");
    sessionSummary.className = "session-summary";
    sessionSummary.style.margin = "1em 0";
    sessionSummary.style.padding = "0.5em";
    sessionSummary.style.borderBottom = "1px solid #eee";

    const sessionTitle = document.createElement("h3");
    sessionTitle.textContent = `セッション ${sessionIndex + 1}`;
    sessionTitle.style.fontSize = "1em";
    sessionTitle.style.margin = "0 0 0.5em 0";
    sessionSummary.appendChild(sessionTitle);

    const sessionStats = document.createElement("p");
    sessionStats.textContent = `正解数：${sessionCorrect} / ${sessionTotal}（${sessionRate}%）`;
    sessionStats.style.margin = "0";
    sessionSummary.appendChild(sessionStats);

    const storedCount = document.createElement("p");
    storedCount.textContent = `保存された正解数: ${session.correctCount}`;
    storedCount.style.color = "#999";
    storedCount.style.fontSize = "0.8em";
    sessionSummary.appendChild(storedCount);

    container.appendChild(sessionSummary);
  });

  // 🧮 今回のセッションの詳細（すでに正しく最新を参照）
  const summaryHeading = document.createElement("h3");
  summaryHeading.textContent = "今回のトレーニング結果";
  summaryHeading.style.textAlign = "center";
  summaryHeading.style.margin = "1.5em 0 0.5em";
  container.appendChild(summaryHeading);

  const summary = document.createElement("p");
  summary.innerHTML = `
    トレーニング回数：${sessions.length} 回<br>
    正解数：${latestCorrect} / ${latestTotal}（${latestRate}%）
  `;
  summary.style.textAlign = "center";
  summary.style.margin = "0.5em 0 1.5em";
  container.appendChild(summary);

  // 🐛 デバッグ：最新セッションの stats 表示
  //const debug = document.createElement("pre");
  //debug.style.fontSize = "0.8em";
  //debug.style.background = "#f9f9f9";
  //debug.style.border = "1px solid #ccc";
  //debug.style.padding = "1em";
  //debug.style.margin = "2em auto";
  //debug.style.width = "90%";
  //debug.style.whiteSpace = "pre-wrap";
  //debug.textContent = `🛠 DEBUG: 最新セッションの stats\n` + JSON.stringify(latestStats, null, 2);
  //container.appendChild(debug);

  app.appendChild(container);
}

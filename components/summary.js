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
    timestamp: new Date().toISOString(),
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

export function renderSummarySection(container, date) {
  const history = JSON.parse(localStorage.getItem("training-history") || "{}");
  const sessions = history[date] || [];

  container.innerHTML = "";
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
      renderSummarySection(container, dateStr);
    }
  });

  if (sessions.length === 0) {
    const msg = document.createElement('p');
    msg.textContent = '本日はトレーニングしておりません';
    msg.style.textAlign = 'center';
    container.appendChild(msg);
    return;
  }

  const title = document.createElement("h2");
  title.textContent = `🎹 ${date} の最新セッション結果`;
  title.style.color = "#333";
  title.style.textAlign = "center";
  container.appendChild(title);


  const jpNums = ['一','二','三','四','五','六','七','八','九','十'];
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
    const t = session.timestamp ? new Date(session.timestamp).toTimeString().slice(0,5) : '';
    const jp = jpNums[sessionIndex] || (sessionIndex + 1);
    sessionTitle.textContent = `${jp}回目のトレーニング${t ? ' ' + t : ''}`;
    sessionTitle.style.fontSize = "1em";
    sessionTitle.style.margin = "0 0 0.5em 0";
    sessionSummary.appendChild(sessionTitle);

    const sessionStats = document.createElement("p");
    sessionStats.textContent = `正解数：${sessionCorrect} / ${sessionTotal}（${sessionRate}%）`;
    sessionStats.style.margin = "0";
    sessionSummary.appendChild(sessionStats);

    container.appendChild(sessionSummary);
  });
}

window.saveSessionToHistory = saveSessionToHistory;
window.renderSummaryScreen = renderSummaryScreen;

export function renderSummaryScreenForDate(date) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app, renderSummaryScreen);

  const container = document.createElement("div");
  app.appendChild(container);

  renderSummarySection(container, date);
}

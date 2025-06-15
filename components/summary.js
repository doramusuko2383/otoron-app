import { stats, mistakes, firstMistakeInSession, correctCount } from "./training.js";
import { switchScreen } from "../main.js";
import { chords } from "../data/chords.js";
import { renderHeader } from "./header.js";
import { loadTrainingRecords } from "../utils/recordStore_supabase.js";
import { loadTrainingSessionsForDate } from "../utils/trainingStore_supabase.js";
import { generateWeeklyReport, shareReport } from "../utils/weeklyReport.js";
import { createResultTable } from "./result.js";

function createMistakeDetailHtml(mistakes) {
  if (!mistakes) return "";
  if (typeof mistakes === "string") {
    try { mistakes = JSON.parse(mistakes); } catch (_) { return ""; }
  }
  const items = [];
  if (mistakes.initial_mistake) {
    items.push("さいしょのもんだいでまちがえました");
  }
  if (Array.isArray(mistakes.inversion_confusions) && mistakes.inversion_confusions.length) {
    const text = mistakes.inversion_confusions
      .map(m => `${m.question}→${m.answer}(${m.count})`)
      .join('、 ');
    items.push(`転回形のまちがい: ${text}`);
  }
  if (Array.isArray(mistakes.top_bottom_confusions) && mistakes.top_bottom_confusions.length) {
    const text = mistakes.top_bottom_confusions
      .map(m => `${m.question}→${m.answer}(${m.count})`)
      .join('、 ');
    items.push(`上下がおなじ和音: ${text}`);
  }
  if (Array.isArray(mistakes.frequent_pairs) && mistakes.frequent_pairs.length) {
    const text = mistakes.frequent_pairs
      .map(p => `${p.pair[0]}⇄${p.pair[1]}(${p.count})`)
      .join('、 ');
    items.push(`よくまちがえるペア: ${text}`);
  }
  if (!items.length) return "";
  return `<ul class="mistake-details"><li>${items.join('</li><li>')}</li></ul>`;
}

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

export async function renderSummaryScreen(user) {
  const today = new Date().toISOString().slice(0, 10);
  await renderSummaryScreenForDate(today, user);
}

export async function renderSummarySection(container, date, user) {
  const records = await loadTrainingRecords(user.id);
  const sessions = await loadTrainingSessionsForDate(user.id, date);

  container.innerHTML = "";
  // Add a specific class so CSS rules don't affect other screens
  container.className = "screen active summary-screen";

  const calendarLabel = document.createElement("div");
  calendarLabel.textContent = "日付を絞って選択";
  calendarLabel.style.fontSize = "0.7em";
  calendarLabel.style.textAlign = "center";
  container.appendChild(calendarLabel);

  const calendarInput = document.createElement("input");
  calendarInput.type = "text";
  calendarInput.id = "calendar";
  calendarInput.style.margin = "0.2em auto 1em";
  calendarInput.style.display = "block";
  container.appendChild(calendarInput);

  const weeklyBtn = document.createElement('button');
  weeklyBtn.textContent = '📤 週次レポート作成';
  weeklyBtn.style.display = 'block';
  weeklyBtn.style.margin = '0 auto 1em';
  container.appendChild(weeklyBtn);

  const reportWrap = document.createElement('div');
  reportWrap.style.display = 'none';
  reportWrap.style.margin = '1em 0';
  reportWrap.style.maxWidth = '600px';
  reportWrap.style.marginLeft = 'auto';
  reportWrap.style.marginRight = 'auto';

  const reportArea = document.createElement('textarea');
  reportArea.id = 'weekly-report-text';
  reportArea.readOnly = true;
  reportArea.rows = 10;
  reportArea.style.width = '100%';
  reportArea.style.boxSizing = 'border-box';
  reportWrap.appendChild(reportArea);

  const shareBtn = document.createElement('button');
  shareBtn.textContent = '共有';
  shareBtn.style.display = 'block';
  shareBtn.style.margin = '1em auto 0';
  reportWrap.appendChild(shareBtn);
  container.appendChild(reportWrap);

  weeklyBtn.onclick = async () => {
    const end = date;
    const startDateObj = new Date(date);
    startDateObj.setDate(startDateObj.getDate() - 6);
    const startStr = startDateObj.toISOString().split('T')[0];
    const text = await generateWeeklyReport(user, startStr, end);
    if (text) {
      reportArea.value = text;
      reportWrap.style.display = 'block';
    }
  };

  shareBtn.onclick = () => {
    if (reportArea.value) {
      shareReport(reportArea.value);
    }
  };

  const allDates = Object.keys(records).sort();
  const enabledDates = allDates.filter(d => records[d]?.count).map(d => d.trim());

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
      renderSummarySection(container, dateStr, user);
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
  title.textContent = `🎹 ${date} の結果`;
  title.style.color = "#333";
  title.style.textAlign = "center";
  container.appendChild(title);


  const jpNums = ['一','二','三','四','五','六','七','八','九','十'];
  sessions.forEach((session, sessionIndex) => {
    const sessionCorrect = session.correct_count ?? Object.values(session.stats_json || {}).reduce((sum, stat) => sum + (stat.correct || 0), 0);
    const sessionTotal = session.total_count ?? Object.values(session.stats_json || {}).reduce((sum, stat) => sum + (stat.correct || 0) + (stat.wrong || 0) + (stat.unknown || 0), 0);
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

    const mistakeHtml = createMistakeDetailHtml(session.mistakes_json);
    if (mistakeHtml) {
      const mistakeDiv = document.createElement('div');
      mistakeDiv.innerHTML = mistakeHtml;
      sessionSummary.appendChild(mistakeDiv);
    }

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '＋';
    toggleBtn.style.marginLeft = '1em';
    toggleBtn.style.fontSize = '0.8em';
    toggleBtn.style.lineHeight = '1';
    toggleBtn.style.display = 'inline-flex';
    toggleBtn.style.justifyContent = 'center';
    toggleBtn.style.alignItems = 'center';
    toggleBtn.style.width = '1.4em';
    toggleBtn.style.height = '1.4em';
    toggleBtn.style.padding = '0';

    const toggleLabel = document.createElement('span');
    toggleLabel.textContent = '結果一覧';
    toggleLabel.style.marginLeft = '0.3em';

    const resultWrap = document.createElement('div');
    resultWrap.className = 'result-wrap';
    resultWrap.innerHTML = createResultTable(session.results_json || []);

    toggleBtn.onclick = () => {
      const open = resultWrap.classList.contains('open');
      resultWrap.classList.toggle('open', !open);
      toggleBtn.textContent = open ? '＋' : '－';
    };

    sessionSummary.appendChild(toggleBtn);
    sessionSummary.appendChild(toggleLabel);
    sessionSummary.appendChild(resultWrap);

    container.appendChild(sessionSummary);
  });
}

window.saveSessionToHistory = saveSessionToHistory;
window.renderSummaryScreen = renderSummaryScreen;

export async function renderSummaryScreenForDate(date, user) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app, user);

  const container = document.createElement("div");
  app.appendChild(container);

  await renderSummarySection(container, date, user);
}

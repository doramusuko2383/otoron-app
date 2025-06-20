// components/result.js
import { switchScreen } from "../main.js";
import { lastResults } from "./training.js";
import { loadLatestTrainingSession } from "../utils/trainingStore_supabase.js";
import { chords } from "../data/chords.js";
import { drawStaffFromNotes } from "./resultStaff.js";  // 楽譜描画（必要なら）
import { renderHeader } from "./header.js";
import { renderSummarySection } from "./summary.js";

let resultShownInThisSession = false;

const noteLabels = {
  "C": "ど",
  "D": "れ",
  "E": "み",
  "F": "ふぁ",
  "G": "そ",
  "A": "ら",
  "B": "し",
  "C#": "ちす", "Db": "ちす",
  "D#": "えす", "Eb": "えす",
  "F#": "ふぃす", "Gb": "ふぃす",
  "G#": "じす", "Ab": "じす",
  "A#": "べー", "Bb": "べー"
};

function kanaToHiragana(str) {
  return str.replace(/[ァ-ン]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

function labelNote(n) {
  const pitch = n ? n.replace(/\d/g, '') : '';
  return noteLabels[pitch] || n;
}

export function createResultTable(results) {
  const singleNoteMode = localStorage.getItem('singleNoteMode') === 'on';

  // results may come as a JSON string or object. Normalize to an array.
  if (typeof results === 'string') {
    try {
      const parsed = JSON.parse(results);
      if (Array.isArray(parsed)) results = parsed;
      else if (Array.isArray(parsed.results)) results = parsed.results;
    } catch (_) {
      results = [];
    }
  } else if (results && !Array.isArray(results) && Array.isArray(results.results)) {
    results = results.results;
  }

  if (!Array.isArray(results) || results.length === 0) {
    return `<p class="no-training">きょうは まだ トレーニングしてないよ</p>`;
  }

  const onlySingle = results.every(r => r.isSingleNote);
  if (onlySingle) {
    const rows = results
      .map((r, i) => `
        <tr class="${r.correct ? 'correct-row' : 'wrong-row'}">
          <td>${i + 1}</td>
          <td>${labelNote(r.noteQuestion || '')}</td>
          <td><span class="ans-mark ${r.correct ? 'correct' : 'wrong'}">${r.correct ? '◯' : ''}</span>${labelNote(r.noteAnswer || '')}</td>
        </tr>`)
      .join('');
    return `<table class="result-table">
        <thead>
          <tr><th>じゅんばん</th><th>もんだい</th><th>こたえ</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  const rows = (() => {
    let rhtml = '';
    let idx = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.isSingleNote) continue;
      const noteRes =
        singleNoteMode && results[i + 1] && results[i + 1].isSingleNote
          ? results[i + 1]
          : null;
      if (noteRes) i++;
      idx++;
      rhtml += `
        <tr class="${r.correct ? 'correct-row' : 'wrong-row'}">
          <td>${idx}</td>
          <td>
            <div class="chord-box ${getColorClass(r.chordName)}">
              ${getLabelHiragana(r.chordName)}
            </div>
          </td>
          <td>
            <div class="chord-box ${getColorClass(r.answerName)}">
              <span class="ans-mark ${r.correct ? 'correct' : 'wrong'}">${r.correct ? '◯' : ''}</span>
              ${getLabelHiragana(r.answerName)}
            </div>
          </td>
          ${singleNoteMode ? `<td>${noteRes ? labelNote(noteRes.noteQuestion || '') : ''}</td>` : ''}
          ${singleNoteMode ? `<td>${noteRes ? '<span class="note-answer">' + '<span class="ans-mark ' + (noteRes.correct ? 'correct' : 'wrong') + '">' + (noteRes.correct ? '◯' : '') + '</span>' + labelNote(noteRes.noteAnswer || '') + '</span>' : ''}</td>` : ''}
        </tr>`;
    }
    return rhtml;
  })();

  return `<table class="result-table">
      <thead>
        <tr>
          <th>じゅんばん</th>
          <th>わおん</th>
          <th>かいとう</th>
          ${singleNoteMode ? '<th>たんおん</th><th>かいとう</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
}

// ✅ 本番用：こども向けごほうび画面
export async function renderResultScreen(user) {
  let results = lastResults;
  if (!results.length && user && user.id) {
    const latest = await loadLatestTrainingSession(user.id);
    if (latest && latest.results_json) {
      results = latest.results_json;
    }
  }


  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app, user);

  const container = document.createElement("div");
  container.className = "screen active result-screen";
  const tableHtml = createResultTable(results);

  container.innerHTML = `
    <div class="tab-menu">
      <button class="tab active" data-tab="result">👶 こたえ</button>
      <button class="tab" data-tab="summary">👨‍👩‍👧 くわしく</button>
    </div>
    <div class="tab-contents">
      <div id="result" class="tab-content active">
        <div class="result-container">
          <div class="result-scroll-wrap">
            ${tableHtml}
          </div>
          <div class="result-footer"></div>
        </div>
      </div>
      <div id="summary" class="tab-content">
        <div class="summary-container"></div>
      </div>
    </div>
  `;

  app.appendChild(container);

  const openChild = sessionStorage.getItem('openResultChild') === 'true';
  sessionStorage.removeItem('openResultChild');
  if (!openChild) {
    const resultTabBtn = container.querySelector('.tab[data-tab="result"]');
    const summaryTabBtn = container.querySelector('.tab[data-tab="summary"]');
    const resultContent = container.querySelector('#result');
    const summaryContent = container.querySelector('#summary');
    resultTabBtn.classList.remove('active');
    summaryTabBtn.classList.add('active');
    resultContent.classList.remove('active');
    summaryContent.classList.add('active');
  }

  const history = JSON.parse(localStorage.getItem("training-history") || "{}");
  const dates = Object.keys(history).sort();
  const latestDate = dates[dates.length - 1] || new Date().toISOString().slice(0,10);
  const summaryContainer = container.querySelector("#summary .summary-container");
  renderSummarySection(summaryContainer, latestDate, user, { standalone: false });

  app.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      app.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b === btn));
      app.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === tab));
    });
  });
}

// ✅ セッション内で結果を再表示できないようにするためのリセット関数
export function resetResultFlag() {
  resultShownInThisSession = false;
}

// ✅ オプション：VexFlowのテストや保護者向け画面用に残す
export function renderStaffResultScreen() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="result-screen">
      <h2>結果の楽譜表示</h2>
      <div id="result-container"></div>
      <button id="back-btn">ホームへ戻る</button>
    </div>
  `;

  const noteHistory = ["C4", "D4", "F#4", "B3"]; // 仮データ
  drawStaffFromNotes(noteHistory, "result-container");

  document.getElementById("back-btn").addEventListener("click", () => {
    switchScreen("home");
  });
}

// ✅ ヘルパー関数：和音名をひらがなに変換
function getLabelHiragana(name) {
  const chord = chords.find(c => c.name === name);
  return chord?.labelHiragana || name;
}

// ✅ ヘルパー関数：和音名に対応する色クラスを返す
function getColorClass(chordName) {
  const colorMap = {
    "C-E-G": "aka", "C-F-A": "kiiro", "B-D-G": "ao", "A-C-F": "kuro",
    "D-G-B": "midori", "E-G-C": "orange", "F-A-C": "murasaki",
    "G-B-D": "pinku", "G-C-E": "chairo", "A-C#-E": "kigreen",
    "D-F#-A": "usudaidai", "E-G#-B": "fuji", "B♭-D-F": "hai",
    "E♭-G-B♭": "mizuiro"
  };
  return colorMap[chordName] || "white";
}

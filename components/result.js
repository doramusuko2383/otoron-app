// components/result.js
import { switchScreen } from "../main.js";
import { lastResults, stats, correctCount } from "./training.js";
import { chords } from "../data/chords.js";
import { drawStaffFromNotes } from "./resultStaff.js";  // 楽譜描画（必要なら）

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

// ✅ 本番用：こども向けごほうび画面
export function renderResultScreen() {
  if (resultShownInThisSession) {
    switchScreen("home");
    return;
  }

  resultShownInThisSession = true;

  const results = lastResults;
  const singleNoteMode = localStorage.getItem('singleNoteMode') === 'on';

  const totalQuestions = Object.values(stats).reduce((sum, s) => sum + (s.total || 0), 0);
  const rate = totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).toFixed(1) : '0.0';

  const summaryRows = Object.entries(stats).map(([name, st]) => {
    return `<tr><td>${getLabelHiragana(name)}</td><td>${st.correct}</td><td>${st.wrong}</td><td>${st.unknown || 0}</td></tr>`;
  }).join('');

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="tab-menu">
      <button class="tab active" data-tab="result">👶 こたえ</button>
      <button class="tab" data-tab="summary">👨‍👩‍👧 くわしく</button>
    </div>
    <div class="tab-contents">
      <div id="result" class="tab-content active">
        <div class="result-container">
          <h1>おつかれさま！</h1>
          <p class="praise">がんばったね！</p>

          <table class="result-table">
            <thead>
              <tr>
                <th>じゅんばん</th>
                <th>わおん</th>
                <th>かいとう</th>
                ${singleNoteMode ? '<th>たんおん</th><th>かいとう</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${(() => {
                let rows = '';
                let idx = 0;
                for (let i = 0; i < results.length; i++) {
                  const r = results[i];
                  if (r.isSingleNote) continue;
                  const noteRes = singleNoteMode && results[i + 1] && results[i + 1].isSingleNote ? results[i + 1] : null;
                  if (noteRes) i++;
                  idx++;
                  rows += `
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
                return rows;
              })()}
            </tbody>
          </table>

          <div class="result-footer">
            <p>この画面は1回だけのごほうびだよ♪</p>
          </div>
        </div>
      </div>
      <div id="summary" class="tab-content">
        <div class="summary-container">
          <p class="summary-note">これはおうちのひと・せんせい向けです</p>
          <p class="summary-total">正解数：${correctCount} / ${totalQuestions}（${rate}%）</p>
          <table class="summary-table">
            <thead><tr><th>わおん</th><th>◯</th><th>✕</th><th>？</th></tr></thead>
            <tbody>${summaryRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;

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

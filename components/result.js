// components/result.js
import { switchScreen } from "../main.js";
import { lastResults } from "./training.js";
import { chords } from "../data/chords.js";
import { drawStaffFromNotes } from "./resultStaff.js";  // 楽譜描画（必要なら）

let resultShownInThisSession = false;

// ✅ 本番用：こども向けごほうび画面
export function renderResultScreen() {
  if (resultShownInThisSession) {
    switchScreen("home");
    return;
  }

  resultShownInThisSession = true;

  const results = lastResults;

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="result-container">
      <h1>おつかれさま！</h1>
      <p class="praise">がんばったね！</p>

      <table class="result-table">
        <thead>
          <tr>
            <th>じゅんばん</th>
            <th>わおん</th>
            <th>かいとう</th>
          </tr>
        </thead>
        <tbody>
          ${results.map((item, index) => `
            <tr class="${item.correct ? 'correct-row' : 'wrong-row'}">
              <td>${index + 1}</td>
              <td>
                <div class="chord-box ${getColorClass(item.chordName)}">
                  ${getLabelHiragana(item.chordName)}
                </div>
              </td>
              <td>
                <div class="chord-box ${getColorClass(item.answerName)}">
                  ${getLabelHiragana(item.answerName)}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="result-footer">
        <p>この画面は1回だけのごほうびだよ♪</p>
        <button id="go-summary" class="small-btn">くわしい記録を見る（保護者向け）</button>
      </div>
    </div>
  `;

  document.getElementById("go-summary").addEventListener("click", () => {
    switchScreen("summary");
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

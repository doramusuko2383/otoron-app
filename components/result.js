// components/result.js
import { switchScreen } from "../main.js";
import { lastResults } from "./training.js";
import { chords } from "../data/chords.js"; // ←追加！

let resultShownInThisSession = false;

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

export function resetResultFlag() {
  resultShownInThisSession = false;
}

function getLabelHiragana(name) {
  const chord = chords.find(c => c.name === name);
  return chord?.labelHiragana || name;
}

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

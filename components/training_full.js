// components/training_full.js

import { getRandomNote } from "./question_full.js";
import { playNote } from "./soundPlayer.js";
import { switchScreen } from "../main.js";

let currentNote = null;
let noteHistory = [];

export function renderTrainingScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>単音テスト（本気）</h2>
    <div id="note-buttons"></div>
    <button id="finish-btn">結果を見る</button>
  `;

  // C〜B 単音ボタンを表示（#も含む）
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const container = document.getElementById("note-buttons");

  notes.forEach(note => {
    const btn = document.createElement("button");
    btn.textContent = note;
    btn.onclick = () => {
      noteHistory.push(currentNote); // 出題音名を履歴に追加
      nextQuestion();
    };
    container.appendChild(btn);
  });

  document.getElementById("finish-btn").onclick = () => {
    sessionStorage.setItem("noteHistory", JSON.stringify(noteHistory));
    switchScreen("result", user);
  };

  function nextQuestion() {
    currentNote = getRandomNote();
    playNote(currentNote);
  }

  nextQuestion();
}

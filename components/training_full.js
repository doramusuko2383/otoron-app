// components/training_full.js

import { getRandomNote } from "./question_full.js";
import { playNote } from "./soundPlayer.js";
import { switchScreen } from "../main.js";

let currentNote = null;
let noteHistory = [];
let isAnswering = false;
let questionCount = 0;
const maxQuestions = 5; // ← テスト用（本番時は30に）

export function renderTrainingScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>単音テスト（本気）</h2>
    <div id="feedback" style="font-size: 1.5em; margin: 0.5em; height: 2em;"></div>
    <div id="note-buttons"></div>
    <button id="finish-btn">結果を見る</button>
  `;

  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const container = document.getElementById("note-buttons");

  notes.forEach(note => {
    const btn = document.createElement("button");
    btn.textContent = note;
    btn.className = "note-button";
    btn.onclick = () => {
      if (isAnswering) return;
      const correct = note === currentNote.replace(/[0-9]/g, "");
      noteHistory.push({ question: currentNote, answer: note, correct });

      const feedback = document.getElementById("feedback");
      feedback.textContent = correct ? "🎉 正解！GOOD!" : `❌ 不正解 (${currentNote})`;
      feedback.style.color = correct ? "green" : "red";

      isAnswering = true;
      setTimeout(() => {
        feedback.textContent = "";
        isAnswering = false;
        questionCount++;
        if (questionCount < maxQuestions) {
          nextQuestion();
        } else {
          sessionStorage.setItem("noteHistory", JSON.stringify(noteHistory));
          switchScreen("result_full", user);
        }
      }, 1000);
    };
    container.appendChild(btn);
  });

  document.getElementById("finish-btn").onclick = () => {
    sessionStorage.setItem("noteHistory", JSON.stringify(noteHistory));
    switchScreen("result_full", user);
  };

  function nextQuestion() {
    currentNote = getRandomNote();
    playNote(currentNote);
  }

  nextQuestion();
}

// components/training_full.js

import { getRandomNote } from "./question_full.js";
import { playNote } from "./soundPlayer.js";
import { switchScreen } from "../main.js";

let currentNote = null;
let noteHistory = [];
let isAnswering = false;
let isSoundPlaying = false;
let questionCount = 0;
const maxQuestions = 5; // ← テスト用（本番時は30に）

const noteLabels = {
  "C": "ド",
  "D": "レ",
  "E": "ミ",
  "F": "ファ",
  "G": "ソ",
  "A": "ラ",
  "B": "シ",
  "C#": "チス",
  "D#": "エス",
  "F#": "フィス",
  "G#": "ジス",
  "A#": "ベー",
};

export function renderTrainingScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>単音テスト（本気）</h2>
    <div id="feedback"></div>
    <div class="piano-container">
      <div class="white-keys"></div>
    </div>
    <button id="finish-btn">やめる</button>
  `;

  const whiteOrder = ["C", "D", "E", "F", "G", "A", "B"];
  const blackOrder = [
    { note: "C#", pos: "pos1" },
    { note: "D#", pos: "pos2" },
    { note: "F#", pos: "pos3" },
    { note: "G#", pos: "pos4" },
    { note: "A#", pos: "pos5" },
  ];

  const whiteContainer = app.querySelector(".white-keys");
  whiteOrder.forEach(n => {
    const btn = document.createElement("button");
    btn.className = "key-white";
    btn.dataset.note = n;
    btn.textContent = noteLabels[n];
    whiteContainer.appendChild(btn);
  });

  const piano = app.querySelector(".piano-container");
  blackOrder.forEach((b, i) => {
    const btn = document.createElement("button");
    btn.className = `key-black ${b.pos}`;
    btn.dataset.note = b.note;
    btn.textContent = noteLabels[b.note];
    piano.appendChild(btn);
  });

  piano.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || isAnswering || isSoundPlaying) return;
    const note = btn.dataset.note;
    const correct = note === currentNote.replace(/[0-9-]/g, "");
    noteHistory.push({ question: currentNote, answer: note, correct });

    const feedback = document.getElementById("feedback");
    feedback.textContent = correct ? "🎉 正解!" : "❌ 不正解";
    feedback.style.color = correct ? "green" : "red";

    isAnswering = true;
    if (correct) {
      isSoundPlaying = true;
      playNote(currentNote).then(() => {
        isSoundPlaying = false;
      });
    }
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
  });

  document.getElementById("finish-btn").onclick = () => {
    switchScreen("settings", user);
  };

  function nextQuestion() {
    currentNote = getRandomNote();
    isSoundPlaying = true;
    playNote(currentNote).then(() => {
      isSoundPlaying = false;
    });
  }

  nextQuestion();
}

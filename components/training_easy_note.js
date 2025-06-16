// components/training_easy_note.js

import { getRandomNoteSequence } from "./question_easy.js";
import { playNote } from "./soundPlayer.js";
import { switchScreen } from "../main.js";
import { saveTrainingSession } from "../utils/trainingStore_supabase.js";

let currentNote = null;
let noteSequence = [];
let noteHistory = [];
let isAnswering = false;
let isSoundPlaying = false;
let questionCount = 0;
const FEEDBACK_DELAY = 1000;
const maxQuestions = 24;

const noteLabels = {
  "C": "ど",
  "D": "れ",
  "E": "み",
  "F": "ふぁ",
  "G": "そ",
  "A": "ら",
  "B": "し",
  "C#": "ちす",
  "D#": "えす",
  "F#": "ふぃす",
  "G#": "じす",
  "A#": "べー",
  "Db": "ちす",
  "Eb": "えす",
  "Gb": "ふぃす",
  "Ab": "じす",
  "Bb": "べー",
};

function kanaToHiragana(str) {
  return str.replace(/[ァ-ン]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

export async function renderTrainingScreen(user) {
  const app = document.getElementById("app");
  // reset session state
  currentNote = null;
  noteSequence = [];
  noteHistory = [];
  isAnswering = false;
  isSoundPlaying = false;
  questionCount = 0;
  app.innerHTML = `
    <h2>単音テスト（3オクターブ）</h2>
    <div id="feedback"></div>
    <div class="piano-container">
      <div class="white-keys"></div>
    </div>
  `;

  const finishBtn = document.createElement("button");
  finishBtn.id = "finish-btn";
  finishBtn.textContent = "やめる";
  const bottomWrap = document.createElement("footer");
  bottomWrap.id = "training-footer";
  bottomWrap.appendChild(finishBtn);

  const debugAnswer = document.createElement("div");
  debugAnswer.style.position = "absolute";
  debugAnswer.style.top = "10px";
  debugAnswer.style.right = "10px";
  debugAnswer.style.fontSize = "0.9em";
  debugAnswer.style.color = "gray";
  app.appendChild(debugAnswer);
  app.appendChild(bottomWrap);

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

  function setInteraction(enabled) {
    if (enabled) {
      piano.classList.remove("disabled");
      finishBtn.classList.remove("disabled");
      finishBtn.disabled = false;
    } else {
      piano.classList.add("disabled");
      finishBtn.classList.add("disabled");
      finishBtn.disabled = true;
    }
  }

  blackOrder.forEach(b => {
    const btn = document.createElement("button");
    btn.className = `key-black ${b.pos}`;
    btn.dataset.note = b.note;
    btn.textContent = noteLabels[b.note];
    piano.appendChild(btn);
  });

  piano.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || isAnswering || isSoundPlaying) return;
    setInteraction(false);
    const note = btn.dataset.note;
    const correct = note === currentNote.replace(/[0-9]/g, "");
    noteHistory.push({
      noteQuestion: currentNote,
      noteAnswer: note,
      correct,
      isSingleNote: true
    });

    const feedback = document.getElementById("feedback");
    feedback.textContent = correct ? "🎉 正解!" : "❌ 不正解";
    feedback.style.color = correct ? "green" : "red";

    isAnswering = true;
    const proceed = () => {
      setTimeout(async () => {
        feedback.textContent = "";
        isAnswering = false;
        questionCount++;
        if (questionCount < maxQuestions) {
          nextQuestion();
        } else {
          sessionStorage.setItem("noteHistory", JSON.stringify(noteHistory));
          await saveTrainingSession({
            userId: user.id,
            results: { type: 'note-easy', results: noteHistory },
            stats: {},
            mistakes: {},
            correctCount: noteHistory.filter(n => n.correct).length,
            totalCount: noteHistory.length,
            date: new Date().toISOString()
          });
          switchScreen("result_easy", user);
        }
      }, FEEDBACK_DELAY);
    };

    proceed();
  });

  finishBtn.onclick = () => {
    switchScreen("settings", user);
  };

  function nextQuestion() {
    if (noteSequence.length === 0) {
      noteSequence = getRandomNoteSequence(maxQuestions);
    }
    currentNote = noteSequence.pop();
    debugAnswer.textContent = `【デバッグ】正解: ${kanaToHiragana(noteLabels[currentNote.replace(/[0-9]/g, "")])}（${currentNote}）`;
    isSoundPlaying = true;
    setInteraction(false);
    playNote(currentNote).then(() => {
      isSoundPlaying = false;
      setInteraction(true);
    });
  }

  nextQuestion();
}

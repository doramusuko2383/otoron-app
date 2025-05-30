// 修正済み training.js（黒鍵転回形も正しく表示）
import { chords } from "../data/chords.js";
import { selectedChords } from "./settings.js";
import { switchScreen } from "../main.js";
import { showCustomConfirm } from "./home.js";
import { resetResultFlag } from "./result.js";
import { saveSessionToHistory } from "./summary.js";
import { incrementSetCount, updateTrainingRecord } from "../utils/recordStore_supabase.js";
import { autoUnlockNextChord } from "../utils/progressUtils.js";
import { getAudio } from "../utils/audioCache.js";

let questionCount = 0;
let currentAnswer = null;
let quitFlag = false;
let currentAudio = null;
let alreadyTried = false;
let questionQueue = [];
let isForcedAnswer = false;
let currentUser = null; // ← 追加

export const stats = {};
export const mistakes = {};
export const firstMistakeInSession = { flag: false, wrong: null };
export let lastResults = [];
export let correctCount = 0;

function playSoundThen(name, callback) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = getAudio(`audio/${name}.mp3`);
  currentAudio.onended = () => setTimeout(callback, 100);
  currentAudio.onerror = () => {
    console.error("⚠️ 音声ファイルが読み込めませんでした:", name);
    callback();
  };
  currentAudio.play();
}

function createQuestionQueue() {
  let queue = [];
  selectedChords.forEach(chord => {
    for (let i = 0; i < chord.count; i++) {
      queue.push(chord.name);
    }
  });
  return shuffleArray(queue);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function renderTrainingScreen(user) {
  currentUser = user; // ← 保持
  resetResultFlag();
  lastResults = [];

  for (const key in stats) delete stats[key];
  for (const key in mistakes) delete mistakes[key];
  correctCount = 0;

  if (!selectedChords || selectedChords.length === 0) {
    selectedChords.push({ name: "C-E-G", count: 4 });
    localStorage.setItem("selectedChords", JSON.stringify(selectedChords));
  }

  questionCount = 0;
  quitFlag = false;
  alreadyTried = false;
  isForcedAnswer = false;
  firstMistakeInSession.flag = false;
  questionQueue = createQuestionQueue();
  nextQuestion();
}

async function nextQuestion() {
  alreadyTried = false;
  isForcedAnswer = false;
  if (questionQueue.length === 0 || quitFlag) {
    saveSessionToHistory();

    await updateTrainingRecord({
      userId: currentUser.id,
      correct: correctCount,
      total: questionCount
    });

    await incrementSetCount(currentUser.id);
    await autoUnlockNextChord(currentUser);
  
    const sound = (correctCount === questionCount) ? "perfect" : "end";
    playSoundThen(sound, () => {
      sessionStorage.setItem('openResultChild', 'true');
      switchScreen("result");
    });
    return;
  }
  
  showQuiz();
}

function showQuiz() {
  const nextChordName = questionQueue.pop();
  currentAnswer = chords.find(c => c.name === nextChordName);
  drawQuizScreen();
  playChordFile(currentAnswer.file);
}

function drawQuizScreen() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const container = document.createElement("div");
  container.className = "screen active";
  // Avoid scroll by accounting for header height and padding
  container.style.minHeight = "calc(100dvh - 56px - 7em)";
  container.style.boxSizing = "border-box";
  container.style.padding = "1em 0 6em";
  // Avoid potential horizontal scroll on mobile
  container.style.width = "100%";

  const feedback = document.createElement("div");
  feedback.id = "feedback";
  feedback.className = "";
  feedback.style.position = "fixed";
  feedback.style.top = "40%";
  feedback.style.left = "0";
  feedback.style.right = "0";
  feedback.style.textAlign = "center";
  feedback.style.fontSize = "3em";
  feedback.style.fontWeight = "bold";
  feedback.style.zIndex = "999";
  feedback.style.display = "none";
  container.appendChild(feedback);

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.width = "100%";
  header.style.maxWidth = "600px";
  header.style.margin = "1em auto 0.5em";
  header.style.padding = "0 1em";

  const counter = document.createElement("h2");
  const total = questionQueue.length + questionCount + 1;
  counter.textContent = `${questionCount} / ${total}`;
  counter.style.fontSize = "1.2em";
  header.appendChild(counter);

  const progress = document.createElement("progress");
  progress.value = questionCount;
  progress.max = total;
  progress.style.width = "60%";
  progress.style.height = "1em";
  header.appendChild(progress);

  const layout = document.createElement("div");
  layout.className = "grid-container";
  layout.style.display = "grid";
  layout.style.gap = "12px";
  layout.style.width = "100%";
  layout.style.margin = "0 auto";

  const btnCount = selectedChords.length;
  let cols = 5;
  if (btnCount === 1) {
    cols = 1;
  } else if (btnCount === 2) {
    cols = 2;
  } else if (btnCount <= 4) {
    cols = 2; // 2×2 grid
  } else if (btnCount <= 9) {
    cols = 3; // 3×3 grid
  } else {
    cols = 5; // 5×5 grid for 10 or more
  }
  layout.classList.add(`cols-${cols}`);

  const order = [
    "C-E-G", "C-F-A", "B-D-G", "A-C-F", "D-G-B",
    "E-G-C", "F-A-C", "G-B-D", "G-C-E", null,
    "A-C#-E", "D-F#-A", "E-G#-B", "B♭-D-F", "E♭-G-B♭",
    "C#-E-A", "F#-A-D", "G#-B-E", "D-F-B♭", "G-B♭-E♭",
    "E-A-C#", "A-D-F#", "B-E-G#", "F-B♭-D", "B♭-E♭-G"
  ];

  const visibleNames = selectedChords.map(c => c.name);
  const sorted = visibleNames.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  let gridSize = 25;
  if (btnCount <= 4) {
    gridSize = 4;
  } else if (btnCount <= 9) {
    gridSize = 9;
  }

  for (let i = 0; i < gridSize; i++) {
    const name = sorted[i];
    if (!name) {
      const placeholder = document.createElement("div");
      placeholder.className = "square-btn";
      placeholder.style.visibility = "hidden";
      layout.appendChild(placeholder);
      continue;
    }

    const chord = chords.find(c => c.name === name);
    if (!chord) continue;

    const wrapper = document.createElement("div");
    wrapper.className = "square-btn";

    const inner = document.createElement("div");
    inner.className = `square-btn-content ${chord.colorClass}`;
    inner.innerHTML = chord.labelHtml;
    inner.setAttribute("data-name", chord.name);
    inner.style.pointerEvents = "auto";
    inner.style.opacity = "1";
    inner.addEventListener("click", () => checkAnswer(chord.name));

    wrapper.appendChild(inner);
    layout.appendChild(wrapper);
  }

  const quitBtn = document.createElement("button");
  quitBtn.textContent = "やめる";
  quitBtn.onclick = () => {
    showCustomConfirm("ほんとうに やめちゃうの？", () => {
      quitFlag = true;
      switchScreen("home");
    });
  };

  const debugAnswer = document.createElement("div");
  debugAnswer.textContent = `【デバッグ】正解: ${currentAnswer.label}（${currentAnswer.name}）`;
  debugAnswer.style.position = "absolute";
  debugAnswer.style.top = "10px";
  debugAnswer.style.right = "10px";
  debugAnswer.style.fontSize = "0.9em";
  debugAnswer.style.color = "gray";

  const unknownBtn = document.createElement("button");
  unknownBtn.id = "unknownBtn";
  unknownBtn.textContent = "わからない";
  unknownBtn.onclick = () => {
    if (alreadyTried || isForcedAnswer) return;

    alreadyTried = true;
    isForcedAnswer = true;

    stats[currentAnswer.name] = stats[currentAnswer.name] || { correct: 0, wrong: 0, unknown: 0, total: 0 };
    stats[currentAnswer.name].unknown++;
    stats[currentAnswer.name].total++;

    mistakes[currentAnswer.name] = mistakes[currentAnswer.name] || {};
    mistakes[currentAnswer.name]["わからない"] = (mistakes[currentAnswer.name]["わからない"] || 0) + 1;

    lastResults.push({ chordName: currentAnswer.name, answerName: "", correct: false });

    document.querySelectorAll(".square-btn-content").forEach(btn => {
      const chordName = btn.getAttribute("data-name");
      if (chordName === currentAnswer.name) {
        btn.style.pointerEvents = "auto";
        btn.style.opacity = "1";
      } else {
        btn.style.pointerEvents = "none";
        btn.style.opacity = "0.4";
      }
    });

// 正解のボタンに星を表示
const correctBtn = document.querySelector(`.square-btn-content[data-name="${currentAnswer.name}"]`);
if (correctBtn) {
  correctBtn.classList.add("correct-mark");
}

    showFeedback("もういちど", "bad");
    const soundKey = currentAnswer.soundKey || currentAnswer.colorClass;
    playSoundThen(`wrong_${soundKey}`, () => {
      playChordFile(currentAnswer.file);
    });
  };

  const bottomWrap = document.createElement("div");
  bottomWrap.id = "bottom-buttons";
  bottomWrap.appendChild(unknownBtn);
  bottomWrap.appendChild(quitBtn);

  container.appendChild(debugAnswer);
  container.appendChild(header);
  container.appendChild(layout);
  app.appendChild(container);
  app.appendChild(bottomWrap);
}


function playChordFile(filename) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = getAudio(`audio/${filename}`);
  currentAudio.onerror = () => console.error("音声ファイルが見つかりません:", filename);
  currentAudio.play();
}

function showFeedback(message, type = "good") {
  const fb = document.getElementById("feedback");
  if (!fb) return;
  fb.textContent = message;
  fb.className = type === "good" ? "good" : "bad";
  fb.style.display = "block";
  setTimeout(() => {
    fb.style.display = "none";
  }, 1000);
}

function checkAnswer(selected) {
  const name = currentAnswer.name;
  stats[name] = stats[name] || { correct: 0, wrong: 0, total: 0 };

  if (isForcedAnswer) {
    isForcedAnswer = false;
    questionCount++;
    nextQuestion();
    return;
  }

  if (!alreadyTried) {
    stats[name].total++;
    lastResults.push({ chordName: name, answerName: selected, correct: selected === name });
  }

  if (questionCount === 0 && selected !== name) {
    firstMistakeInSession.flag = true;
    firstMistakeInSession.wrong = selected;
  }

  if (selected === name) {
    stats[name].correct++;
    if (!alreadyTried) {
      correctCount++;
    }
    questionCount++;

    document.querySelectorAll(".square-btn-content").forEach(btn => {
      btn.style.pointerEvents = "none";
      btn.style.opacity = "0.4";
    });

    if (questionQueue.length === 0) {
      showFeedback("トレーニング終了！", "good");
      const sound = (correctCount === questionCount) ? "perfect" : "end";
      saveSessionToHistory();
      playSoundThen(sound, () => {
        sessionStorage.setItem('openResultChild', 'true');
        switchScreen("result");
      });
    } else {
      const voices = ["good1", "good2"];
      showFeedback("GOOD!", "good");
      playSoundThen(voices[Math.floor(Math.random() * voices.length)], () => {
        nextQuestion();
      });
    }
  } else {
    alreadyTried = true;
    stats[name].wrong++;
    mistakes[name] = mistakes[name] || {};
    mistakes[name][selected] = (mistakes[name][selected] || 0) + 1;

    document.querySelectorAll(".square-btn-content").forEach(btn => {
      const chordName = btn.getAttribute("data-name");
      if (chordName === name) {
        btn.style.pointerEvents = "auto";
        btn.style.opacity = "1";
      } else {
        btn.style.pointerEvents = "none";
        btn.style.opacity = "0.4";
      }
    });

      // 🔽 ここに追加
  const correctBtn = document.querySelector(`.square-btn-content[data-name="${name}"]`);
  if (correctBtn) {
    correctBtn.classList.add("correct-mark");
  }

    showFeedback("もういちど", "bad");
    const soundKey = currentAnswer.soundKey || currentAnswer.colorClass;
    playSoundThen(`wrong_${soundKey}`, () => {
      playChordFile(currentAnswer.file);
    });
  }
}

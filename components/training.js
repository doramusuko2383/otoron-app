import { chords } from "../data/chords.js";
import { selectedChords } from "./settings.js";
import { switchScreen } from "../main.js";
import { showCustomConfirm } from "./home.js";
import { updateGrowthRecord } from "../utils/growthUtils.js";

let questionCount = 0;
let correctCount = 0;
let currentAnswer = null;
let quitFlag = false;
let currentAudio = null;
let alreadyTried = false;
let questionQueue = [];

export const stats = {};
export const mistakes = {};
export const firstMistakeInSession = { flag: false, wrong: null };

function playSoundThen(name, callback) {
  console.log("🔊 再生ファイル:", `audio/${name}.mp3`);
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = new Audio(`audio/${name}.mp3`);
  currentAudio.onended = () => setTimeout(callback, 100);
  currentAudio.onerror = () => {
    console.error("⚠️ 音声ファイルが読み込めませんでした:", name);
    callback();
  };
  currentAudio.play();
}

function toHiragana(label) {
  const map = {
    "赤": "あか", "黄色": "きいろ", "青": "あお", "黒": "くろ", "緑": "みどり",
    "オレンジ": "おれんじ", "紫": "むらさき", "ピンク": "ぴんく", "茶色": "ちゃいろ",
    "黄緑": "きみどり", "薄橙": "うすだいだい", "藤色": "ふじいろ",
    "灰色": "はいいろ", "水色": "みずいろ"
  };
  return map[label] || label;
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

export function renderTrainingScreen() {
  if (!selectedChords || selectedChords.length === 0) {
    selectedChords.push({ name: "C-E-G", count: 4 });
    localStorage.setItem("selectedChords", JSON.stringify(selectedChords));
  }
  questionCount = 0;
  correctCount = 0;
  quitFlag = false;
  alreadyTried = false;
  firstMistakeInSession.flag = false;
  questionQueue = createQuestionQueue();
  nextQuestion();
}

function nextQuestion() {
  alreadyTried = false;
  if (questionQueue.length === 0 || quitFlag) {
    const sound = (correctCount === questionCount) ? "perfect" : "end";
    playSoundThen(sound, () => switchScreen("summary"));
    return;
  }

  if (questionCount === Math.floor((questionQueue.length + questionCount) * 0.8)) {
    playSoundThen("almost", () => showQuiz());
  } else {
    showQuiz();
  }
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
  container.style.padding = "0";
  container.style.width = "100vw";

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
  header.style.justifyContent = "center";
  header.style.width = "100%";
  header.style.marginBottom = "1em";

  const counter = document.createElement("h2");
  counter.textContent = `${questionCount + 1}`;
  header.appendChild(counter);

  const layout = document.createElement("div");
  layout.style.display = "grid";
  layout.style.gridTemplateColumns = "repeat(5, 1fr)";
  layout.style.gap = "2px";
  layout.style.width = "100%";
  layout.style.padding = "0 2px";
  layout.style.boxSizing = "border-box";
  layout.style.margin = "0";

  const order = [
    "C-E-G", "C-F-A", "B-D-G", "A-C-F", "D-G-B",
    "E-G-C", "F-A-C", "G-B-D", "G-C-E", null,
    "A-C#-E", "D-F#-A", "E-G#-B", "B♭-D-F", "E♭-G-B♭",
    "C#-E-A", "F#-A-D", "G#-B-E", "D-F-B♭", "G-B♭-E♭",
    "E-A-C#", "A-D-F#", "B-E-G#", "F-B♭-D", "B♭-E♭-G"
  ];

  order.forEach(name => {
    const btn = document.createElement("button");
    if (name === null) {
      btn.disabled = true;
      btn.style.visibility = "hidden";
    } else {
      const chord = chords.find(c => c.name === name);
      if (!chord) return;
      btn.className = `color-btn ${chord.colorClass}`;
      btn.textContent = toHiragana(chord.label);
      btn.style.aspectRatio = "1/1";
      btn.style.width = "100%";
      btn.style.fontSize = "clamp(10px, 3vw, 16px)";
      if (chord.colorClass === "white") {
        btn.style.color = "black";
        btn.style.border = "2px solid #333";
      }
      btn.disabled = true;
      btn.style.visibility = "hidden";
      if (selectedChords.some(sc => sc.name === chord.name)) {
        btn.disabled = false;
        btn.style.visibility = "visible";
        btn.onclick = () => checkAnswer(chord.name);
      }
    }
    layout.appendChild(btn);
  });

  const quitBtn = document.createElement("button");
  quitBtn.textContent = "やめる";
  quitBtn.onclick = () => {
    showCustomConfirm(() => {
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

  container.appendChild(debugAnswer);
  container.appendChild(header);
  container.appendChild(layout);
  container.appendChild(quitBtn);
  app.appendChild(container);
}

function playChordFile(filename) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = new Audio(`audio/${filename}`);
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
  stats[name].total++;

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

    updateGrowthRecord({ correct: 1, total: 1 });

    if (questionQueue.length === 0) {
      showFeedback("トレーニング終了！", "good");
      const sound = (correctCount === questionCount) ? "perfect" : "end";
      playSoundThen(sound, () => switchScreen("summary"));
    } else {
      const voices = ["good1", "good2"];
      showFeedback("GOOD!", "good");
      playSoundThen(voices[Math.floor(Math.random() * voices.length)], () => {
        nextQuestion();
      });
    }
  } else {
    console.log("🔍 currentAnswer:", currentAnswer.name, currentAnswer.label, currentAnswer.soundKey);
    console.log("🔍 選択した和音:", selected);

    alreadyTried = true;
    stats[name].wrong++;
    mistakes[name] = mistakes[name] || {};
    mistakes[name][selected] = (mistakes[name][selected] || 0) + 1;

    updateGrowthRecord({ correct: 0, total: 1 });

    showFeedback("もういちど", "bad");
    const soundKey = currentAnswer.soundKey || currentAnswer.colorClass;
    playSoundThen(`wrong_${soundKey}`, () => {
      playChordFile(currentAnswer.file);
    });
  }
}

export { correctCount };

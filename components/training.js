// 修正済み training.js（黒鍵転回形も正しく表示）
import { chords } from "../data/chords.js";
import { selectedChords } from "./settings.js";
import { switchScreen } from "../main.js";
import { showCustomConfirm } from "./home.js";
import { resetResultFlag } from "./result.js";
import { saveSessionToHistory } from "./summary.js";
import { incrementSetCount, updateTrainingRecord } from "../utils/recordStore_supabase.js";
import { autoUnlockNextChord } from "../utils/progressUtils.js";
import { saveTrainingSession } from "../utils/trainingStore_supabase.js";
import { generateRecommendedQueue } from "../utils/growthUtils.js";
import { loadGrowthFlags } from "../utils/growthStore_supabase.js";
import { getAudio } from "../utils/audioCache.js";

let questionCount = 0;
let currentAnswer = null;
let quitFlag = false;
let currentAudio = null;
let alreadyTried = false;
let questionQueue = [];
let isForcedAnswer = false;
let currentUser = null; // ← 追加
let singleNoteMode = false;
let singleNoteStrategy = 'top';
let chordProgressCount = 0;
let chordSoundOn = true;

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
  const encoded = encodeURIComponent(name);
  currentAudio = getAudio(`audio/${encoded}.mp3`);
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

export async function renderTrainingScreen(user) {
  console.log("🟢 renderTrainingScreen: user.id =", user?.id);
  currentUser = user;
  singleNoteMode = localStorage.getItem("singleNoteMode") === "on";
  singleNoteStrategy = localStorage.getItem("singleNoteStrategy") || 'top';
  chordSoundOn = localStorage.getItem("chordSound") !== "off";
  const flags = await loadGrowthFlags(user.id);
  chordProgressCount = Object.values(flags).filter(f => f.unlocked).length;
  resetResultFlag();
  lastResults = [];

  for (const key in stats) delete stats[key];
  for (const key in mistakes) delete mistakes[key];
  correctCount = 0;

  // ✅ 常にストレージから出題設定を読み込み直す
  selectedChords.length = 0;
  questionQueue = [];

  const trainingMode = sessionStorage.getItem("trainingMode");
  const storedChords = sessionStorage.getItem("selectedChords");

  if (trainingMode === "custom" && storedChords) {
    selectedChords.push(...JSON.parse(storedChords));
    questionQueue = createQuestionQueue();
  } else {
    // ✅ 推奨出題で自動構成
    const queue = generateRecommendedQueue(flags);

    const countMap = {};
    queue.forEach(name => {
      countMap[name] = (countMap[name] || 0) + 1;
    });

    const recommended = chords
      .filter(ch => countMap[ch.name])
      .map(ch => ({
        name: ch.name,
        count: countMap[ch.name]
      }));

    selectedChords.push(...recommended);
    localStorage.setItem("selectedChords", JSON.stringify(recommended));
    questionQueue = [...queue];
  }
  questionCount = 0;
  quitFlag = false;
  alreadyTried = false;
  isForcedAnswer = false;
  firstMistakeInSession.flag = false;
  if (!questionQueue.length) {
    questionQueue = createQuestionQueue();
  }
  nextQuestion(); // ✅ 出題開始！
}

async function nextQuestion() {
  if (!currentUser || !currentUser.id) {
    console.error("❌ currentUser が null または id が未定義です");
    return;
  }
  console.log("🧩 nextQuestion():",
  "queue.length =", questionQueue.length,
  "questionCount =", questionCount,
  "quitFlag =", quitFlag
);
  alreadyTried = false;
  isForcedAnswer = false;
  if (questionQueue.length === 0 || quitFlag) {

    // 🔽 ここで一括保存
    await saveTrainingSession({
      userId: currentUser.id,
      results: lastResults,
      stats,
      mistakes,
      correctCount,
      totalCount: questionCount,
      date: new Date().toISOString(),
    });

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
  counter.id = "progress-counter";
  const total = questionQueue.length + questionCount + 1;
  counter.textContent = `${questionCount} / ${total}`;
  counter.style.fontSize = "1.2em";
  header.appendChild(counter);

  const progress = document.createElement("progress");
  progress.id = "progress-bar";
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
  if (btnCount === 1 && visibleNames.length === 1) {
    const only = chords.find(c => c.name === visibleNames[0]);
    if (only) {
      const wrapper = document.createElement("div");
      wrapper.className = "square-btn";

      const inner = document.createElement("div");
      inner.className = `square-btn-content ${only.colorClass}`;
      inner.innerHTML = chordProgressCount >= 10 && only.italian
        ? only.italian.map(kanaToHiragana).join("<br>")
        : only.labelHtml;
      inner.setAttribute("data-name", only.name);
      inner.style.pointerEvents = "auto";
      inner.style.opacity = "1";
      inner.addEventListener("click", () => checkAnswer(only.name));

      wrapper.appendChild(inner);
      layout.appendChild(wrapper);
    }
  } else {
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
      if (chordProgressCount >= 10 && chord.italian) {
        inner.innerHTML = chord.italian.map(kanaToHiragana).join("<br>");
      } else {
        inner.innerHTML = chord.labelHtml;
      }
      inner.setAttribute("data-name", chord.name);
      inner.style.pointerEvents = "auto";
      inner.style.opacity = "1";
      inner.addEventListener("click", () => checkAnswer(chord.name));

      wrapper.appendChild(inner);
      layout.appendChild(wrapper);
    }
  }

  const quitBtn = document.createElement("button");
  quitBtn.id = "quitBtn";
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

// 正解ボタンを光らせて強調
const correctBtn = document.querySelector(`.square-btn-content[data-name="${currentAnswer.name}"]`);
if (correctBtn) {
  correctBtn.classList.add("correct-highlight");
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
  if (!chordSoundOn) return;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = getAudio(`audio/${filename}`);
  currentAudio.onerror = () => console.error("音声ファイルが見つかりません:", filename);
  currentAudio.play();
}

function normalizeNoteName(name) {
  return name
    .replace("C♭", "B")
    .replace("D♭", "C#")
    .replace("E♭", "D#")
    .replace("F♭", "E")
    .replace("G♭", "F#")
    .replace("A♭", "G#")
    .replace("B♭", "A#")
    .replace("E#", "F")
    .replace("B#", "C")
    .replace("♯", "#");
}

function playNoteFile(note, callback) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  const encoded = encodeURIComponent(normalizeNoteName(note));
  currentAudio = getAudio(`sounds/${encoded}.mp3`);
  currentAudio.onerror = () => console.error("音声ファイルが見つかりません:", note);
  if (callback) {
    currentAudio.onended = () => setTimeout(callback, 100);
  }
  currentAudio.play();
}

function noteToMidi(n) {
  const m = normalizeNoteName(n).match(/^([A-G])([#b]?)(-?\d)$/);
  if (!m) return 0;
  const baseMap = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
  let [, p, acc, oct] = m;
  let val = baseMap[p] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0);
  return (parseInt(oct,10)+1)*12 + val;
}

function chooseSingleNote(notes) {
  if (singleNoteStrategy === 'top') {
    return notes.reduce((max, n) =>
      noteToMidi(n) > noteToMidi(max) ? n : max, notes[0]);
  }

  const black = notes.filter(n => n.includes('#') || n.includes('♭'));
  if (black.length > 0 && Math.random() < 0.8) {
    return black[Math.floor(Math.random() * black.length)];
  }
  return notes[Math.floor(Math.random() * notes.length)];
}

function toPitchClass(note) {
  return note.replace(/[0-9]/g, '').replace('♭', 'b');
}

function generateNoteOptions(correct, chordNotes = null) {
  if (Array.isArray(chordNotes) && chordNotes.length > 0) {
    const seen = new Set();
    const opts = [];
    chordNotes.forEach(n => {
      const pc = toPitchClass(n);
      if (!seen.has(pc)) {
        seen.add(pc);
        opts.push(pc);
      }
    });
    return opts;
  }

  const pool = [
    'C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'
  ].filter(n => n !== correct);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const opts = [correct, pool[0], pool[1]];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

function showSingleNoteQuiz(chord, onFinish, isLast = false) {
  const note = chooseSingleNote(chord.notes);
  const pitch = toPitchClass(note);
  const options = generateNoteOptions(pitch, chord.notes);

  const container = document.querySelector('.screen.active');
  if (!container) return;

  const layout = container.querySelector('.grid-container');
  const unknownBtn = container.querySelector('#unknownBtn');
  const quitBtn = container.querySelector('#quitBtn');
  if (layout) layout.style.display = 'none';
  if (unknownBtn) unknownBtn.style.display = 'none';
  if (quitBtn) quitBtn.style.display = 'none';

  const overlay = document.createElement('div');
  overlay.id = 'single-note-overlay';
  overlay.style.textAlign = 'center';
  overlay.style.marginTop = '2em';
  container.appendChild(overlay);

  const feedback = document.getElementById('feedback');

  const optionWrap = document.createElement('div');
  optionWrap.className = 'single-note-options';
  optionWrap.style.display = 'flex';
  optionWrap.style.justifyContent = 'center';
  optionWrap.style.gap = '12px';
  optionWrap.style.marginTop = '1em';
  overlay.appendChild(optionWrap);

  let recorded = false;

  function getWrongSoundName() {
    const p = pitch;
    switch (p) {
      case 'Db': return 'wrong_C#';
      case 'Gb': return 'wrong_F#';
      case 'Ab': return 'wrong_G#';
      case 'Bb': return 'wrong_A#';
      case 'Eb': return 'wrong_D#';
      case 'A#': return 'wrong_A#';
      case 'D#': return 'wrong_D#';
      default: return `wrong_${p}`;
    }
  }

  function setActive(active) {
    optionWrap.querySelectorAll('button').forEach(b => {
      b.disabled = !active;
      b.style.opacity = active ? '1' : '0.5';
    });
  }

  function handle(selection) {
    setActive(false);
    const correct = selection === pitch;
    if (!recorded) {
      lastResults.push({
        chordName: chord.name,
        noteQuestion: note,
        noteAnswer: selection,
        correct,
        isSingleNote: true
      });
      recorded = true;
    }

    if (correct) {
      showFeedback('GOOD!', 'good');
      const voices = ['good1', 'good2'];
      playSoundThen(voices[Math.floor(Math.random() * voices.length)], () => {
        overlay.remove();
        if (!isLast) {
          if (layout) layout.style.display = '';
          if (unknownBtn) unknownBtn.style.display = '';
          if (quitBtn) quitBtn.style.display = '';
        }
        onFinish();
      });
    } else {
      showFeedback('もういちど', 'bad');
      const wrongName = getWrongSoundName();
      playSoundThen(wrongName, () => {
        playNoteFile(note, () => {
          setActive(true);
        });
      });
    }
  }

  options.forEach(n => {
    const btn = document.createElement('button');
    btn.textContent = noteLabels[n] || n;
    btn.style.fontSize = '1.5em';
    btn.style.padding = '0.5em 1em';
    btn.onclick = () => handle(n);
    optionWrap.appendChild(btn);
  });

  playNoteFile(note, () => {
    setActive(true);
  });
}

let feedbackTimeoutId;
function showFeedback(message, type = "good", duration = 1000) {
  const fb = document.getElementById("feedback");
  if (!fb) return;

  // Cancel previous hide timer to avoid unintended clearing
  if (feedbackTimeoutId) {
    clearTimeout(feedbackTimeoutId);
    feedbackTimeoutId = null;
  }

  fb.textContent = message;
  fb.className = type === "good" ? "good" : "bad";
  fb.style.display = "block";
  if (duration !== 0) {
    feedbackTimeoutId = setTimeout(() => {
      fb.style.display = "none";
      feedbackTimeoutId = null;
    }, duration);
  }
}

function updateProgressUI() {
  const bar = document.getElementById('progress-bar');
  const counter = document.getElementById('progress-counter');
  if (bar) bar.value = questionCount;
  if (counter && bar) {
    counter.textContent = `${questionCount} / ${bar.max}`;
  }
}

function checkAnswer(selected) {
  const name = currentAnswer.name;
  stats[name] = stats[name] || { correct: 0, wrong: 0, total: 0 };

  if (isForcedAnswer) {
    isForcedAnswer = false;
    questionCount++;
    updateProgressUI();
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
    updateProgressUI();

    document.querySelectorAll(".square-btn-content").forEach(btn => {
      btn.style.pointerEvents = "none";
      btn.style.opacity = "0.4";
    });

    const proceed = () => {
      if (questionQueue.length === 0) {
        console.log("📌 nextQuestion: セッション終了に到達");

        showFeedback("トレーニング終了！", "good", 0);
        nextQuestion();
      } else {
        nextQuestion();
      }
    };

    const voices = ["good1", "good2"];
    showFeedback("GOOD!", "good");
    playSoundThen(voices[Math.floor(Math.random() * voices.length)], () => {
      if (singleNoteMode) {
        const isLast = questionQueue.length === 0;
        showSingleNoteQuiz(currentAnswer, proceed, isLast);
      } else {
        proceed();
      }
    });
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
    correctBtn.classList.add("correct-highlight");
  }

    showFeedback("もういちど", "bad");
    const soundKey = currentAnswer.soundKey || currentAnswer.colorClass;
    playSoundThen(`wrong_${soundKey}`, () => {
      playChordFile(currentAnswer.file);
    });
  }
}

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
import { safePlayAudio } from "../utils/audioPlayback.js";
import { kanaToHiragana, noteLabels } from "../utils/noteUtils.js";
import { SHOW_DEBUG } from "../utils/debug.js";

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
let manualQuestion = false;
let displayMode = null; // 'note' or 'color'
let isProcessingAnswer = false;
let isAnswerEnabled = true;
let chordPlayRequestId = 0;
const TRAINING_SESSION_KEY = "trainingSessionV1";

export const stats = {};
export const mistakes = {};
export const firstMistakeInSession = { flag: false, wrong: null };
export let lastResults = [];
export let correctCount = 0;

function clearTrainingSessionSnapshot() {
  sessionStorage.removeItem(TRAINING_SESSION_KEY);
}

function saveTrainingSessionSnapshot() {
  if (!currentUser?.id || !currentAnswer?.name) return;
  const payload = {
    userId: currentUser.id,
    questionCount,
    correctCount,
    currentAnswerName: currentAnswer.name,
    questionQueue,
    stats,
    mistakes,
    lastResults,
    selectedChords,
    alreadyTried,
    isForcedAnswer,
    singleNoteMode,
    singleNoteStrategy,
    chordSoundOn,
    manualQuestion,
    displayMode,
    savedAt: Date.now(),
  };
  sessionStorage.setItem(TRAINING_SESSION_KEY, JSON.stringify(payload));
}

function tryRestoreTrainingSessionSnapshot() {
  const raw = sessionStorage.getItem(TRAINING_SESSION_KEY);
  if (!raw || !currentUser?.id) return false;
  try {
    const data = JSON.parse(raw);
    if (data.userId !== currentUser.id) return false;

    questionCount = Number(data.questionCount || 0);
    correctCount = Number(data.correctCount || 0);
    questionQueue = Array.isArray(data.questionQueue) ? [...data.questionQueue] : [];
    alreadyTried = Boolean(data.alreadyTried);
    isForcedAnswer = Boolean(data.isForcedAnswer);
    singleNoteMode = Boolean(data.singleNoteMode);
    singleNoteStrategy = data.singleNoteStrategy || "top";
    chordSoundOn = data.chordSoundOn !== false;
    manualQuestion = Boolean(data.manualQuestion);
    displayMode = data.displayMode || displayMode;

    selectedChords.length = 0;
    if (Array.isArray(data.selectedChords)) {
      selectedChords.push(...data.selectedChords);
    }

    for (const key in stats) delete stats[key];
    Object.assign(stats, data.stats || {});
    for (const key in mistakes) delete mistakes[key];
    Object.assign(mistakes, data.mistakes || {});
    lastResults = Array.isArray(data.lastResults) ? data.lastResults : [];

    const answerName = data.currentAnswerName;
    currentAnswer = chords.find(c => c.name === answerName) || null;
    return Boolean(currentAnswer);
  } catch (e) {
    console.warn("セッション復元に失敗しました", e);
    return false;
  }
}

async function playSoundThen(name, callback) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  let completed = false;
  let fallbackTimer = null;
  const finish = () => {
    if (completed) return;
    completed = true;
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    callback();
  };

  const encoded = encodeURIComponent(name);
  currentAudio = getAudio(`audio/${encoded}.mp3`);
  currentAudio.onended = () => setTimeout(finish, 100);
  currentAudio.onerror = () => {
    console.error("⚠️ 音声ファイルが読み込めませんでした:", name);
    finish();
  };

  // Androidでまれにonendedが発火しないケースへの保険
  fallbackTimer = setTimeout(() => {
    console.warn("⚠️ onended未発火のためフォールバック遷移:", name);
    finish();
  }, 3000);

  try {
    const ok = await safePlayAudio(currentAudio, name);
    if (!ok) {
      // Playback failed so invoke callback to avoid freezing the UI
      finish();
    }
  } catch (_) {
    finish();
  }
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
  currentUser = user;
  singleNoteMode = localStorage.getItem("singleNoteMode") === "on";
  singleNoteStrategy = localStorage.getItem("singleNoteStrategy") || 'top';
  chordSoundOn = localStorage.getItem("chordSound") !== "off";
  manualQuestion = localStorage.getItem("manualQuestion") === "on";
  const flags = user.isTemp
    ? Object.fromEntries((user.unlockedKeys || []).map(k => [k, { unlocked: true }]))
    : await loadGrowthFlags(user.id);
  chordProgressCount = Object.values(flags).filter(f => f.unlocked).length;
  displayMode = localStorage.getItem("displayMode");
  if (!displayMode) {
    displayMode = chordProgressCount >= 10 ? "note" : "color";
  }
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

  if (selectedChords.length === 0) {
    const queue = generateRecommendedQueue(flags);

    const countMap = {};
    queue.forEach(name => {
      countMap[name] = (countMap[name] || 0) + 1;
    });

    const fallback = chords
      .filter(ch => countMap[ch.name])
      .map(ch => ({ name: ch.name, count: countMap[ch.name] }));

    selectedChords.push(...fallback);
    localStorage.setItem("selectedChords", JSON.stringify(fallback));
    questionQueue = queue.length ? [...queue] : createQuestionQueue();
  }
  questionCount = 0;
  quitFlag = false;
  alreadyTried = false;
  isForcedAnswer = false;
  firstMistakeInSession.flag = false;
  if (tryRestoreTrainingSessionSnapshot()) {
    drawQuizScreen();
    updateProgressUI();
    playChordFile(currentAnswer.file);
    return;
  }
  if (!questionQueue.length) {
    questionQueue = createQuestionQueue();
  }

  // 🎬 「はじめるよ」画面を先に表示し、和音ボタン表示後に音を鳴らす
  const firstChordName = questionQueue[questionQueue.length - 1];
  const firstChord = chords.find(c => c.name === firstChordName);
  if (firstChord) {
    unlockAudio(firstChord.file); // 事前に再生許可を取得
  }
  showFeedback("はじめるよ", "good", 0);
  setTimeout(() => {
    hideFeedback();
    nextQuestion(); // ✅ 出題開始！
  }, 600);
}

async function nextQuestion() {
  if (!currentUser || !currentUser.id) {
    console.error("❌ currentUser が null または id が未定義です");
    return;
  }
  
  alreadyTried = false;
  isForcedAnswer = false;
  isProcessingAnswer = false;
  isAnswerEnabled = false;
  if (questionQueue.length === 0 || quitFlag) {
    const sound = (correctCount === questionCount) ? "perfect" : "end";
    playSoundThen(sound, async () => {
      clearTrainingSessionSnapshot();
      if (!currentUser.isTemp) {
        await saveTrainingSession({
          userId: currentUser.id,
          results: { type: 'chord', results: lastResults },
          stats,
          mistakes,
          correctCount,
          totalCount: questionCount,
          date: new Date().toISOString(),
        });

        await updateTrainingRecord({
          userId: currentUser.id,
          correct: correctCount,
          total: questionCount
        });

        await incrementSetCount(currentUser.id);
        await autoUnlockNextChord(currentUser);
      }

      saveSessionToHistory();

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
  if (manualQuestion) {
    const correctBtn = document.querySelector(`.square-btn-content[data-name="${currentAnswer.name}"]`);
    if (correctBtn) {
      correctBtn.classList.add('correct-highlight');
    }
  }
  questionCount++;
  updateProgressUI();
  saveTrainingSessionSnapshot();

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
  container.style.maxWidth = "100%";
  container.style.overflow = "hidden";

  let feedback = document.getElementById("feedback");
  if (!feedback) {
    feedback = document.createElement("div");
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
  }
  feedback.style.display = "none";
  container.appendChild(feedback);

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

  const widthMap = {
    1: "240px",
    2: "320px",
    3: "360px",
    4: "480px",
    5: "500px",
  };

  const maxWidth = widthMap[cols];

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.width = "100%";
  header.style.maxWidth = maxWidth;
  header.style.margin = "1em auto 0.5em";
  header.style.boxSizing = "border-box";
  header.style.padding = "0 4px";

  const total = questionQueue.length + questionCount + 1;
  const progressWrapper = document.createElement("div");
  progressWrapper.className = "progress-wrapper";
  progressWrapper.style.flexGrow = "1";
  progressWrapper.style.position = "relative";
  progressWrapper.style.marginLeft = "0";

  const progress = document.createElement("progress");
  progress.id = "progress-bar";
  progress.value = questionCount;
  progress.max = total;
  progress.style.width = "100%";
  progress.style.height = "2em";
  progressWrapper.appendChild(progress);

  const counter = document.createElement("span");
  counter.id = "progress-counter";
  counter.textContent = `${questionCount} / ${total}`;
  counter.style.position = "absolute";
  counter.style.left = "50%";
  counter.style.top = "50%";
  counter.style.transform = "translate(-50%, -50%)";
  counter.style.fontSize = "0.9em";
  counter.style.fontWeight = "bold";
  counter.style.pointerEvents = "none";
  progressWrapper.appendChild(counter);

  header.appendChild(progressWrapper);



  const layout = document.createElement("div");
  layout.className = "grid-container";
  layout.style.display = "grid";
  layout.style.gap = "12px";
  layout.style.width = "100%";
  layout.style.margin = "0 auto";
  layout.classList.add(`cols-${cols}`);
  layout.style.maxWidth = maxWidth;

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
      let showNote = false;
      if (manualQuestion && only.italian) {
        inner.innerHTML = `<span class="color-label">${only.labelHtml}</span><span class="note-label">${only.italian.map(kanaToHiragana).join('')}</span>`;
        inner.classList.add('manual-mode');
        showNote = true;
      } else if (displayMode === "note" && only.italian) {
        inner.innerHTML = only.italian.map(kanaToHiragana).join("");
        showNote = true;
      } else {
        inner.innerHTML = only.labelHtml;
        if (only.type === "black-inv") showNote = true;
      }
      if (showNote) inner.classList.add("note-small");
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
      let noteFlag = false;
      if (manualQuestion && chord.italian) {
        inner.innerHTML = `<span class="color-label">${chord.labelHtml}</span><span class="note-label">${chord.italian.map(kanaToHiragana).join('')}</span>`;
        inner.classList.add('manual-mode');
        noteFlag = true;
      } else if (displayMode === "note" && chord.italian) {
        inner.innerHTML = chord.italian.map(kanaToHiragana).join("");
        noteFlag = true;
      } else {
        inner.innerHTML = chord.labelHtml;
        if (chord.type === "black-inv") noteFlag = true;
      }
      if (noteFlag) inner.classList.add("note-small");
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
      clearTrainingSessionSnapshot();
      switchScreen("home");
    });
  };

  let debugAnswer;
  if (SHOW_DEBUG) {
    debugAnswer = document.createElement("div");
    debugAnswer.textContent = `【デバッグ】正解: ${currentAnswer.label}（${currentAnswer.name}）`;
    debugAnswer.style.position = "absolute";
    debugAnswer.style.top = "10px";
    debugAnswer.style.right = "10px";
    debugAnswer.style.fontSize = "0.9em";
    debugAnswer.style.color = "gray";
  }

  const unknownBtn = document.createElement("button");
  unknownBtn.id = "unknownBtn";
  unknownBtn.textContent = "わからない";
  unknownBtn.onclick = () => {
    if (alreadyTried || isForcedAnswer || isProcessingAnswer || !isAnswerEnabled) return;
    isProcessingAnswer = true;

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
      isProcessingAnswer = false;
      playChordFile(currentAnswer.file);
    });
  };

  const bottomWrap = document.createElement("footer");
  bottomWrap.id = "training-footer";
  bottomWrap.appendChild(unknownBtn);
  bottomWrap.appendChild(quitBtn);

  if (debugAnswer) {
    container.appendChild(debugAnswer);
  }
  container.appendChild(header);
  container.appendChild(layout);
  app.appendChild(container);
  app.appendChild(bottomWrap);
}


async function playChordFile(filename) {
  const requestId = ++chordPlayRequestId;
  const unlockAnswers = () => {
    if (requestId !== chordPlayRequestId) return;
    isAnswerEnabled = true;
  };

  if (!chordSoundOn || manualQuestion) {
    unlockAnswers();
    return;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = getAudio(`audio/${filename}`);
  let fallbackUnlockTimer = null;
  const resetFallbackTimer = (ms = 4000) => {
    if (fallbackUnlockTimer) {
      clearTimeout(fallbackUnlockTimer);
    }
    fallbackUnlockTimer = setTimeout(() => {
      console.warn("⚠️ 再生終了待ちがタイムアウトしたため回答受付を再開:", filename);
      unlockAnswers();
    }, ms);
  };

  currentAudio.onerror = () => {
    console.error("音声ファイルが見つかりません:", filename);
    if (fallbackUnlockTimer) clearTimeout(fallbackUnlockTimer);
    unlockAnswers();
  };

  currentAudio.onended = () => {
    if (fallbackUnlockTimer) clearTimeout(fallbackUnlockTimer);
    unlockAnswers();
  };

  currentAudio.onloadedmetadata = () => {
    const durationSec = Number(currentAudio.duration);
    if (Number.isFinite(durationSec) && durationSec > 0) {
      const fallbackMs = Math.min(Math.max(Math.ceil(durationSec * 1000) + 250, 1500), 5000);
      resetFallbackTimer(fallbackMs);
    }
  };

  const ok = await safePlayAudio(currentAudio, filename, { timeoutMs: 1800 });
  if (ok) {
    resetFallbackTimer();
  }
  if (!ok) {
    if (fallbackUnlockTimer) clearTimeout(fallbackUnlockTimer);
    unlockAnswers();
  }
}

function unlockAudio(filename) {
  if (!chordSoundOn || manualQuestion) return;
  const audio = getAudio(`audio/${filename}`);
  audio.muted = true;
  safePlayAudio(audio, filename).then((ok) => {
    if (!ok) return;
    audio.pause();
    audio.muted = false;
    audio.currentTime = 0;
  });
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

async function playNoteFile(note, callback) {
  if (manualQuestion) {
    if (callback) setTimeout(callback, 0);
    return;
  }
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
  await safePlayAudio(currentAudio, note);
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
  return normalizeNoteName(note).replace(/[0-9]/g, '');
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
  const unknownBtn = document.getElementById('unknownBtn');
  const quitBtn = document.getElementById('quitBtn');
  if (layout) layout.style.display = 'none';

  let prevUnknownHandler = null;
  if (unknownBtn) {
    prevUnknownHandler = unknownBtn.onclick;
    unknownBtn.onclick = () => playNoteFile(note);
  }

  const overlay = document.createElement('div');
  overlay.id = 'single-note-overlay';
  overlay.style.textAlign = 'center';
  overlay.style.marginTop = '2em';
  container.appendChild(overlay);

  const feedback = document.getElementById('feedback');

  let displayWrap = null;
  if (!manualQuestion) {
    displayWrap = document.createElement('div');
    displayWrap.className = 'single-note-options';
    displayWrap.style.display = 'flex';
    displayWrap.style.justifyContent = 'center';
    displayWrap.style.gap = '12px';
    displayWrap.style.marginTop = '1em';
    overlay.appendChild(displayWrap);
  }

  const piano = document.createElement('div');
  piano.className = 'piano-container';
  const whiteWrap = document.createElement('div');
  whiteWrap.className = 'white-keys';
  piano.appendChild(whiteWrap);
  if (manualQuestion) {
    overlay.appendChild(piano);
  }

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
    const target = manualQuestion ? piano : displayWrap;
    if (!target) return;
    target.querySelectorAll('button').forEach(b => {
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
        question: note,
        answer: selection,
        correct,
        isSingleNote: true
      });
      recorded = true;
    }

    if (correct) {
      showFeedback('いいね', 'good');
      const voices = ['good1', 'good2'];
      playSoundThen(voices[Math.floor(Math.random() * voices.length)], () => {
        overlay.remove();
        if (!isLast) {
          if (layout) layout.style.display = '';
          if (quitBtn) quitBtn.style.display = '';
        }
        if (unknownBtn && prevUnknownHandler) {
          unknownBtn.onclick = prevUnknownHandler;
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

  if (!manualQuestion && displayWrap) {
    options.forEach(n => {
      const btn = document.createElement('button');
      btn.textContent = noteLabels[n] || n;
      btn.style.fontSize = '1.5em';
      btn.style.padding = '0.5em 1em';
      btn.onclick = () => handle(n);
      btn.disabled = true;
      displayWrap.appendChild(btn);
    });
  }

  const whiteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackOrder = [
    { note: 'C#', pos: 'pos1' },
    { note: 'D#', pos: 'pos2' },
    { note: 'F#', pos: 'pos3' },
    { note: 'G#', pos: 'pos4' },
    { note: 'A#', pos: 'pos5' }
  ];

  whiteOrder.forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'key-white';
    btn.dataset.note = n;
    btn.textContent = noteLabels[n];
    whiteWrap.appendChild(btn);
  });

  blackOrder.forEach(b => {
    const btn = document.createElement('button');
    btn.className = `key-black ${b.pos}`;
    btn.dataset.note = b.note;
    btn.textContent = noteLabels[b.note];
    piano.appendChild(btn);
  });

  if (manualQuestion) {
    piano.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      handle(btn.dataset.note);
    });
  }

  if (manualQuestion) {
    const key = piano.querySelector(`button[data-note="${pitch}"]`);
    if (key) key.classList.add('key-highlight');
  }

  setActive(false);
  playNoteFile(note, () => {
    setActive(true);
  });
}

let feedbackTimeoutId;
function showFeedback(message, type = "good", duration = 1000) {
  let fb = document.getElementById("feedback");
  if (!fb) {
    const app = document.getElementById("app");
    if (!app) return;
    fb = document.createElement("div");
    fb.id = "feedback";
    fb.style.position = "fixed";
    fb.style.top = "40%";
    fb.style.left = "0";
    fb.style.right = "0";
    fb.style.textAlign = "center";
    fb.style.fontSize = "3em";
    fb.style.fontWeight = "bold";
    fb.style.zIndex = "999";
    app.appendChild(fb);
  }

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

function hideFeedback() {
  if (feedbackTimeoutId) {
    clearTimeout(feedbackTimeoutId);
    feedbackTimeoutId = null;
  }
  const fb = document.getElementById("feedback");
  if (fb) fb.style.display = "none";
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
  if (isProcessingAnswer || !isAnswerEnabled) return;
  isProcessingAnswer = true;

  const name = currentAnswer.name;
  stats[name] = stats[name] || { correct: 0, wrong: 0, total: 0 };

  if (isForcedAnswer) {
    isForcedAnswer = false;
    isProcessingAnswer = false;
    saveTrainingSessionSnapshot();
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


    document.querySelectorAll(".square-btn-content").forEach(btn => {
      btn.style.pointerEvents = "none";
      btn.style.opacity = "0.4";
    });

    const proceed = () => {
      if (questionQueue.length === 0) {
        showFeedback("がんばったね", "good", 0);
      }
      isProcessingAnswer = false;
      nextQuestion();
    };

    const isLast = questionQueue.length === 0;
    if (isLast) {
      if (singleNoteMode) {
        showSingleNoteQuiz(currentAnswer, proceed, true);
      } else {
        proceed();
      }
      saveTrainingSessionSnapshot();
    } else {
      const voices = ["good1", "good2"];
      showFeedback("いいね", "good");
      playSoundThen(voices[Math.floor(Math.random() * voices.length)], () => {
        if (singleNoteMode) {
          showSingleNoteQuiz(currentAnswer, proceed, false);
        } else {
          proceed();
        }
      });
      saveTrainingSessionSnapshot();
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
    correctBtn.classList.add("correct-highlight");
  }

    showFeedback("もういちど", "bad");
    const soundKey = currentAnswer.soundKey || currentAnswer.colorClass;
    playSoundThen(`wrong_${soundKey}`, () => {
      isProcessingAnswer = false;
      playChordFile(currentAnswer.file);
    });
    saveTrainingSessionSnapshot();
  }
}

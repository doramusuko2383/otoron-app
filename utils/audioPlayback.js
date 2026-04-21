import { resetAudioCache } from "./audioCache.js";

let audioContext = null;
let audioContextSetupDone = false;
let playAttemptCount = 0;
const AUDIO_CONTEXT_RESET_INTERVAL = 10;

function getAudioContext() {
  if (audioContext) return audioContext;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioContext = new Ctx();
  return audioContext;
}

async function recreateAudioContext() {
  if (audioContext) {
    try {
      await audioContext.close();
    } catch (_) {}
    audioContext = null;
  }
  getAudioContext();
}

export async function resumeAudioContextIfNeeded() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
}

export function setupAudioResumeOnFirstTouch() {
  if (audioContextSetupDone) return;
  audioContextSetupDone = true;

  const handler = async () => {
    try {
      await resumeAudioContextIfNeeded();
    } catch (e) {
      console.warn("🎧 AudioContext resume エラー:", e);
    }
  };

  document.addEventListener("touchstart", handler, { passive: true });
  document.addEventListener("pointerdown", handler, { passive: true });
}

export async function safePlayAudio(audio, label = "") {
  playAttemptCount += 1;
  if (playAttemptCount % AUDIO_CONTEXT_RESET_INTERVAL === 0) {
    await recreateAudioContext();
    resetAudioCache();
  }

  await resumeAudioContextIfNeeded();
  try {
    await audio.play();
    return true;
  } catch (e) {
    console.warn(`🎧 audio.play() エラー: ${label}`, e);
    return false;
  }
}

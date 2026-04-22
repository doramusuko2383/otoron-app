import { getAudio } from "../utils/audioCache.js";

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

export function playNote(noteName) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(normalizeNoteName(noteName));
    const audio = getAudio(`sounds/${encoded}.mp3`);
    let settled = false;
    let watchdog = null;

    const finishOnce = () => {
      if (settled) return;
      settled = true;
      if (watchdog) clearTimeout(watchdog);
      resolve();
    };

    const handleEnded = () => {
      cleanup();
      finishOnce();
    };

    const handleError = () => {
      console.warn(`音声再生エラー: ${noteName}`);
      cleanup();
      finishOnce();
    };

    const cleanup = () => {
      // Remove listeners after playback to avoid leaks
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    (async () => {
      try {
        // Some mobile browsers occasionally never emit ended/error.
        watchdog = setTimeout(() => {
          cleanup();
          finishOnce();
        }, 2500);
        await audio.play();
      } catch (e) {
        console.warn(`音声再生エラー: ${noteName}`, e);
        handleError();
      }
    })();
  });
}

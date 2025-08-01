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

    const handleEnded = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      console.warn(`音声再生エラー: ${noteName}`);
      cleanup();
      resolve();
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
        await audio.play();
      } catch (e) {
        console.warn(`音声再生エラー: ${noteName}`, e);
        handleError();
      }
    })();
  });
}


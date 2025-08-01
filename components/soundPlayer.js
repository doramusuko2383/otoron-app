import { getAudio } from "../utils/audioCache.js";
const audioBasePath = "./sounds";

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

    const cleanup = () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };

    const onEnded = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      console.warn(`音声再生エラー: ${noteName}`);
      resolve();
    };

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    (async () => {
      try {
        await audio.play();
      } catch (e) {
        onError();
        console.warn(`音声再生エラー: ${noteName}`, e);
      }
      resolve();
    })();
  });
}


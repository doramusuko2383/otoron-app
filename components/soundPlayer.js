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
    const audio = new Audio(`sounds/${encoded}.mp3`);
    audio.addEventListener("ended", resolve);
    audio.addEventListener("error", () => {
      console.warn(`音声再生エラー: ${noteName}`);
      resolve();
    });
    audio.play().catch((e) => {
      console.warn(`音声再生エラー: ${noteName}`, e);
      resolve();
    });
  });
}


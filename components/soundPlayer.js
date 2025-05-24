const audioBasePath = "./sounds";

export function playNote(noteName) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(noteName);
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


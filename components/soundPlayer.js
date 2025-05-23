const audioBasePath = "./sounds";

export function playNote(noteName) {
  const encoded = encodeURIComponent(noteName);
  const audio = new Audio(`sounds/${encoded}.mp3`);
  audio.play().catch(e => {
    console.warn(`音声再生エラー: ${noteName}`, e);
  });
}


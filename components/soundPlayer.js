const audioBasePath = "./sounds";

export function playNote(noteName) {
  const encodedNote = encodeURIComponent(noteName); // ← ここが重要！
  const audio = new Audio(`${audioBasePath}/${encodedNote}.mp3`);
  audio.play();
}

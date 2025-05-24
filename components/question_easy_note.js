// components/question_easy_note.js

// 音域C3〜A5の34音
const availableNotes = [
  "C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3",
  "C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4",
  "C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5"
];

export function getRandomNoteSequence(count = 24) {
  const notes = [...availableNotes];
  for (let i = notes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [notes[i], notes[j]] = [notes[j], notes[i]];
  }
  return notes.slice(0, count);
}

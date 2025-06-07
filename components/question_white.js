// components/question_white.js

// White key notes from C3 to B5
const availableNotes = [
  "C3","D3","E3","F3","G3","A3","B3",
  "C4","D4","E4","F4","G4","A4","B4",
  "C5","D5","E5","F5","G5","A5","B5"
];

export function getRandomWhiteNoteSequence(count = 21) {
  const notes = [...availableNotes];
  for (let i = notes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [notes[i], notes[j]] = [notes[j], notes[i]];
  }
  if (count <= notes.length) {
    return notes.slice(0, count);
  }
  const result = [];
  let pool = [...notes];
  while (result.length < count) {
    if (pool.length === 0) {
      pool = [...availableNotes];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }
    result.push(pool.pop());
  }
  return result;
}

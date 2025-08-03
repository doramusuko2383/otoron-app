export const noteLabels = {
  "C": "ど",
  "D": "れ",
  "E": "み",
  "F": "ふぁ",
  "G": "そ",
  "A": "ら",
  "B": "し",
  "C#": "ちす", "Db": "ちす",
  "D#": "えす", "Eb": "えす",
  "F#": "ふぃす", "Gb": "ふぃす",
  "G#": "ぎす", "Ab": "ぎす",
  "A#": "べー", "Bb": "べー"
};

export function kanaToHiragana(str) {
  return str.replace(/[ァ-ン]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

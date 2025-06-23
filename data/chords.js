export const chords = [
  // 白鍵（基本形9和音・色つき）
  { name: "C-E-G", key: "aka", label: "赤", labelHiragana: "あか", labelHtml: "あか", file: "chord_01_aka_root.mp3", type: "white", colorClass: "aka", soundKey: "aka", notes: ["C4", "E4", "G4"], italian: ["ド", "ミ", "ソ"] },
  { name: "C-F-A", key: "kiiro", label: "黄色", labelHiragana: "きいろ", labelHtml: "きいろ", file: "chord_02_kiiro_root.mp3", type: "white", colorClass: "kiiro", soundKey: "kiiro", notes: ["C4", "F4", "A4"], italian: ["ド", "ファ", "ラ"] },
  { name: "B-D-G", key: "ao", label: "青", labelHiragana: "あお", labelHtml: "あお", file: "chord_03_ao_root.mp3", type: "white", colorClass: "ao", soundKey: "ao", notes: ["B3", "D4", "G4"], italian: ["シ", "レ", "ソ"] },
  { name: "A-C-F", key: "kuro", label: "黒", labelHiragana: "くろ", labelHtml: "くろ", file: "chord_04_kuro_root.mp3", type: "white", colorClass: "kuro", soundKey: "kuro", notes: ["A3", "C4", "F4"], italian: ["ラ", "ド", "ファ"] },
  { name: "D-G-B", key: "midori", label: "緑", labelHiragana: "みどり", labelHtml: "みどり", file: "chord_05_midori_root.mp3", type: "white", colorClass: "midori", soundKey: "midori", notes: ["D4", "G4", "B4"], italian: ["レ", "ソ", "シ"] },
  { name: "E-G-C", key: "orange", label: "オレンジ", labelHiragana: "おれんじ", labelHtml: "おれんじ", file: "chord_06_orange_root.mp3", type: "white", colorClass: "orange", soundKey: "orange", notes: ["E4", "G4", "C5"], italian: ["ミ", "ソ", "ド"] },
  { name: "F-A-C", key: "murasaki", label: "紫", labelHiragana: "むらさき", labelHtml: "むらさき", file: "chord_07_murasaki_root.mp3", type: "white", colorClass: "murasaki", soundKey: "murasaki", notes: ["F4", "A4", "C5"], italian: ["ファ", "ラ", "ド"] },
  { name: "G-B-D", key: "pink", label: "ピンク", labelHiragana: "ぴんく", labelHtml: "ぴんく", file: "chord_08_pink_root.mp3", type: "white", colorClass: "pink", soundKey: "pink", notes: ["G4", "B4", "D5"], italian: ["ソ", "シ", "レ"] },
  { name: "G-C-E", key: "chairo", label: "茶色", labelHiragana: "ちゃいろ", labelHtml: "ちゃいろ", file: "chord_09_chairo_root.mp3", type: "white", colorClass: "chairo", soundKey: "chairo", notes: ["G4", "C5", "E5"], italian: ["ソ", "ド", "ミ"] },

  // 黒鍵（基本形5和音・色つき）
  { name: "A-C#-E", key: "kimidori", label: "黄緑", labelHiragana: "きみどり", labelHtml: "きみどり", file: "chord_10_kimidori_root.mp3", type: "black-root", colorClass: "kimidori", soundKey: "kimidori", notes: ["A3", "C#4", "E4"], italian: ["ラ", "チス", "ミ"] },
  { name: "D-F#-A", key: "usudai", label: "薄橙", labelHiragana: "うすだいだい", labelHtml: "うす<br>だいだい", file: "chord_11_usudai_root.mp3", type: "black-root", colorClass: "usudai", soundKey: "usudai", notes: ["D4", "F#4", "A4"], italian: ["レ", "フィス", "ラ"] },
  { name: "E-G#-B", key: "fuji", label: "藤色", labelHiragana: "ふじいろ", labelHtml: "ふじいろ", file: "chord_12_fuji_root.mp3", type: "black-root", colorClass: "fuji", soundKey: "fuji", notes: ["E4", "G#4", "B4"], italian: ["ミ", "ギス", "シ"] },
  { name: "B♭-D-F", key: "hai", label: "灰色", labelHiragana: "はいいろ", labelHtml: "はいいろ", file: "chord_13_hai_root.mp3", type: "black-root", colorClass: "hai", soundKey: "hai", notes: ["B♭3", "D4", "F4"], italian: ["ベー", "レ", "ファ"] },
  { name: "E♭-G-B♭", key: "mizuiro", label: "水色", labelHiragana: "みずいろ", labelHtml: "みずいろ", file: "chord_14_mizuiro_root.mp3", type: "black-root", colorClass: "mizuiro", soundKey: "mizuiro", notes: ["E♭4", "G4", "B♭4"], italian: ["エス", "ソ", "ベー"] },

  // 黒鍵（転回系 白色表示）
  { name: "C#-E-A", key: "kimidori_1st", label: "チスミラ", labelHiragana: "ちすみら", labelHtml: "ちす<br>み<br>ら", file: "chord_10_kimidori_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "cismila", notes: ["C#4", "E4", "A4"] },
  { name: "E-A-C#", key: "kimidori_2nd", label: "ミラチス", labelHiragana: "みらちす", labelHtml: "み<br>ら<br>ちす", file: "chord_10_kimidori_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "milacis", notes: ["E4", "A4", "C#5"] },

  { name: "F#-A-D", key: "usudai_1st", label: "フィスラレ", labelHiragana: "ふぃすられ", labelHtml: "ふぃす<br>ら<br>れ", file: "chord_11_usudai_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "fisrare", notes: ["F#4", "A4", "D5"] },
  { name: "A-D-F#", key: "usudai_2nd", label: "ラレフィス", labelHiragana: "られふぃす", labelHtml: "ら<br>れ<br>ふぃす", file: "chord_11_usudai_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "larefis", notes: ["A3", "D4", "F#4"] },

  { name: "G#-B-E", key: "fuji_1st", label: "ギスシミ", labelHiragana: "ぎすしみ", labelHtml: "ぎす<br>し<br>み", file: "chord_12_fuji_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "gissemi", notes: ["G#4", "B4", "E5"] },
  { name: "B-E-G#", key: "fuji_2nd", label: "シミギス", labelHiragana: "しみぎす", labelHtml: "し<br>み<br>ぎす", file: "chord_12_fuji_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "semigis", notes: ["B3", "E4", "G#4"] },

  { name: "D-F-B♭", key: "hai_1st", label: "レファベー", labelHiragana: "れふぁべー", labelHtml: "れ<br>ふぁ<br>べー", file: "chord_13_hai_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "refabe", notes: ["D4", "F4", "B♭4"] },
  { name: "F-B♭-D", key: "hai_2nd", label: "ファベーレ", labelHiragana: "ふぁべーれ", labelHtml: "ふぁ<br>べー<br>れ", file: "chord_13_hai_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "fabere", notes: ["F4", "B♭4", "D5"] },

  { name: "G-B♭-E♭", key: "mizuiro_1st", label: "ソベーエス", labelHiragana: "そべーえす", labelHtml: "そ<br>べー<br>えす", file: "chord_14_mizuiro_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "sobees", notes: ["G4", "B♭4", "E♭5"] },
  { name: "B♭-E♭-G", key: "mizuiro_2nd", label: "ベーエスソ", labelHiragana: "べーえすそ", labelHtml: "べー<br>えす<br>そ", file: "chord_14_mizuiro_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "beesso", notes: ["B♭3", "E♭4", "G4"] }
];

// 和音解放の進行順序（色付きの14種）
export const chordOrder = [
  // 白鍵・黒鍵（基本形）
  "aka", "kiiro", "ao", "kuro", "midori", "orange", "murasaki", "pink", "chairo",
  "kimidori", "usudai", "fuji", "hai", "mizuiro",

  // 黒鍵転回系（記載順）
  "kimidori_1st", "kimidori_2nd",
  "usudai_1st", "usudai_2nd",
  "fuji_1st", "fuji_2nd",
  "hai_1st", "hai_2nd",
  "mizuiro_1st", "mizuiro_2nd"
];

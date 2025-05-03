export const chords = [
  // 白鍵（基本形9和音・色つき）
  { name: "C-E-G", label: "赤", labelHiragana: "あか", file: "chord_01_aka_root.mp3", type: "white", colorClass: "aka", soundKey: "aka" },
  { name: "C-F-A", label: "黄色", labelHiragana: "きいろ", file: "chord_02_kiiro_root.mp3", type: "white", colorClass: "kiiro", soundKey: "kiiro" },
  { name: "B-D-G", label: "青", labelHiragana: "あお", file: "chord_03_ao_root.mp3", type: "white", colorClass: "ao", soundKey: "ao" },
  { name: "A-C-F", label: "黒", labelHiragana: "くろ", file: "chord_04_kuro_root.mp3", type: "white", colorClass: "kuro", soundKey: "kuro" },
  { name: "D-G-B", label: "緑", labelHiragana: "みどり", file: "chord_05_midori_root.mp3", type: "white", colorClass: "midori", soundKey: "midori" },
  { name: "E-G-C", label: "オレンジ", labelHiragana: "おれんじ", file: "chord_06_orange_root.mp3", type: "white", colorClass: "orange", soundKey: "orange" },
  { name: "F-A-C", label: "紫", labelHiragana: "むらさき", file: "chord_07_murasaki_root.mp3", type: "white", colorClass: "murasaki", soundKey: "murasaki" },
  { name: "G-B-D", label: "ピンク", labelHiragana: "ぴんく", file: "chord_08_pink_root.mp3", type: "white", colorClass: "pink", soundKey: "pink" },
  { name: "G-C-E", label: "茶色", labelHiragana: "ちゃいろ", file: "chord_09_chairo_root.mp3", type: "white", colorClass: "chairo", soundKey: "chairo" },

  // 黒鍵（基本形5和音・色つき）
  { name: "A-C#-E", label: "黄緑", labelHiragana: "きみどり", file: "chord_10_kimidori_root.mp3", type: "black-root", colorClass: "kimidori", soundKey: "kimidori" },
  { name: "D-F#-A", label: "薄橙", labelHiragana: "うすだいだい", file: "chord_11_usudai_root.mp3", type: "black-root", colorClass: "usudai", soundKey: "usudai" },
  { name: "E-G#-B", label: "藤色", labelHiragana: "ふじいろ", file: "chord_12_fuji_root.mp3", type: "black-root", colorClass: "fuji", soundKey: "fuji" },
  { name: "B♭-D-F", label: "灰色", labelHiragana: "はいいろ", file: "chord_13_hai_root.mp3", type: "black-root", colorClass: "hai", soundKey: "hai" },
  { name: "E♭-G-B♭", label: "水色", labelHiragana: "みずいろ", file: "chord_14_mizuiro_root.mp3", type: "black-root", colorClass: "mizuiro", soundKey: "mizuiro" },

  // 黒鍵（転回系 各2種 × 5音 = 10和音・白色）
  { name: "C#-E-A", label: "チス ミ ラ", labelHiragana: "ちす み ら", file: "chord_10_kimidori_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "cismila" },
  { name: "E-A-C#", label: "ミ ラ チス", labelHiragana: "み ら ちす", file: "chord_10_kimidori_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "milacis" },

  { name: "F#-A-D", label: "フィス ラ レ", labelHiragana: "ふぃす ら れ", file: "chord_11_usudai_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "fisrare" },
  { name: "A-D-F#", label: "ラ レ フィス", labelHiragana: "ら れ ふぃす", file: "chord_11_usudai_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "larefis" },

  { name: "G#-B-E", label: "ギス シ ミ", labelHiragana: "ぎす し み", file: "chord_12_fuji_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "gissemi" },
  { name: "B-E-G#", label: "シ ミ ギス", labelHiragana: "し み ぎす", file: "chord_12_fuji_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "semigis" },

  { name: "D-F-B♭", label: "レ ファ ベー", labelHiragana: "れ ふぁ べー", file: "chord_13_hai_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "refabe" },
  { name: "F-B♭-D", label: "ファ ベー レ", labelHiragana: "ふぁ べー れ", file: "chord_13_hai_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "fabere" },

  { name: "G-B♭-E♭", label: "ソ ベー エス", labelHiragana: "そ べー えす", file: "chord_14_mizuiro_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "sobees" },
  { name: "B♭-E♭-G", label: "ベー エス ソ", labelHiragana: "べー えす そ", file: "chord_14_mizuiro_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "beesso" },
];

export const chords = [
  // 白鍵（基本形9和音・色つき）
  { name: "C-E-G", label: "赤", labelHiragana: "あか", labelHtml: "あか", file: "chord_01_aka_root.mp3", type: "white", colorClass: "aka", soundKey: "aka", italian: ["ド", "ミ", "ソ"] },
  { name: "C-F-A", label: "黄色", labelHiragana: "きいろ", labelHtml: "きいろ", file: "chord_02_kiiro_root.mp3", type: "white", colorClass: "kiiro", soundKey: "kiiro", italian: ["ド", "ファ", "ラ"] },
  { name: "B-D-G", label: "青", labelHiragana: "あお", labelHtml: "あお", file: "chord_03_ao_root.mp3", type: "white", colorClass: "ao", soundKey: "ao", italian: ["シ", "レ", "ソ"] },
  { name: "A-C-F", label: "黒", labelHiragana: "くろ", labelHtml: "くろ", file: "chord_04_kuro_root.mp3", type: "white", colorClass: "kuro", soundKey: "kuro", italian: ["ラ", "ド", "ファ"] },
  { name: "D-G-B", label: "緑", labelHiragana: "みどり", labelHtml: "みどり", file: "chord_05_midori_root.mp3", type: "white", colorClass: "midori", soundKey: "midori", italian: ["レ", "ソ", "シ"] },
  { name: "E-G-C", label: "オレンジ", labelHiragana: "おれんじ", labelHtml: "おれんじ", file: "chord_06_orange_root.mp3", type: "white", colorClass: "orange", soundKey: "orange", italian: ["ミ", "ソ", "ド"] },
  { name: "F-A-C", label: "紫", labelHiragana: "むらさき", labelHtml: "むらさき", file: "chord_07_murasaki_root.mp3", type: "white", colorClass: "murasaki", soundKey: "murasaki", italian: ["ファ", "ラ", "ド"] },
  { name: "G-B-D", label: "ピンク", labelHiragana: "ぴんく", labelHtml: "ぴんく", file: "chord_08_pink_root.mp3", type: "white", colorClass: "pink", soundKey: "pink", italian: ["ソ", "シ", "レ"] },
  { name: "G-C-E", label: "茶色", labelHiragana: "ちゃいろ", labelHtml: "ちゃいろ", file: "chord_09_chairo_root.mp3", type: "white", colorClass: "chairo", soundKey: "chairo", italian: ["ソ", "ド", "ミ"] },

  // 黒鍵（基本形5和音・色つき）
  { name: "A-C#-E", label: "黄緑", labelHiragana: "きみどり", labelHtml: "きみどり", file: "chord_10_kimidori_root.mp3", type: "black-root", colorClass: "kimidori", soundKey: "kimidori", italian: ["ラ", "チス", "ミ"] },
  { name: "D-F#-A", label: "薄橙", labelHiragana: "うすだいだい", labelHtml: "うす<br>だいだい", file: "chord_11_usudai_root.mp3", type: "black-root", colorClass: "usudai", soundKey: "usudai", italian: ["レ", "フィス", "ラ"] },
  { name: "E-G#-B", label: "藤色", labelHiragana: "ふじいろ", labelHtml: "ふじいろ", file: "chord_12_fuji_root.mp3", type: "black-root", colorClass: "fuji", soundKey: "fuji", italian: ["ミ", "ギス", "シ"] },
  { name: "B♭-D-F", label: "灰色", labelHiragana: "はいいろ", labelHtml: "はいいろ", file: "chord_13_hai_root.mp3", type: "black-root", colorClass: "hai", soundKey: "hai", italian: ["ベー", "レ", "ファ"] },
  { name: "E♭-G-B♭", label: "水色", labelHiragana: "みずいろ", labelHtml: "みずいろ", file: "chord_14_mizuiro_root.mp3", type: "black-root", colorClass: "mizuiro", soundKey: "mizuiro", italian: ["エス", "ソ", "ベー"] },

  // 黒鍵（転回系 各2種 × 5音 = 10和音・白色） ※こちらはすでにイタリア音名が `label` にあるため追加不要
  { name: "C#-E-A", label: "チス ミ ラ", labelHiragana: "ちす み ら", labelHtml: "ちす<br>み<br>ら", file: "chord_10_kimidori_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "cismila" },
  { name: "E-A-C#", label: "ミ ラ チス", labelHiragana: "み ら ちす", labelHtml: "み<br>ら<br>ちす", file: "chord_10_kimidori_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "milacis" },

  { name: "F#-A-D", label: "フィス ラ レ", labelHiragana: "ふぃす ら れ", labelHtml: "ふぃす<br>ら<br>れ", file: "chord_11_usudai_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "fisrare" },
  { name: "A-D-F#", label: "ラ レ フィス", labelHiragana: "ら れ ふぃす", labelHtml: "ら<br>れ<br>ふぃす", file: "chord_11_usudai_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "larefis" },

  { name: "G#-B-E", label: "ギス シ ミ", labelHiragana: "ぎす し み", labelHtml: "ぎす<br>し<br>み", file: "chord_12_fuji_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "gissemi" },
  { name: "B-E-G#", label: "シ ミ ギス", labelHiragana: "し み ぎす", labelHtml: "し<br>み<br>ぎす", file: "chord_12_fuji_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "semigis" },

  { name: "D-F-B♭", label: "レ ファ ベー", labelHiragana: "れ ふぁ べー", labelHtml: "れ<br>ふぁ<br>べー", file: "chord_13_hai_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "refabe" },
  { name: "F-B♭-D", label: "ファ ベー レ", labelHiragana: "ふぁ べー れ", labelHtml: "ふぁ<br>べー<br>れ", file: "chord_13_hai_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "fabere" },

  { name: "G-B♭-E♭", label: "ソ ベー エス", labelHiragana: "そ べー えす", labelHtml: "そ<br>べー<br>えす", file: "chord_14_mizuiro_1st.mp3", type: "black-inv", colorClass: "white", soundKey: "sobees" },
  { name: "B♭-E♭-G", label: "ベー エス ソ", labelHiragana: "べー えす そ", labelHtml: "べー<br>えす<br>そ", file: "chord_14_mizuiro_2nd.mp3", type: "black-inv", colorClass: "white", soundKey: "beesso" },
];

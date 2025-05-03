// 和音データ
const chords = [
  { name: "赤", notes: [261.63, 329.63, 392.00], colorClass: "red" },     // C
  { name: "黄色", notes: [261.63, 349.23, 440.00], colorClass: "yellow" }, // D
  { name: "青", notes: [246.94, 293.66, 392.00], colorClass: "blue" }     // E
];

let currentAnswer = null;

// 和音を鳴らす関数
function playChord(frequencies) {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  frequencies.forEach(freq => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 1.5);
  });
}

// ランダムで和音を選んで再生
document.getElementById("playChord").addEventListener("click", () => {
  const index = Math.floor(Math.random() * chords.length);
  currentAnswer = chords[index];
  playChord(currentAnswer.notes);
  document.getElementById("result").textContent = "";
});

// 色ボタン表示
function showButtons() {
  const container = document.getElementById("buttons");
  container.innerHTML = "";

  chords.forEach(chord => {
    const btn = document.createElement("button");
    btn.className = `color-btn ${chord.colorClass}`;
    btn.textContent = chord.name;
    btn.onclick = () => {
      if (chord.name === currentAnswer.name) {
        document.getElementById("result").textContent = "⭕ 正解！";
        document.getElementById("result").style.color = "green";
      } else {
        document.getElementById("result").textContent = "❌ おしいね！";
        document.getElementById("result").style.color = "gray";
      }
    };
    container.appendChild(btn);
  });
}

showButtons();

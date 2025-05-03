import { switchScreen } from "../main.js";
import { chords } from "../data/chords.js";

export let selectedChords = [];

export function renderSettingsScreen() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const container = document.createElement("div");
  container.className = "screen active";
  container.style.overflow = "hidden";

  // ヘッダー（タイトル＋合計＋ボタン）
  const headerBar = document.createElement("div");
  headerBar.className = "header-bar";

  const title = document.createElement("h2");
  title.textContent = "🎼 出題設定";
  title.style.margin = "0";

  const totalCountDisplay = document.createElement("div");
  totalCountDisplay.className = "total";
  totalCountDisplay.id = "total-count";
  totalCountDisplay.textContent = "累計出題回数: 0 回";

  const buttonBox = document.createElement("div");
  buttonBox.className = "header-buttons";

  const startBtn = document.createElement("button");
  startBtn.textContent = "🎵 トレーニングスタート！";
  startBtn.onclick = () => {
    updateSelection();
    if (selectedChords.length === 0) {
      alert("和音を選択してください");
      return;
    }
    localStorage.setItem("selectedChords", JSON.stringify(selectedChords));
    switchScreen("training");
  };

  const backBtn = document.createElement("button");
  backBtn.textContent = "🏠 ホームに戻る";
  backBtn.onclick = () => {
    updateSelection();
    if (selectedChords.length === 0) {
      alert("和音を選択してください");
      return;
    }
    localStorage.setItem("selectedChords", JSON.stringify(selectedChords));
    switchScreen("home");
  };

  const debugBtn = document.createElement("button");
  debugBtn.textContent = "🛠 全部選択 (4回)";
  debugBtn.onclick = () => {
    chords.forEach(chord => {
      const checkbox = document.getElementById(`chk-${chord.name}`);
      const input = checkbox?.parentElement?.querySelector("input[type='number']");
      if (checkbox && input) {
        checkbox.checked = true;
        input.disabled = false;
        input.value = "4";
      }
    });
    updateSelection();
  };

  buttonBox.appendChild(startBtn);
  buttonBox.appendChild(backBtn);
  buttonBox.appendChild(debugBtn);
  const bulkDropdown = document.createElement("select");
  bulkDropdown.id = "bulk-count";
  bulkDropdown.innerHTML = `
    <option value="">✔ 一括出題回数</option>
    <option value="1">1回ずつ</option>
    <option value="2">2回ずつ</option>
    <option value="3">3回ずつ</option>
    <option value="4">4回ずつ</option>
    <option value="5">5回ずつ</option>
  `;
  bulkDropdown.onchange = () => {
    const count = parseInt(bulkDropdown.value);
    if (!count) return;

    chords.forEach(chord => {
      const checkbox = document.getElementById(`chk-${chord.name}`);
      const input = checkbox?.parentElement?.querySelector("input[type='number']");
      if (checkbox && checkbox.checked && input) {
        input.value = count;
      }
    });
    updateSelection();
  };
  bulkDropdown.style.marginLeft = "1em";
  bulkDropdown.style.fontSize = "1em";
  bulkDropdown.style.padding = "4px 8px";

  buttonBox.appendChild(bulkDropdown);

  headerBar.appendChild(title);
  headerBar.appendChild(totalCountDisplay);
  headerBar.appendChild(buttonBox);
  container.appendChild(headerBar);

  // 和音設定エリア
  const chordSettings = document.createElement("div");
  chordSettings.id = "chord-settings";

  const whiteColumn = document.createElement("div");
  whiteColumn.className = "chord-column";
  const blackColumn = document.createElement("div");
  blackColumn.className = "chord-column";
  const invColumn = document.createElement("div");
  invColumn.className = "chord-column";

  const stored = localStorage.getItem("selectedChords");
  let storedSelection = stored ? JSON.parse(stored) : [{ name: "C-E-G", count: 4 }];
  selectedChords = [];

  chords.forEach(chord => {
    const div = document.createElement("div");
    div.className = `chord-setting ${chord.colorClass}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `chk-${chord.name}`;
    const storedItem = storedSelection.find(item => item.name === chord.name);
    checkbox.checked = !!storedItem;

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = chord.label;

    const countInput = document.createElement("input");
    countInput.type = "number";
    countInput.min = "0";
    countInput.value = storedItem ? storedItem.count : (checkbox.checked ? "4" : "0");
    countInput.disabled = !checkbox.checked;
    countInput.style.width = "48px";
    countInput.style.textAlign = "right";
    countInput.style.padding = "4px";
    countInput.style.fontSize = "1em";

    checkbox.addEventListener("change", () => {
      countInput.disabled = !checkbox.checked;
      if (checkbox.checked && countInput.value === "0") {
        countInput.value = "4";
      }
      updateSelection();
    });

    countInput.addEventListener("input", updateSelection);

    div.appendChild(checkbox);
    div.appendChild(label);
    div.appendChild(countInput);

    if (chord.type === "white") {
      whiteColumn.appendChild(div);
    } else if (chord.type === "black-root") {
      blackColumn.appendChild(div);
    } else if (chord.type === "black-inv") {
      invColumn.appendChild(div);
    }
  });

  chordSettings.appendChild(whiteColumn);
  chordSettings.appendChild(blackColumn);
  chordSettings.appendChild(invColumn);
  container.appendChild(chordSettings);
  app.appendChild(container);

  updateSelection();
}

function updateSelection() {
  const chordDivs = document.querySelectorAll(".chord-setting");
  selectedChords = [];

  chordDivs.forEach(div => {
    const checkbox = div.querySelector("input[type='checkbox']");
    const input = div.querySelector("input[type='number']");
    if (checkbox.checked) {
      const name = checkbox.id.replace("chk-", "");
      selectedChords.push({ name, count: parseInt(input.value) });
    }
  });

  const total = selectedChords.reduce((sum, c) => sum + c.count, 0);
  document.getElementById("total-count").textContent = `累計出題回数: ${total} 回`;
}

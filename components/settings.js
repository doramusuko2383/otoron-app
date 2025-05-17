import { chords } from "../data/chords.js";
import { renderHeader } from "./header.js";

export let selectedChords = [];

export function renderSettingsScreen() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  renderHeader(app, renderSettingsScreen);

  const container = document.createElement("div");
  container.className = "screen active";
  container.style.overflow = "hidden";

  // ✅ 横一列にまとめたヘッダー行（タイトル・出題数・ボタン）
  const headerBar = document.createElement("div");
  headerBar.className = "header-bar";

  const titleLine = document.createElement("div");
  titleLine.className = "header-title-line";
  titleLine.innerHTML = `🎼 <strong>出題設定</strong> <span id="total-count">累計出題回数: 0 回</span>`;

  const buttonGroup = document.createElement("div");
  buttonGroup.className = "header-button-group";

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

  const bulkDropdown = document.createElement("select");
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

  buttonGroup.appendChild(debugBtn);
  buttonGroup.appendChild(bulkDropdown);

  headerBar.appendChild(titleLine);
  headerBar.appendChild(buttonGroup);
  container.appendChild(headerBar);

  // ✅ 和音設定エリア
  const chordSettings = document.createElement("div");
  chordSettings.id = "chord-settings";

  const whiteColumn = document.createElement("div");
  whiteColumn.className = "chord-column";
  const blackColumn = document.createElement("div");
  blackColumn.className = "chord-column";
  const invColumn = document.createElement("div");
  invColumn.className = "chord-column-inv";

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

  const upperRow = document.createElement("div");
  upperRow.className = "chord-columns-row";
  upperRow.appendChild(whiteColumn);
  upperRow.appendChild(blackColumn);

  chordSettings.appendChild(upperRow);
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

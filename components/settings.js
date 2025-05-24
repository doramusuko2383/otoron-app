// components/settings.js

import { renderHeader } from "./header.js";
import { switchScreen } from "../main.js";
import { supabase } from "../utils/supabaseClient.js";
import { chords, chordOrder } from "../data/chords.js";
import { getRecommendedChordSet } from "../utils/growthUtils.js"; // ← 追加

export let selectedChords = [];

// ✅ Supabaseから解放済み和音のkeyを取得
async function fetchUnlockedChords(userId) {
  const { data, error } = await supabase
    .from("user_chord_progress")
    .select("chord_key, status")
    .eq("user_id", userId)
    .not("status", "eq", "locked");  // ← locked 以外（in_progressやunlocked）

  if (error) {
    console.error("❌ 和音進捗の取得に失敗:", error);
    return [];
  }

  return data.map(item => item.chord_key); // ["aka", "kiiro", ...]
}

// 🔽 settings.js のファイルの上部、他の関数定義の近くに追加
function saveToSessionStorage() {
  sessionStorage.setItem("trainingMode", "custom");
  sessionStorage.setItem("selectedChords", JSON.stringify(selectedChords));
}

function resetToRecommendedChords(unlockedKeys, user) {
  const flags = {};
  unlockedKeys.forEach(key => {
    flags[key] = { unlocked: true };
  });

  const recommendedKeys = getRecommendedChordSet(flags);

  const countMap = {};
  recommendedKeys.forEach(key => {
    countMap[key] = (countMap[key] || 0) + 1;
  });

  const recommended = chords
    .filter(ch => countMap[ch.key])
    .map(ch => ({
      name: ch.name,
      count: countMap[ch.key]
    }));

  sessionStorage.removeItem("trainingMode");
  sessionStorage.removeItem("selectedChords");
  localStorage.setItem("selectedChords", JSON.stringify(recommended));

  // 🔁 直接、受け取った user を使って再描画
  renderSettingsScreen(user);
}


export async function renderSettingsScreen(user) {
  const unlockedKeys = await fetchUnlockedChords(user.id); // ← 解放されたkey一覧
  const app = document.getElementById("app");
  app.innerHTML = "";

  renderHeader(app, () => renderSettingsScreen(user));

  const container = document.createElement("div");
  container.className = "screen active";
  container.style.overflow = "hidden";

  const headerBar = document.createElement("div");
  headerBar.className = "header-bar";

  const titleLine = document.createElement("div");
  titleLine.className = "header-title-line";
  titleLine.innerHTML = `🎼 <strong>出題設定</strong> <span id="total-count">累計出題回数: 0 回</span>`;

  const buttonGroup = document.createElement("div");
  const resetBtn = document.createElement("button");
resetBtn.textContent = "↩ 推奨出題に戻す";
resetBtn.onclick = () => {
  if (confirm("本当に推奨出題に戻しますか？")) {
    resetToRecommendedChords(unlockedKeys, user); // ← user を渡す！
  }
};
buttonGroup.appendChild(resetBtn);

  buttonGroup.className = "header-button-group";

  const debugBtn = document.createElement("button");
  debugBtn.textContent = "🛠 全部選択 (4回)";
  debugBtn.onclick = () => {
    chords.forEach(chord => {
      const isUnlocked = unlockedKeys.includes(chord.key);
      if (!isUnlocked) return;

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
      const isUnlocked = unlockedKeys.includes(chord.key);
      if (!isUnlocked) return;

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

  const singleWrap = document.createElement('label');
  singleWrap.style.display = 'flex';
  singleWrap.style.alignItems = 'center';
  singleWrap.style.gap = '4px';
  singleWrap.style.margin = '0.5em 1em';
  const singleToggle = document.createElement('input');
  singleToggle.type = 'checkbox';
  singleToggle.checked = localStorage.getItem('singleNoteMode') === 'on';
  singleToggle.onchange = () => {
    if (singleToggle.checked) {
      localStorage.setItem('singleNoteMode', 'on');
    } else {
      localStorage.removeItem('singleNoteMode');
    }
  };
  singleWrap.appendChild(singleToggle);
  singleWrap.appendChild(document.createTextNode('単音分化モード'));
  container.appendChild(singleWrap);

  const chordSettings = document.createElement("div");
  chordSettings.id = "chord-settings";

  const whiteColumn = document.createElement("div");
  whiteColumn.className = "chord-column";
  const blackColumn = document.createElement("div");
  blackColumn.className = "chord-column";
  const invColumn = document.createElement("div");
  invColumn.className = "chord-column-inv";

  const trainingMode = sessionStorage.getItem("trainingMode");
  const stored = (trainingMode === "custom")
    ? sessionStorage.getItem("selectedChords")
    : localStorage.getItem("selectedChords");
  
  let storedSelection = stored ? JSON.parse(stored) : [];
  
  selectedChords = [];

  chords.forEach(chord => {
    const isUnlocked = unlockedKeys.includes(chord.key);
    const div = document.createElement("div");
    div.className = `chord-setting`;

    if (!isUnlocked) {
      div.style.opacity = "0.5";
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `chk-${chord.name}`;
    checkbox.disabled = !isUnlocked;

    const storedItem = storedSelection.find(item => item.name === chord.name);
    checkbox.checked = !!storedItem && isUnlocked;

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = chord.label;

    const countInput = document.createElement("input");
    countInput.type = "number";
    countInput.min = "0";
    countInput.value = storedItem ? storedItem.count : (checkbox.checked ? "4" : "0");
    countInput.disabled = !checkbox.checked || !isUnlocked;
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

  // ✅ その他のトレーニングセクション
  const section = document.createElement("div");
  section.innerHTML = `
    <h3>その他のトレーニング</h3>
    <ul>
      <li><button id="btn-easy">単音音あて（簡易モード）</button></li>
      <li><button id="btn-full">単音音あて（本気モード）</button></li>
    </ul>
  `;
  app.appendChild(section);

  document.getElementById("btn-easy").onclick = () => switchScreen("training_easy");
  document.getElementById("btn-full").onclick = () => switchScreen("training_full");

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
  // ✅ セッションに「カスタム設定中」であることを記録
  sessionStorage.setItem("trainingMode", "custom");
  sessionStorage.setItem("selectedChords", JSON.stringify(selectedChords));
  localStorage.setItem("selectedChords", JSON.stringify(selectedChords));
}

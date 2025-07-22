// components/settings.js

import { renderHeader } from "./header.js";
import { switchScreen, openHelp } from "../main.js";
import { openPresetModal } from "./presetModal.js";
import { supabase } from "../utils/supabaseClient.js";
import { chords, chordOrder } from "../data/chords.js";
import { generateRecommendedQueue } from "../utils/growthUtils.js"; // use queue util
import { showCustomConfirm, showCustomAlert } from "./home.js";

export let selectedChords = [];
export let lastUnlockedKeys = [];

// ✅ Supabaseから解放済み和音のkeyを取得
async function fetchUnlockedChords(user) {
  if (user.isTemp) {
    return user.unlockedKeys || [];
  }
  const { data, error } = await supabase
    .from("user_chord_progress")
    .select("chord_key, status")
    .eq("user_id", user.id)
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

  const queue = generateRecommendedQueue(flags);

  const countMap = {};
  queue.forEach(name => {
    countMap[name] = (countMap[name] || 0) + 1;
  });

  const recommended = chords
    .filter(ch => countMap[ch.name])
    .map(ch => ({
      name: ch.name,
      count: countMap[ch.name]
    }));

  sessionStorage.removeItem("trainingMode");
  sessionStorage.removeItem("selectedChords");
  localStorage.setItem("selectedChords", JSON.stringify(recommended));

  // 🔁 直接、受け取った user を使って再描画
  renderSettingsScreen(user);
}


export async function renderSettingsScreen(user) {
  const unlockedKeys = await fetchUnlockedChords(user); // ← 解放されたkey一覧
  lastUnlockedKeys = unlockedKeys;
  const app = document.getElementById("app");
  app.innerHTML = "";

  renderHeader(app, user);

  const container = document.createElement("div");
  container.className = "screen active settings-screen";
  // 画面全体をスクロールできるようにする

  const headerBar = document.createElement("div");
  headerBar.className = "header-bar";

  const titleLine = document.createElement("div");
  titleLine.className = "header-title-line";
  titleLine.innerHTML = `🎼 <strong>出題設定</strong>`;

  const helpBtn = document.createElement("div");
  helpBtn.className = "help-button";
  helpBtn.innerHTML = '<img src="images/icon_help.webp" alt="ヘルプ" />';
  helpBtn.onclick = () => openHelp("設定画面");
  titleLine.appendChild(helpBtn);

  const totalSpan = document.createElement("span");
  totalSpan.id = "total-count";
  totalSpan.textContent = "累計出題回数: 0 回";
  titleLine.appendChild(totalSpan);

  const resetBtn = document.createElement("button");
  resetBtn.className = "shadow-button";
  resetBtn.innerHTML = "✅ 推奨出題";
  resetBtn.onclick = () => {
    showCustomConfirm("本当に推奨出題にしますか？", () => {
      resetToRecommendedChords(unlockedKeys, user); // ← user を渡す！
    });
  };

  const bulkDropdown = document.createElement("select");
  bulkDropdown.innerHTML = `
    <option value="">一括出題回数変更</option>
    <option value="1">1回ずつ</option>
    <option value="2">2回ずつ</option>
    <option value="3">3回ずつ</option>
    <option value="4">4回ずつ</option>
    <option value="5">5回ずつ</option>
  `;
  bulkDropdown.onchange = () => {
    const count = parseInt(bulkDropdown.value);
    if (!count) return;
    document.querySelectorAll('.chord-block').forEach(block => {
      if (block.classList.contains('locked')) return;
      block.querySelector('.count-number').textContent = String(count);
      const cb = block.querySelector('.chord-toggle');
      if (cb) cb.checked = true;
      block.classList.add('selected');
      block.querySelectorAll('button').forEach(b => b.disabled = false);
    });
    updateSelection();
  };

  const singleWrap = document.createElement('label');
  singleWrap.className = 'toggle-wrap';

  const singleToggle = document.createElement('input');
  singleToggle.type = 'checkbox';
  singleToggle.className = 'toggle-input';
  singleToggle.checked = localStorage.getItem('singleNoteMode') === 'on';
  singleToggle.onchange = () => {
    if (singleToggle.checked) {
      showCustomConfirm(
        '白鍵全ての絶対音感が身に着いたあとで使ってください',
        () => {
          localStorage.setItem('singleNoteMode', 'on');
        },
        { okText: 'はい', showCancel: false }
      );
    } else {
      localStorage.removeItem('singleNoteMode');
    }
  };

  const slider = document.createElement('span');
  slider.className = 'toggle-slider';

  singleWrap.appendChild(singleToggle);
  singleWrap.appendChild(slider);
  const singleLabel = document.createElement('span');
  singleLabel.className = 'toggle-label';
  singleLabel.innerHTML = '単音分化機能';
  singleWrap.appendChild(singleLabel);

  const singleSelectWrap = document.createElement('div');
  singleSelectWrap.className = 'single-note-select-wrap';
  const singleSelectLabel = document.createElement('span');
  singleSelectLabel.textContent = '出題音';
  const singleSelect = document.createElement('select');
  singleSelect.innerHTML = `
    <option value="random">ランダム</option>
    <option value="top">最上音のみ</option>
  `;
  singleSelect.value = localStorage.getItem('singleNoteStrategy') || 'top';
  singleSelect.onchange = () => {
    localStorage.setItem('singleNoteStrategy', singleSelect.value);
  };
  singleSelectWrap.appendChild(singleSelectLabel);
  singleSelectWrap.appendChild(singleSelect);

  const controlBar = document.createElement('div');
  controlBar.className = 'settings-controls';
  controlBar.appendChild(titleLine);

  const cardRow = document.createElement('div');
  cardRow.className = 'settings-card-row';

  const singleCard = document.createElement('div');
  singleCard.className = 'settings-card single-card';
  singleCard.appendChild(singleWrap);
  singleCard.appendChild(singleSelectWrap);
  cardRow.appendChild(singleCard);

  const bulkCard = document.createElement('div');
  bulkCard.className = 'settings-card bulk-card';
  bulkCard.appendChild(resetBtn);
  bulkCard.appendChild(bulkDropdown);
  cardRow.appendChild(bulkCard);

  const manualCard = document.createElement('div');
  manualCard.className = 'settings-card manual-card';
  const manualLabel = document.createElement('div');
  manualLabel.textContent = '出題モード';
  const manualHelp = document.createElement('div');
  manualHelp.className = 'help-button';
  manualHelp.innerHTML = '<img src="images/icon_help.webp" alt="ヘルプ" />';
  manualHelp.onclick = () => openHelp('出題モード');
  manualLabel.appendChild(manualHelp);
  const manualWrap = document.createElement('div');
  manualWrap.className = 'display-mode-toggle';
  const autoBtn = document.createElement('button');
  autoBtn.textContent = '自動';
  const manualBtn = document.createElement('button');
  manualBtn.textContent = '手動';

  function updateManualButtons() {
    const isManual = localStorage.getItem('manualQuestion') === 'on';
    if (isManual) {
      manualBtn.classList.add('active');
      autoBtn.classList.remove('active');
    } else {
      autoBtn.classList.add('active');
      manualBtn.classList.remove('active');
    }
  }

  updateManualButtons();
  autoBtn.onclick = () => {
    localStorage.removeItem('manualQuestion');
    updateManualButtons();
  };
  manualBtn.onclick = () => {
    localStorage.setItem('manualQuestion', 'on');
    updateManualButtons();
  };

  manualWrap.appendChild(autoBtn);
  manualWrap.appendChild(manualBtn);
  manualCard.appendChild(manualLabel);
  manualCard.appendChild(manualWrap);
  cardRow.appendChild(manualCard);

  const modeCard = document.createElement('div');
  modeCard.className = 'settings-card mode-card';
  const modeLabel = document.createElement('div');
  modeLabel.textContent = '表示モード';
  const modeWrap = document.createElement('div');
  modeWrap.className = 'display-mode-toggle';
  const noteBtn = document.createElement('button');
  noteBtn.textContent = '音名';
  const colorBtn = document.createElement('button');
  colorBtn.textContent = '色名';
  function updateModeButtons(mode) {
    if (mode === 'note') {
      noteBtn.classList.add('active');
      colorBtn.classList.remove('active');
    } else {
      noteBtn.classList.remove('active');
      colorBtn.classList.add('active');
    }
  }
  let savedMode = localStorage.getItem('displayMode');
  if (!savedMode) {
    savedMode = unlockedKeys.length >= 10 ? 'note' : 'color';
  }
  updateModeButtons(savedMode);
  noteBtn.onclick = () => {
    localStorage.setItem('displayMode', 'note');
    updateModeButtons('note');
  };
  colorBtn.onclick = () => {
    localStorage.setItem('displayMode', 'color');
    updateModeButtons('color');
  };
  modeWrap.appendChild(noteBtn);
  modeWrap.appendChild(colorBtn);
  modeCard.appendChild(modeLabel);
  modeCard.appendChild(modeWrap);
  cardRow.appendChild(modeCard);

  const presetCard = document.createElement('div');
  presetCard.className = 'settings-card preset-card';
  const presetWrap = document.createElement('div');
  presetWrap.className = 'preset-wrap';
  const presetBtn = document.createElement('button');
  presetBtn.textContent = 'かんたん設定切り替え';
  presetBtn.onclick = () => openPresetModal(lastUnlockedKeys);
  presetWrap.appendChild(presetBtn);
  presetCard.appendChild(presetWrap);
  cardRow.appendChild(presetCard);

  controlBar.appendChild(cardRow);

  headerBar.appendChild(controlBar);
  container.appendChild(headerBar);

  const mainSection = document.createElement("div");
  mainSection.className = "main-section";
  
  const trainingMode = sessionStorage.getItem("trainingMode");
  const stored = (trainingMode === "custom")
    ? sessionStorage.getItem("selectedChords")
    : localStorage.getItem("selectedChords");

  let storedSelection = stored ? JSON.parse(stored) : [];

  selectedChords = [];

  const hasBlack = unlockedKeys.some(k => chords.find(c => c.key === k && c.type === "black-root"));
  const hasInv = unlockedKeys.some(k => chords.find(c => c.key === k && c.type === "black-inv"));

  const groups = [
    { title: "白鍵の和音", type: "white", open: true },
    { title: "黒鍵の和音", type: "black-root", open: hasBlack },
    { title: "黒鍵の和音の転回形", type: "black-inv", open: hasInv }
  ];

  groups.forEach(g => {
    const sec = document.createElement("section");
    sec.className = "chord-group";
    if (!g.open) sec.classList.add("collapsed");
    const h2 = document.createElement("h2");
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "group-toggle-btn";
    toggleBtn.textContent = g.open ? "－" : "＋";
    toggleBtn.onclick = () => {
      const willOpen = sec.classList.contains("collapsed");
      sec.classList.toggle("collapsed");
      toggleBtn.textContent = willOpen ? "－" : "＋";
    };
    h2.appendChild(toggleBtn);
    h2.appendChild(document.createTextNode(g.title));
    sec.appendChild(h2);

    const grid = document.createElement("div");
    grid.className = "chord-grid";

    chords.filter(c => c.type === g.type).forEach(chord => {
      const isUnlocked = unlockedKeys.includes(chord.key);
      const block = document.createElement("div");
      block.className = "chord-block";
      block.dataset.name = chord.name;
      if (!isUnlocked) block.classList.add("locked");

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'chord-toggle';
      checkbox.disabled = !isUnlocked;

      const nameDiv = document.createElement("div");
      nameDiv.className = `chord-name ${chord.colorClass}`;
      nameDiv.textContent = chord.label;

      const ctrl = document.createElement("div");
      ctrl.className = "count-control";
      const minusBtn = document.createElement("button");
      minusBtn.textContent = "-";
      const numSpan = document.createElement("span");
      numSpan.className = "count-number";
      const storedItem = storedSelection.find(item => item.name === chord.name);
      numSpan.textContent = storedItem ? storedItem.count : 0;
      const plusBtn = document.createElement("button");
      plusBtn.textContent = "+";

      function change(delta) {
        let val = parseInt(numSpan.textContent) || 0;
        val += delta;
        if (val < 0) val = 0;
        if (val > 20) val = 20; // allow manual counts up to 20
        numSpan.textContent = val;
        updateSelection();
      }

      minusBtn.onclick = () => change(-1);
      plusBtn.onclick = () => change(1);

      const checked = storedItem && storedItem.count > 0;
      checkbox.checked = checked;
      if (checked) block.classList.add('selected');

      function setEnabled(en) {
        minusBtn.disabled = !en;
        plusBtn.disabled = !en;
      }

      setEnabled(checked && isUnlocked);

      checkbox.addEventListener('change', () => {
        if (!checkbox.checked) {
          const others = document.querySelectorAll('.chord-toggle:checked');
          if (others.length === 0) {
            checkbox.checked = true;
            return;
          }
        }

        const en = checkbox.checked;
        if (en && parseInt(numSpan.textContent) === 0) {
          numSpan.textContent = '4';
        }
        if (!en) {
          numSpan.textContent = '0';
        }
        block.classList.toggle('selected', en);
        setEnabled(en && isUnlocked);
        updateSelection();
      });

      // ブロック全体をクリックして ON/OFF できるようにする
      block.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        if (checkbox.disabled) return;
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      });

      if (!isUnlocked) {
        setEnabled(false);
      }

      ctrl.appendChild(minusBtn);
      ctrl.appendChild(numSpan);
      ctrl.appendChild(plusBtn);

      const checkboxRow = document.createElement('div');
      checkboxRow.className = 'checkbox-row';
      checkboxRow.appendChild(checkbox);

      block.appendChild(checkboxRow);
      block.appendChild(nameDiv);
      block.appendChild(ctrl);
      grid.appendChild(block);
    });

    sec.appendChild(grid);
    const wrapper = document.createElement("div");
    if (g.type === "white") wrapper.className = "white-key-section";
    else if (g.type === "black-root") wrapper.className = "black-key-section";
    else wrapper.className = "inversion-section";
    wrapper.appendChild(sec);
    mainSection.appendChild(wrapper);
  });

  // ✅ その他のトレーニングセクション
  const section = document.createElement("div");
  section.className = "other-training";
  section.innerHTML = `
    <h3>その他のトレーニング</h3>
    <ul>
      <li><button id="btn-white">単音テスト（白鍵のみ）</button></li>
      <li><button id="btn-easy">単音テスト（3オクターブ）</button></li>
      <li><button id="btn-full">単音テスト（全88鍵）</button></li>
    </ul>
  `;

  mainSection.appendChild(section);
  container.appendChild(mainSection);
  app.appendChild(container);

  document.getElementById("btn-easy").onclick = () => switchScreen("training_easy");
  document.getElementById("btn-full").onclick = () => switchScreen("training_full");
  document.getElementById("btn-white").onclick = () => switchScreen("training_white");

  updateSelection();
}

function updateSelection() {
  const blocks = document.querySelectorAll(".chord-block");
  selectedChords = [];

  blocks.forEach(block => {
    const count = parseInt(block.querySelector('.count-number').textContent);
    const name = block.dataset.name;
    const checked = block.querySelector('.chord-toggle')?.checked;
    if (checked && count > 0 && !block.classList.contains('locked')) {
      selectedChords.push({ name, count });
    }
    block.classList.toggle('selected', checked);
  });

  const total = selectedChords.reduce((sum, c) => sum + c.count, 0);
  document.getElementById("total-count").textContent = `累計出題回数: ${total} 回`;
  // ✅ セッションに「カスタム設定中」であることを記録
  sessionStorage.setItem("trainingMode", "custom");
  sessionStorage.setItem("selectedChords", JSON.stringify(selectedChords));
  localStorage.setItem("selectedChords", JSON.stringify(selectedChords));
}

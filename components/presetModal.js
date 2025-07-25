import { showCustomAlert } from './home.js';
import { openHelp } from '../main.js';

export function openPresetModal(currentUnlocked) {
  let modal = document.getElementById('preset-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'preset-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-box">
        <h3 class="modal-title">
          出題設定の保存・読み込み
          <button id="preset-help-btn" class="help-button"><img src="images/icon_help.webp" alt="ヘルプ" /></button>
        </h3>
        <div class="preset-save">
          <input type="text" id="preset-name-input" placeholder="プリセット名" maxlength="16" />
          <button id="preset-save-btn">保存</button>
        </div>
        <div id="preset-list" class="preset-list"></div>
        <div class="modal-buttons">
          <button id="preset-close-btn">キャンセル</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  const nameInput = modal.querySelector('#preset-name-input');
  const saveBtn = modal.querySelector('#preset-save-btn');
  const listDiv = modal.querySelector('#preset-list');
  const closeBtn = modal.querySelector('#preset-close-btn');
  const helpBtn = modal.querySelector('#preset-help-btn');
  if (helpBtn) helpBtn.onclick = () => openHelp('かんたん設定切り替え');

  const loadPresets = () => JSON.parse(localStorage.getItem('settingPresets') || '[]');
  const savePresets = (data) => localStorage.setItem('settingPresets', JSON.stringify(data));

  function renderList() {
    const presets = loadPresets();
    listDiv.innerHTML = '';
    presets.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'preset-item';
      const span = document.createElement('span');
      span.textContent = p.name;
      const loadBtn = document.createElement('button');
      loadBtn.textContent = '読み込み';
      loadBtn.onclick = () => {
        sessionStorage.setItem('trainingMode', 'custom');
        sessionStorage.setItem('selectedChords', JSON.stringify(p.selectedChords));
        const base = window.getBaseUser?.() || {};
        const tempUser = {
          id: 'temp',
          name: p.name,
          isTemp: true,
          unlockedKeys: p.unlockedKeys,
          is_premium: base.is_premium,
          trial_active: base.trial_active,
          trial_end_date: base.trial_end_date,
        };
        window.setTempUser(tempUser);
        modal.classList.add('hidden');
        window.switchScreen('settings', tempUser);
      };
      const delBtn = document.createElement('button');
      delBtn.textContent = '削除';
      delBtn.onclick = () => {
        const list = loadPresets();
        list.splice(i, 1);
        savePresets(list);
        renderList();
      };
      row.appendChild(span);
      row.appendChild(loadBtn);
      row.appendChild(delBtn);
      listDiv.appendChild(row);
    });
  }

  saveBtn.onclick = () => {
    const name = nameInput.value.trim();
    if (!name) {
      showCustomAlert('プリセット名を入力してください');
      return;
    }
    if (name.length > 16) {
      showCustomAlert('プリセット名は16文字以内で入力してください');
      return;
    }
    const presets = loadPresets();
    if (presets.length >= 10) {
      showCustomAlert('最大10件まで保存できます');
      return;
    }
    const stored = sessionStorage.getItem('selectedChords') || localStorage.getItem('selectedChords');
    const selected = stored ? JSON.parse(stored) : [];
    presets.push({ name, selectedChords: selected, unlockedKeys: currentUnlocked || [] });
    savePresets(presets);
    nameInput.value = '';
    renderList();
  };

  const outsideHandler = (e) => {
    if (e.target === modal) {
      closeModal();
    }
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    modal.removeEventListener('click', outsideHandler);
  };

  closeBtn.onclick = closeModal;
  modal.addEventListener('click', outsideHandler);

  renderList();
  modal.classList.remove('hidden');
}

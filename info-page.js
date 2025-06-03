import { getTimeOfDay } from './utils/timeOfDay.js';

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add(getTimeOfDay());

  const parentBtn = document.getElementById('parent-menu-btn');
  const parentDropdown = document.getElementById('parent-dropdown');
  const infoBtn = document.getElementById('info-menu-btn');
  const infoDropdown = document.getElementById('info-dropdown');

  if (parentBtn && parentDropdown) {
    parentBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      parentDropdown.classList.toggle('show');
    });
  }

  if (infoBtn && infoDropdown) {
    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      infoDropdown.classList.toggle('show');
    });
  }

  document.addEventListener('click', (e) => {
    if (parentDropdown && !parentDropdown.contains(e.target) && e.target !== parentBtn) {
      parentDropdown.classList.remove('show');
    }
    if (infoDropdown && !infoDropdown.contains(e.target) && e.target !== infoBtn) {
      infoDropdown.classList.remove('show');
    }
  });
});

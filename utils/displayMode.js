export function getDisplayMode(unlockedCount = 0) {
  const stored = localStorage.getItem('displayMode');
  if (stored === 'note' || stored === 'color') return stored;
  return unlockedCount >= 10 ? 'note' : 'color';
}

export function setDisplayMode(mode) {
  if (mode === 'note' || mode === 'color') {
    localStorage.setItem('displayMode', mode);
  } else {
    localStorage.removeItem('displayMode');
  }
}


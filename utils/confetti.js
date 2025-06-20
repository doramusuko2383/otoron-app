export function launchConfetti(count = 30) {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
    piece.style.animationDelay = (Math.random() * 0.3).toFixed(2) + 's';
    piece.style.animationDuration = (1 + Math.random() * 0.5).toFixed(2) + 's';
    container.appendChild(piece);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 2000);
}

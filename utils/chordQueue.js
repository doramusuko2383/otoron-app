// utils/chordQueue.js

/**
 * Generate a shuffled queue of chords based on user selected list.
 * Each chord will appear an appropriate number of times depending
 * on how many chords are provided. The queue is simply shuffled and
 * may contain the same chord consecutively.
 *
 * @param {string[]} chordNames - array of chord name strings
 * @returns {string[]} shuffled queue
 */
export function generateChordQueue(chordNames) {
  if (!Array.isArray(chordNames) || chordNames.length === 0) {
    return [];
  }

  const counts = getCounts(chordNames.length);
  const queue = [];

  for (let i = 0; i < chordNames.length; i++) {
    for (let j = 0; j < counts[i]; j++) {
      queue.push(chordNames[i]);
    }
  }

  shuffle(queue);
  return queue;
}

function getCounts(n) {
  const counts = [];
  if (n === 1) {
    counts.push(20);
  } else if (n === 2) {
    counts.push(10, 10);
  } else if (n === 3) {
    counts.push(7, 7, 7);
  } else if (n === 4) {
    for (let i = 0; i < n; i++) counts.push(6);
  } else if (n === 5) {
    for (let i = 0; i < n; i++) counts.push(5);
  } else if (n === 6) {
    for (let i = 0; i < n; i++) counts.push(5);
  } else if (n >= 7 && n <= 14) {
    for (let i = 0; i < n; i++) counts.push(4);
  } else if (n >= 15 && n <= 19) {
    for (let i = 0; i < n; i++) counts.push(3);
  } else if (n >= 20 && n <= 24) {
    for (let i = 0; i < n; i++) counts.push(i < 14 ? 2 : 3);
  } else {
    for (let i = 0; i < n; i++) counts.push(2);
  }
  return counts;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

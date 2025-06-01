export function getTimeOfDay() {
  const hour = new Date().getHours();
  // console.log('[timeOfDay] current hour:', hour);

  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'noon';
  if (hour >= 15 && hour < 18) return 'evening';
  return 'night';
}

export function getGreeting() {
  const time = getTimeOfDay();
  if (time === 'morning') return 'おはよう';
  if (time === 'noon') return 'こんにちは';
  if (time === 'evening') return 'こんばんは';
  return 'こんばんわ';
}

// Remove all time-of-day classes from the given element.
// Defaults to `document.body` which has the `.app-root` class.
export function clearTimeClasses(target = document.body) {
  target.classList.remove('morning', 'noon', 'evening', 'night');
}

// Reset any time-of-day styling applied by the home screen. This will
// also clear the interval used to update the background.
export function clearTimeOfDayStyling() {
  clearTimeClasses();
  if (window.homeTimeInterval) {
    clearInterval(window.homeTimeInterval);
    window.homeTimeInterval = null;
  }
}

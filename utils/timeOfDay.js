export function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 11) return 'morning';
  if (hour < 15) return 'noon';
  if (hour < 18) return 'evening';
  return 'night';
}

export function getGreeting() {
  const time = getTimeOfDay();
  if (time === 'morning') return 'おはよう';
  if (time === 'noon') return 'こんにちは';
  if (time === 'evening') return 'こんばんは';
  return 'こんばんわ';
}

export function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'day';
  return 'night';
}

export function getGreeting() {
  const time = getTimeOfDay();
  if (time === 'morning') return 'おはよう';
  if (time === 'day') return 'こんにちは';
  return 'こんばんわ';
}

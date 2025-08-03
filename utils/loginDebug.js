export const LOG_KEY = 'login-debug-log';

export function addDebugLog(step, data) {
  try {
    const log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    log.push({ time: new Date().toISOString(), step, data });
    if (log.length > 50) log.shift();
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
    console.log('[login-debug]', step, data);
  } catch (e) {
    console.warn('[login-debug] failed to record log', e);
  }
}

export function showDebugLog(containerId = 'debug-log') {
  try {
    const el = document.getElementById(containerId);
    if (!el) return;
    const log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    el.textContent = log.map(l => `[${l.time}] ${l.step}${l.data ? ' ' + JSON.stringify(l.data) : ''}`).join('\n');
  } catch (e) {
    console.warn('[login-debug] failed to show log', e);
  }
}

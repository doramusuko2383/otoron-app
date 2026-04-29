const templateCache = new Map();

/**
 * Get an Audio instance for the given source path.
 * We keep one cached template per file, then return a fresh clone
 * to avoid state collisions on mobile browsers (muted flag, event
 * listeners, interrupted play promises, etc.).
 * @param {string} src - audio file path
 * @returns {HTMLAudioElement} reusable audio element
 */
export function getAudio(src) {
  let template = templateCache.get(src);
  if (!template) {
    template = new Audio(src);
    template.preload = "auto";
    templateCache.set(src, template);
  }

  // Clone to provide an isolated playback instance every time.
  const audio = template.cloneNode(true);
  audio.preload = "auto";
  audio.pause();
  audio.currentTime = 0;
  return audio;
}

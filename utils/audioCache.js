const cache = new Map();

/**
 * Get an Audio instance for the given source path, reusing
 * previously created objects for faster playback.
 * @param {string} src - audio file path
 * @returns {HTMLAudioElement} reusable audio element
 */
export function getAudio(src) {
  let audio = cache.get(src);
  if (!audio) {
    audio = new Audio(src);
    cache.set(src, audio);
  }
  audio.currentTime = 0;
  return audio;
}

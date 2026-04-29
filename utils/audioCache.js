const templateCache = new Map();
let audioPrimed = false;

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

/**
 * Safari/iOS対策:
 * 初回ユーザー操作で小さな無音再生を行い、以降の再生ブロックを起きにくくする。
 */
export function primeAudioPlaybackOnce() {
  if (audioPrimed) return;
  audioPrimed = true;
  const primer = new Audio();
  primer.playsInline = true;
  primer.setAttribute("playsinline", "");
  primer.setAttribute("webkit-playsinline", "");
  primer.muted = true;
  primer.volume = 0;
  const p = primer.play();
  if (p && typeof p.then === "function") {
    p.then(() => {
      primer.pause();
      primer.currentTime = 0;
    }).catch(() => {
      // ユーザー操作直後でも端末状態により失敗することがあるため握りつぶす
    });
  }
}

let currentLang = 'ja';             // ★ 一括日本語適用：初期は強制 'ja'
let dictCache = {};

export function forceLangJa() { setLang('ja'); }
export function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  return loadDict(lang).then(() => applyI18n(document));
}

export function t(key, vars) {
  const d = dictCache[currentLang] || {};
  const val = d[key];
  if (!val) {
    console.warn(`[i18n] missing key: "${key}" in ${currentLang}`);
    return key;
  }
  return vars ? val.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `\{${k}\}`)) : val;
}

async function loadDict(lang) {
  if (dictCache[lang]) return dictCache[lang];
  const res = await fetch(`/locales/${lang}.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`i18n load failed: ${lang}`);
  dictCache[lang] = await res.json();
  return dictCache[lang];
}

function applyI18nToElement(el) {
  const key = el.dataset.i18n;
  if (!key) return;
  const attrs = (el.dataset.i18nAttr || '').split(',').map(s => s.trim()).filter(Boolean);
  if (attrs.length === 0) {
    el.textContent = t(key);
  } else {
    attrs.forEach(attr => el.setAttribute(attr, t(key)));
  }
}

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(applyI18nToElement);
  applyPriceFormatting();
}

function applyPriceFormatting() {
  const locale = (currentLang === 'ja') ? 'ja-JP' : 'en-US';
  const fmt = new Intl.NumberFormat(locale, { style: 'currency', currency: 'JPY' });
  document.getElementById('price-monthly')?.replaceChildren(fmt.format(980));
  document.getElementById('price-yearly') ?.replaceChildren(fmt.format(9800));
}

// 初期化（★ 日本語固定 → 後で navigator.language 優先に戻せるようコメント）
// const initial = localStorage.getItem('lang') || (navigator.language || '').toLowerCase().startsWith('ja') ? 'ja' : 'en';
const initial = 'ja';
loadDict(initial).then(() => { currentLang = initial; applyI18n(document); });

// 動的DOMにも適用
const mo = new MutationObserver(ms => {
  for (const m of ms) m.addedNodes?.forEach(n => { if (n.nodeType === 1) applyI18n(n); });
});
mo.observe(document.body, { childList: true, subtree: true });

document.getElementById('lang-ja')?.addEventListener('click', () => setLang('ja'));
document.getElementById('lang-en')?.addEventListener('click', () => setLang('en'));


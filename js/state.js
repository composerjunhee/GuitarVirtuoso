// Shared UI settings (accidental spelling, left-handed) + persistence.
// Language lives in i18n.js.

const subs = [];

export const settings = {
  flat: localStorage.getItem('gt.flat') === '1',
  lefty: localStorage.getItem('gt.lefty') === '1',
};

export function setSetting(k, v) {
  settings[k] = v;
  localStorage.setItem(`gt.${k}`, v ? '1' : '0');
  subs.forEach(fn => fn(k, v));
}

export function onSetting(fn) { subs.push(fn); }

// ---- practice stats (Leitner-ish) ----
// gt.stats = { [symbol]: { att, ok, timeMs, box (1..5) } }

export function loadStats() {
  try { return JSON.parse(localStorage.getItem('gt.stats')) || {}; }
  catch { return {}; }
}

export function recordAttempt(symbol, correct, timeMs) {
  const s = loadStats();
  const e = s[symbol] || { att: 0, ok: 0, timeMs: 0, box: 1 };
  e.att++;
  if (correct) { e.ok++; e.box = Math.min(5, e.box + 1); e.timeMs += timeMs; }
  else e.box = 1;
  s[symbol] = e;
  localStorage.setItem('gt.stats', JSON.stringify(s));
}

// gt.deck = [symbol, ...] — the user's custom practice deck
export function loadDeck() {
  try { return JSON.parse(localStorage.getItem('gt.deck')) || []; }
  catch { return []; }
}
export function saveDeck(symbols) {
  localStorage.setItem('gt.deck', JSON.stringify([...new Set(symbols)]));
}
export function addToDeck(symbol) {
  const d = loadDeck();
  if (!d.includes(symbol)) { d.push(symbol); saveDeck(d); }
}

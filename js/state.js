// Shared UI settings (accidental spelling, left-handed) + persistence.
// Language lives in i18n.js.

const subs = [];

// state.js is imported by pluck.js → audio modules → the Node selftest
// harness, where localStorage doesn't exist — shim it so module load is safe.
const ls = typeof localStorage !== 'undefined'
  ? localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const num = (k, dflt) => {
  const v = parseFloat(ls.getItem(`gt.${k}`));
  return Number.isFinite(v) ? v : dflt;
};

export const settings = {
  flat: ls.getItem('gt.flat') === '1',
  lefty: ls.getItem('gt.lefty') === '1',
  // output levels 0..1.5 — metronome defaults louder than the plucked
  // guitar so the beat cuts through a ringing chord
  volGuitar: num('volGuitar', 0.7),
  volMetro: num('volMetro', 1.0),
};

export function setSetting(k, v) {
  settings[k] = v;
  ls.setItem(`gt.${k}`, typeof v === 'number' ? String(v) : (v ? '1' : '0'));
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

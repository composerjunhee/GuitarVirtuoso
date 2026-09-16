// Stats screen — read-mostly view over gt.stats (Leitner boxes 1..5) and the
// custom deck (gt.deck). Everything is re-read from localStorage on each
// render, so progress made on the practice/ear tabs shows up on tab entry.
// Strings are a module-local {ko,en} table — i18n.js is shared, not ours.
// Markup follows the styles.css stats contract: .stats-summary/.stats-empty,
// .stats-list > .stat-row(.weak) > .stat-name + .stat-bar(.low) + .stat-acc
// + .box-dots — see the "stats screen" block near the bottom of styles.css.

import { parseSymbol, chordSymbol } from '../theory/chords.js';
import { getLang, onLangChange } from '../i18n.js';
import { settings, onSetting, loadStats, loadDeck, saveDeck } from '../state.js';

const STR = {
  ko: {
    summary: '요약',
    attempts: '총 시도',
    accuracy: '정확도',
    chords: '연습한 코드',
    mastered: '마스터',
    masteredTitle: '박스 4 이상',
    perChord: '코드별',
    weakest: '취약한 순',
    deck: '내 덱',
    deckEmpty: '덱이 비어 있습니다. 라이브러리에서 코드를 추가하세요.',
    empty: '아직 연습 기록이 없습니다. 연습·청음 탭에서 코드를 연주해 보세요.',
    goPractice: '연습하러 가기',
    reset: '이 코드 기록 지우기',
    remove: '덱에서 빼기',
    boxTitle: n => `라이트너 박스 ${n}/5`,
    avg: ms => `정답 평균 ${(ms / 1000).toFixed(1)}초`,
  },
  en: {
    summary: 'Summary',
    attempts: 'Attempts',
    accuracy: 'Accuracy',
    chords: 'Chords',
    mastered: 'Mastered',
    masteredTitle: 'Leitner box ≥4',
    perChord: 'Per chord',
    weakest: 'weakest first',
    deck: 'My deck',
    deckEmpty: 'Deck is empty. Add chords from the Library.',
    empty: 'No practice data yet — play some chords in Practice or Ear.',
    goPractice: 'Go practice',
    reset: 'Reset this chord',
    remove: 'Remove from deck',
    boxTitle: n => `Leitner box ${n}/5`,
    avg: ms => `avg ${(ms / 1000).toFixed(1)}s`,
  },
};

let body = null;                     // #statsBody

const s = k => STR[getLang()]?.[k] ?? STR.en[k] ?? k;
const boxOf = e => Math.min(5, Math.max(1, e.box || 1));

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// Chord symbols stay Latin in every UI language; re-spell ♯/♭ to the current
// setting when the stored string parses, otherwise show it verbatim.
function dispSym(sym) {
  const ch = parseSymbol(sym);
  return ch ? chordSymbol(ch, { flat: settings.flat }) : sym;
}

const statEntries = stats =>
  Object.entries(stats).filter(([, e]) => e && e.att > 0);

// ---------- render ----------

function render() {
  if (!body) return;
  const stats = loadStats();
  const deck = loadDeck();
  body.replaceChildren();
  body.append(summaryCard(stats));
  const list = chordCard(stats);
  if (list) body.append(list);
  body.append(deckCard(deck));
}

function summaryCard(stats) {
  const entries = statEntries(stats);
  if (!entries.length) {
    const card = el('div', 'stats-empty');
    card.append(el('p', 'hint', s('empty')));
    const go = el('button', 'primary big', s('goPractice'));
    go.addEventListener('click', () =>
      document.querySelector('.tab[data-tab="practice"]')?.click());
    card.append(go);
    return card;
  }
  const card = el('div', 'stats-summary');
  const att = entries.reduce((n, [, e]) => n + e.att, 0);
  const ok = entries.reduce((n, [, e]) => n + e.ok, 0);
  const mastered = entries.filter(([, e]) => boxOf(e) >= 4).length;
  // no dedicated summary-metric class in styles.css — one-off inline grid
  const grid = el('div');
  grid.style.cssText =
    'display:grid;grid-template-columns:repeat(4,1fr);' +
    'gap:10px;text-align:center;';
  for (const [val, lab, tip] of [
    [att, s('attempts'), ''],
    [`${att ? Math.round(100 * ok / att) : 0}%`, s('accuracy'), ''],
    [entries.length, s('chords'), ''],
    [mastered, s('mastered'), s('masteredTitle')],
  ]) {
    const cell = el('div');
    if (tip) cell.title = tip;
    const n = el('div', 'mono', String(val));
    n.style.cssText = 'font-size:22px;color:var(--accent);';
    cell.append(n, el('div', 'hint', lab));
    grid.append(cell);
  }
  card.append(grid);
  return card;
}

// weakest first — same ordering as the "weak chords" practice deck
function chordCard(stats) {
  const entries = statEntries(stats).sort((a, b) =>
    boxOf(a[1]) - boxOf(b[1]) ||
    (a[1].ok / a[1].att) - (b[1].ok / b[1].att) ||
    a[0].localeCompare(b[0]));
  if (!entries.length) return null;
  const list = el('div', 'stats-list');
  const head = el('div', 'chip-row');
  head.style.marginTop = '0';
  head.append(el('span', 'row-label', s('perChord')),
              el('span', 'hint', s('weakest')));
  list.append(head);
  for (const [sym, e] of entries) list.append(chordRow(sym, e));
  return list;
}

function chordRow(sym, e) {
  const acc = e.ok / e.att;
  const box = boxOf(e);
  // "weak" matches the practice tab's weak-deck rule (box ≤ 2): red border +
  // red name via .stat-row.weak; the bar itself goes red under 50% accuracy
  const row = el('div', 'stat-row' + (box <= 2 ? ' weak' : ''));
  row.append(el('span', 'stat-name', dispSym(sym)));

  const bar = el('div', 'stat-bar' + (acc < .5 ? ' low' : ''));
  const fill = el('i');
  fill.style.width = `${Math.round(acc * 100)}%`;
  bar.append(fill);
  row.append(bar);

  row.append(el('span', 'stat-acc', `${Math.round(acc * 100)}%`));

  const dots = el('span', 'box-dots');
  dots.title = s('boxTitle')(box);
  for (let i = 1; i <= 5; i++) {
    const d = el('i');
    if (i <= box) d.className = 'on';
    dots.append(d);
  }
  row.append(dots);

  // full-width subline: hits/attempts + mean time on the correct ones
  // (timeMs/ok), plus the two-tap reset button on the right
  const sub = el('p', 'hint mono');
  sub.style.cssText =
    'grid-column:1/-1;margin:0;display:flex;' +
    'justify-content:space-between;align-items:center;gap:8px;';
  sub.append(el('span', '',
    `✓${e.ok}/${e.att} · ${e.ok ? s('avg')((e.timeMs || 0) / e.ok) : '—'}`));
  sub.append(resetBtn(sym));
  row.append(sub);
  return row;
}

// ✕ arms on the first tap, deletes on the second — the entry is gone for good.
function resetBtn(sym) {
  const rm = el('button', 'chip', '✕');
  rm.title = s('reset');
  rm.style.padding = '6px 10px';
  let armed = false, t = null;
  rm.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      rm.style.color = 'var(--bad)';
      rm.style.borderColor = 'var(--bad)';
      t = setTimeout(() => {
        armed = false; rm.style.color = ''; rm.style.borderColor = '';
      }, 1600);
      return;
    }
    clearTimeout(t);
    // state.js exports no saveStats — rewrite the map minus this chord;
    // remaining entries keep their {att,ok,timeMs,box} shape
    const all = loadStats();
    delete all[sym];
    localStorage.setItem('gt.stats', JSON.stringify(all));
    render();
  });
  return rm;
}

function deckCard(deck) {
  const card = el('div', 'setup-card');
  card.style.marginTop = '14px';
  const head = el('div', 'chip-row');
  head.style.marginTop = '0';
  head.append(el('span', 'row-label', s('deck')));
  card.append(head);
  if (!deck.length) {
    card.append(el('p', 'hint', s('deckEmpty')));
    return card;
  }
  const wrap = el('div', 'chip-row wrap');
  wrap.style.margin = '4px 0 0';
  for (const sym of deck) {
    const chip = el('span', 'chip');
    chip.style.cursor = 'default';
    chip.append(el('span', 'mono', dispSym(sym)));
    const rm = el('button', '', '✕');
    rm.title = s('remove');
    rm.style.cssText =
      'background:none;border:none;color:var(--dim);cursor:pointer;' +
      'font:inherit;margin-left:8px;padding:0 2px;min-height:0;';
    rm.addEventListener('click', () => {
      saveDeck(loadDeck().filter(x => x !== sym));
      render();
    });
    chip.append(rm);
    wrap.append(chip);
  }
  card.append(wrap);
  return card;
}

// ---------- wiring ----------

export function initStats() {
  body = document.getElementById('statsBody');
  render();
  onLangChange(render);
  onSetting(k => { if (k === 'flat') render(); });   // ♯/♭ re-spells symbols
  // re-read localStorage each time the tab opens — practice/ear mutate it
  const statsScreen = document.getElementById('screen-stats');
  if (statsScreen) {
    new MutationObserver(() => {
      if (statsScreen.classList.contains('active')) render();
    }).observe(statsScreen, { attributes: true, attributeFilter: ['class'] });
  }
  window.addEventListener('focus', render);          // second window stayed open
}

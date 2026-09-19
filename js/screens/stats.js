// Stats screen — read-mostly view over gt.stats (Leitner boxes 1..5) and the
// custom deck (gt.deck). Everything is re-read from localStorage on each
// render, so progress made on the practice/ear tabs shows up on tab entry.
// Strings are a module-local {ko,en} table — i18n.js is shared, not ours.
//
// Stat keys are typed at record time by prefix: 'note:C' (fretboard game),
// 'iv:M3' (ear intervals), 'prog:I–V–vi–IV' (ear progressions), 'chg:C|G'
// (chord-change drill — the unordered pair, one entry for both directions);
// bare keys are chord symbols. Legacy bare interval/progression labels are
// classified by shape at render; the old highlow drill's junk "E → G" pair
// keys are filtered out entirely (typeOf → 'junk').
//
// Markup follows the styles.css stats contract: .stats-summary/.stats-empty,
// .stats-list > .seg + .stat-group + .stat-rows > .stat-row(.weak,.open) >
// .stat-name + .stat-bar(.low) + .stat-acc + .box-dots + .stat-sub, and the
// .stats-heatmap card — see the "stats screen" block near the bottom of
// styles.css.

import { parseSymbol, chordSymbol } from '../theory/chords.js';
import { pcName } from '../theory/notes.js';
import { getLang, onLangChange } from '../i18n.js';
import { settings, onSetting, loadStats, loadDeck, saveDeck } from '../state.js';
import { PROGRESSIONS } from '../data/progressions.js';
import { primePractice } from './practice.js';

const STR = {
  ko: {
    summary: '요약',
    attempts: '총 시도',
    accuracy: '정확도',
    items: '연습 항목',
    mastered: '마스터',
    masteredTitle: '박스 4 이상',
    perItem: '항목별',
    weakest: '취약한 순',
    t_chord: '코드',
    t_interval: '인터벌',
    t_prog: '진행',
    t_change: '전환',
    t_note: '음',
    t_other: '기타',
    gWeak: '취약',
    gLearn: '학습중',
    mapTitle: '코드 숙련도',
    legEmpty: '미연습',
    deck: '내 덱',
    deckEmpty: '덱이 비어 있습니다. 라이브러리에서 코드를 추가하세요.',
    empty: '아직 연습 기록이 없습니다. 연습·청음 탭에서 코드를 연주해 보세요.',
    goPractice: '연습하러 가기',
    practice: '연습',
    practiceAll: '모두 연습',
    chgPractice: '전환 연습',
    hmPractice: '연습하기',
    reset: '이 항목 기록 지우기',
    remove: '덱에서 빼기',
    boxTitle: n => `라이트너 박스 ${n}/5`,
    avg: ms => `정답 평균 ${(ms / 1000).toFixed(1)}초`,
  },
  en: {
    summary: 'Summary',
    attempts: 'Attempts',
    accuracy: 'Accuracy',
    items: 'Items',
    mastered: 'Mastered',
    masteredTitle: 'Leitner box ≥4',
    perItem: 'By item',
    weakest: 'weakest first',
    t_chord: 'Chords',
    t_interval: 'Intervals',
    t_prog: 'Progressions',
    t_change: 'Changes',
    t_note: 'Notes',
    t_other: 'Other',
    gWeak: 'Needs work',
    gLearn: 'Learning',
    mapTitle: 'Chord skill map',
    legEmpty: 'unpracticed',
    deck: 'My deck',
    deckEmpty: 'Deck is empty. Add chords from the Library.',
    empty: 'No practice data yet — play some chords in Practice or Ear.',
    goPractice: 'Go practice',
    practice: 'Practice',
    practiceAll: 'Practice all',
    chgPractice: 'Change drill',
    hmPractice: 'tap to practice',
    reset: 'Reset this item',
    remove: 'Remove from deck',
    boxTitle: n => `Leitner box ${n}/5`,
    avg: ms => `avg ${(ms / 1000).toFixed(1)}s`,
  },
};

let body = null;                     // #statsBody
let selType = null;                  // type-seg selection (view state only)

const s = k => STR[getLang()]?.[k] ?? STR.en[k] ?? k;
const boxOf = e => Math.min(5, Math.max(1, e.box || 1));
// mastery buckets: box ≤2 needs work, box 3 learning, box ≥4 mastered
const groupId = e => boxOf(e) <= 2 ? 'weak' : boxOf(e) === 3 ? 'learn' : 'master';

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ---------- stat-key typing ----------

// bare interval labels the pre-namespace ear drill recorded
const IV_RE = /^(m2|M2|m3|M3|P4|TT|P5|m6|M6|m7|M7|P8)$/;
const PROG_LABELS = new Set(PROGRESSIONS.map(p => p.label));

// Classify a gt.stats key. Record-time prefixes win; then the legacy bare
// shapes — junk pairs from the old highlow drill, bare interval labels,
// progression labels (en dashes), then anything that parses as a chord.
export function typeOf(key) {
  if (key.startsWith('note:')) return 'note';
  if (key.startsWith('iv:')) return 'interval';
  if (key.startsWith('prog:')) return 'prog';
  if (key.startsWith('chg:')) return 'change';
  if (key.includes(' → ')) return 'junk';
  if (IV_RE.test(key)) return 'interval';
  if (key.includes('–') || PROG_LABELS.has(key)) return 'prog';
  if (parseSymbol(key)) return 'chord';
  return 'other';
}

// Entries worth displaying: junk keys are noise — dropped from the list,
// the type seg, and every summary metric.
const statEntries = stats =>
  Object.entries(stats).filter(([k, e]) => e && e.att > 0 && typeOf(k) !== 'junk');

// ---------- stats → practice deeplinks ----------

// A row's practice target: chord stats drill the chord, change stats
// drill the pair — the other types have no practice drill.
export function primeArgsFor(key) {
  const ty = typeOf(key);
  if (ty === 'chord') return { mode: 'flash', focus: [key] };
  if (ty === 'change') {
    const pair = key.slice(4).split('|');
    if (pair.length === 2 && pair.every(p => parseSymbol(p)))
      return { mode: 'chg', pair };
  }
  return null;
}

// Prime the practice setup, THEN activate the tab — the tab click
// re-renders the practice screen off the seeded setup.
function goPractice(args) {
  primePractice(args);
  document.querySelector('.tab[data-tab="practice"]')?.click();
}

// small ghost chip, sized like the reset ✕. Rows/group headers are
// clickable themselves — the button must never bubble into their toggles.
function practiceBtn(args, label) {
  const b = el('button', 'chip', label || s('practice'));
  b.style.padding = '6px 10px';
  b.addEventListener('keydown', e => e.stopPropagation());
  b.addEventListener('click', e => { e.stopPropagation(); goPractice(args); });
  return b;
}

// Chord symbols stay Latin in every UI language; re-spell ♯/♭ to the current
// setting when the stored string parses, otherwise show it verbatim. The
// 'xxx:' type prefix is stripped first — non-chord keys render as stored.
// 'chg:A|B' pair keys render as 'A↔B' with each half re-spelled.
function dispSym(sym) {
  if (sym.startsWith('chg:')) {
    return sym.slice(4).split('|').map(p => {
      const ch = parseSymbol(p);
      return ch ? chordSymbol(ch, { flat: settings.flat }) : p;
    }).join('↔');
  }
  const bare = sym.replace(/^[a-z]+:/, '');
  const ch = parseSymbol(bare);
  return ch ? chordSymbol(ch, { flat: settings.flat }) : bare;
}

// weakest first — same ordering as the "weak chords" practice deck
const weakestFirst = (a, b) =>
  boxOf(a[1]) - boxOf(b[1]) ||
  (a[1].ok / a[1].att) - (b[1].ok / b[1].att) ||
  a[0].localeCompare(b[0]);

// ---------- render ----------

function render() {
  if (!body) return;
  const stats = loadStats();
  const deck = loadDeck();
  body.replaceChildren();
  body.append(summaryCard(stats));
  const list = itemCard(stats);
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
    [entries.length, s('items'), ''],
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

// per-item list: type filter seg, then collapsible mastery groups of
// compact rows (tap a row to expand its hits/avg/reset subline)
const TYPE_ORDER = ['chord', 'interval', 'prog', 'change', 'note', 'other'];

function itemCard(stats) {
  const entries = statEntries(stats);
  if (!entries.length) return null;
  const types = TYPE_ORDER.filter(ty => entries.some(([k]) => typeOf(k) === ty));
  if (!types.includes(selType)) {
    selType = types.includes('chord') ? 'chord' : types[0];
  }

  const list = el('div', 'stats-list');
  const head = el('div', 'chip-row');
  head.style.marginTop = '0';
  head.append(el('span', 'row-label', s('perItem')),
              el('span', 'hint', s('weakest')));
  list.append(head);

  // type filter — pointless with a single type
  if (types.length > 1) {
    const seg = el('div', 'seg');
    for (const ty of types) {
      const b = el('button', 'chip' + (ty === selType ? ' sel' : ''), s('t_' + ty));
      b.addEventListener('click', () => { selType = ty; render(); });
      seg.append(b);
    }
    list.append(seg);
  }

  if (selType === 'chord') list.append(heatmapCard(entries));

  const sel = entries.filter(([k]) => typeOf(k) === selType).sort(weakestFirst);
  for (const [gid, labelKey, open] of [
    ['weak', 'gWeak', true],
    ['learn', 'gLearn', true],
    ['master', 'mastered', false],
  ]) {
    const rows = sel.filter(([, e]) => groupId(e) === gid);
    if (!rows.length) continue;

    const gh = el('div', 'stat-group');
    gh.setAttribute('role', 'button');
    gh.tabIndex = 0;
    const chev = el('span', 'chev', open ? '▾' : '▸');
    gh.append(chev, el('span', '', `${s(labelKey)} (${rows.length})`));
    // weak chord group → one-tap weak-deck session (other types: no drill)
    if (gid === 'weak' && selType === 'chord') {
      const all = practiceBtn({ mode: 'flash', deck: 'weak' }, s('practiceAll'));
      all.style.marginLeft = 'auto';
      gh.append(all);
    }

    const wrap = el('div', 'stat-rows');
    wrap.hidden = !open;
    for (const [sym, e] of rows) wrap.append(statRow(sym, e));

    const toggle = () => {
      wrap.hidden = !wrap.hidden;
      chev.textContent = wrap.hidden ? '▸' : '▾';
    };
    gh.addEventListener('click', toggle);
    gh.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); }
    });
    list.append(gh, wrap);
  }
  return list;
}

function statRow(sym, e) {
  const acc = e.ok / e.att;
  const box = boxOf(e);
  // "weak" matches the practice tab's weak-deck rule (box ≤ 2): red border +
  // red name via .stat-row.weak; the bar itself goes red under 50% accuracy
  const row = el('div', 'stat-row' + (box <= 2 ? ' weak' : ''));
  // div, not <button> — the expanded subline carries a reset button
  row.setAttribute('role', 'button');
  row.tabIndex = 0;
  const toggle = () => row.classList.toggle('open');
  row.addEventListener('click', toggle);
  row.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); }
  });

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

  // collapsed by default: hits/attempts + mean time on the correct ones
  // (timeMs/ok); the action buttons on the right are a practice deeplink
  // (chords + change pairs only) plus the two-tap reset
  const sub = el('p', 'hint mono stat-sub');
  sub.append(el('span', '',
    `✓${e.ok}/${e.att} · ${e.ok ? s('avg')((e.timeMs || 0) / e.ok) : '—'}`));
  const acts = el('span');
  acts.style.cssText = 'display:inline-flex;gap:6px;align-items:center;';
  const args = primeArgsFor(sym);
  if (args) {
    acts.append(practiceBtn(args,
      typeOf(sym) === 'change' ? s('chgPractice') : s('practice')));
  }
  acts.append(resetBtn(sym));
  sub.append(acts);
  row.append(sub);
  return row;
}

// ✕ arms on the first tap, deletes on the second — the entry is gone for good.
function resetBtn(sym) {
  const rm = el('button', 'chip', '✕');
  rm.title = s('reset');
  rm.style.padding = '6px 10px';
  let armed = false, t = null;
  // the button lives inside a clickable row — never let its events toggle it
  rm.addEventListener('keydown', e => e.stopPropagation());
  rm.addEventListener('click', e => {
    e.stopPropagation();
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
    // state.js exports no saveStats — rewrite the map minus this item;
    // remaining entries keep their {att,ok,timeMs,box} shape
    const all = loadStats();
    delete all[sym];
    localStorage.setItem('gt.stats', JSON.stringify(all));
    render();
  });
  return rm;
}

// ---------- chord heatmap ----------

// quality families → grid columns (a partition of every QUALITIES key)
const FAMILIES = [
  { label: 'maj',  qs: new Set(['', '5', 'add9']) },
  { label: 'm',    qs: new Set(['m', 'm6']) },
  { label: '7',    qs: new Set(['7', '9', '11', '13', '7sus4']) },
  { label: 'maj7', qs: new Set(['maj7', 'maj9']) },
  { label: 'm7',   qs: new Set(['m7', 'm9']) },
  { label: 'ø',    qs: new Set(['m7b5', 'dim', 'dim7']) },
  { label: 'etc',  qs: new Set(['aug', 'sus2', 'sus4', '6']) },
];

// 12 roots × 7 families; a cell aggregates every chord entry that lands in
// it (worst box wins — a family is only as strong as its weakest member).
// The symbols are kept too — a non-empty cell is a focus-drill deeplink.
function heatmapCard(entries) {
  const card = el('div', 'stats-heatmap');
  card.append(el('div', 'hm-title', s('mapTitle')));

  const cells = new Map();            // "root|famIdx" → {att,ok,timeMs,box,syms}
  for (const [key, e] of entries) {
    if (typeOf(key) !== 'chord') continue;
    const ch = parseSymbol(key);
    const fi = FAMILIES.findIndex(f => f.qs.has(ch.quality));
    if (fi < 0) continue;
    const ck = `${ch.root}|${fi}`;
    const agg = cells.get(ck) || { att: 0, ok: 0, timeMs: 0, box: 5, syms: [] };
    agg.att += e.att;
    agg.ok += e.ok;
    agg.timeMs += e.timeMs;
    agg.box = Math.min(agg.box, boxOf(e));
    agg.syms.push(key);
    cells.set(ck, agg);
  }

  const rootName = pc => pcName(pc, { flat: settings.flat, lang: 'en' });
  const grid = el('div', 'hm-grid');
  grid.append(el('span'));            // empty corner above the root column
  for (const f of FAMILIES) grid.append(el('span', 'hm-head', f.label));
  for (let root = 0; root < 12; root++) {
    grid.append(el('span', 'hm-root', rootName(root)));
    for (let fi = 0; fi < FAMILIES.length; fi++) {
      const c = el('span', 'hm-cell');
      const label = `${rootName(root)} ${FAMILIES[fi].label}`;
      const agg = cells.get(`${root}|${fi}`);
      if (!agg) {
        c.title = `${label} — ${s('legEmpty')}`;
      } else {
        const acc = agg.ok / agg.att;
        c.classList.add(
          agg.box <= 2 ? 'hm-weak' : agg.box === 3 ? 'hm-learn' : 'hm-master');
        // mastery picks the color; accuracy picks how loud it is
        c.style.opacity = (0.45 + 0.55 * acc).toFixed(2);
        c.title = `${label} — ✓${agg.ok}/${agg.att} · ${s('boxTitle')(agg.box)}` +
          ` · ${s('hmPractice')}`;
        // non-empty cells deeplink into a focus drill of their chords
        c.style.cursor = 'pointer';
        c.setAttribute('role', 'button');
        c.tabIndex = 0;
        const drill = () => goPractice({ mode: 'flash', focus: agg.syms });
        c.addEventListener('click', drill);
        c.addEventListener('keydown', ev => {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); drill(); }
        });
      }
      grid.append(c);
    }
  }
  card.append(grid);

  const leg = el('div', 'hm-legend');
  for (const [cls, key] of [
    ['', 'legEmpty'], ['hm-weak', 'gWeak'],
    ['hm-learn', 'gLearn'], ['hm-master', 'mastered'],
  ]) {
    const item = el('span', 'hint');
    item.append(el('i', 'hm-dot' + (cls ? ' ' + cls : '')), el('span', '', s(key)));
    leg.append(item);
  }
  card.append(leg);
  return card;
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

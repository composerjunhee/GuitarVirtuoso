// Fretboard game — note-on-the-neck drills. Two modes:
//   find — the screen shows a note name; the player taps position(s) of
//          that pitch class on the board.
//     · sub 'single': any one correct position inside the range scores.
//     · sub 'all':    every position of the pc inside the range must be
//          tapped; each correct tap marks the cell, one wrong tap fails.
//   name — a dot highlights one position; the player names the pitch
//          class via the 12-note root grid (rootPicker quiz mode).
// Same 10-round/streak/score/result skeleton as ear.js; all strings are
// module-local (i18n.js is shared — only tab.fretboard lives there).

import { STRINGS, fretToMidi, midiToPc, pcName } from '../theory/notes.js';
import { segRow, rootPicker } from '../ui/components.js';
import { createFretboard } from '../ui/fretboard.js';
import { getLang, onLangChange } from '../i18n.js';
import { settings, onSetting, recordAttempt } from '../state.js';

const STR = {
  ko: {
    mode: '모드',
    mFind: '찾기',
    mName: '이름 맞히기',
    sub: '방식',
    subSingle: '한 곳',
    subAll: '전부',
    range: '프렛 범위',
    rOpen: '0–4 개방',
    rMid: '5–11 미들',
    rAll: '전체 0–12',
    hintFind1: '표시된 음을 지판에서 누르세요. 범위 안 어느 위치든 정답입니다.',
    hintFindAll: '범위 안에 있는 해당 음의 모든 위치를 찾아 누르세요. 하나라도 틀리면 오답입니다.',
    hintName: '지판에 표시된 위치의 음 이름을 고르세요.',
    start: '시작',
    end: '끝내기',
    reveal: '정답 보기',
    next: '다음',
    tapIt: '이 음을 누르세요',
    findAll: '모든 위치를 찾으세요',
    whichNote: '이 음은?',
    correct: '정답!',
    wrong: '오답',
    streak: '연속',
    results: '결과',
    accuracy: '정확도',
    bestStreak: '최고 연속',
    missed: '틀린 음',
    again: '다시 하기',
  },
  en: {
    mode: 'Mode',
    mFind: 'Find',
    mName: 'Name it',
    sub: 'Spots',
    subSingle: 'Single',
    subAll: 'All',
    range: 'Fret range',
    rOpen: '0–4 open',
    rMid: '5–11 mid',
    rAll: 'All 0–12',
    hintFind1: 'Tap the shown note on the board — any position in range scores.',
    hintFindAll: 'Tap every position of the note inside the range. One wrong tap fails the round.',
    hintName: 'Name the note at the highlighted position.',
    start: 'Start',
    end: 'End',
    reveal: 'Reveal',
    next: 'Next',
    tapIt: 'Tap this note',
    findAll: 'Find every position',
    whichNote: 'Which note?',
    correct: 'Correct!',
    wrong: 'Wrong',
    streak: 'Streak',
    results: 'Results',
    accuracy: 'Accuracy',
    bestStreak: 'Best streak',
    missed: 'Missed',
    again: 'Again',
  },
};

const ROUNDS = 10;

// fret-range presets (ids used by the setup seg + session.range)
export const FRET_RANGES = {
  open: [0, 4],
  mid: [5, 11],
  all: [0, 12],
};

const setup = { mode: 'find', sub: 'single', range: 'all' };

let body = null;                 // #fretBody
let panel = 'setup';             // 'setup' | 'run' | 'result'
// {mode, sub, lo, hi, round, results, streak, best, sym, stat, pc, pos,
//  positions, found, picked, resolved, done, t0, lastKey}
let session = null;
let board = null;                // createFretboard handle
let boardLefty = null;           // lefty setting the live board was built with
let boardTappable = null;        // interactive flag the live board has
let advanceTimer = null;

const s = k => STR[getLang()]?.[k] ?? STR.en[k] ?? k;
const opts = () => ({ flat: settings.flat, lang: getLang() });
const q = id => body.querySelector('#' + id);
const randInt = n => Math.floor(Math.random() * n);
const posKey = (str, fret) => `${str},${fret}`;

// ---------- pure helpers (exported for the selftest) ----------

// Every {string, fret} where `pc` sounds within fret range [lo, hi].
// Per string the pc lands on frets f ≡ (pc - open) (mod 12); with hi ≤ 15
// that's at most f and f+12.
export function positionsOfPc(pc, lo, hi, tuning = STRINGS) {
  const out = [];
  for (let str = 0; str < tuning.length; str++) {
    const f0 = ((pc - tuning[str]) % 12 + 12) % 12;
    for (let f = f0; f <= hi; f += 12) {
      if (f >= lo) out.push({ string: str, fret: f });
    }
  }
  return out;
}

// name mode: the pitch class at a board position
export function nameAnswer(stringIdx, fret, tuning = STRINGS) {
  return midiToPc(fretToMidi(stringIdx, fret, tuning));
}

// all-mode completion: `found` (a Set of "s,f" keys) covers every position
export function allFound(pc, found, lo, hi, tuning = STRINGS) {
  const pos = positionsOfPc(pc, lo, hi, tuning);
  return pos.length > 0 &&
    pos.every(p => found.has(posKey(p.string, p.fret)));
}

// ---------- DOM ----------

function render() {
  body.innerHTML = `
    <div id="fgSetup" class="setup-card">
      <div class="chip-row"><span class="row-label" data-s="mode"></span>
        <span id="fgMode" class="seg"></span></div>
      <div id="fgSubRow"><div class="chip-row">
        <span class="row-label" data-s="sub"></span>
        <span id="fgSub" class="seg"></span></div></div>
      <div class="chip-row"><span class="row-label" data-s="range"></span>
        <span id="fgRange" class="seg"></span></div>
      <p class="hint" id="fgHint"></p>
      <button id="fgStart" class="primary big" data-s="start"></button>
    </div>
    <div id="fgRun" class="setup-card fg-run" hidden>
      <div class="run-top">
        <span id="fgProgress" class="mono"></span>
        <span><span id="fgScore" class="mono"></span>&ensp;<span id="fgStreak" class="mono"></span></span>
        <button id="fgEnd" class="ghost" data-s="end"></button>
      </div>
      <div class="run-bar" aria-hidden="true"><i></i></div>
      <div class="run-body">
        <h2 id="fgTitle" class="chord-title huge"></h2>
        <div id="fgPrompt" class="feedback"></div>
        <div id="fgBoard" class="board"></div>
        <div id="fgTally" class="mono fg-tally" hidden></div>
        <div id="fgAnswers" class="chip-row wrap center"></div>
        <div id="fgFeedback" class="feedback"></div>
        <div class="row" style="justify-content:center">
          <button id="fgGiveup" class="ghost" data-s="reveal"></button>
          <button id="fgNext" class="primary" data-s="next" hidden></button>
        </div>
      </div>
    </div>
    <div id="fgResult" class="setup-card" hidden>
      <h2 data-s="results"></h2>
      <div id="fgResultBody" class="fg-result"></div>
      <button id="fgAgain" class="primary big" data-s="again"></button>
    </div>`;
  board = null;                  // innerHTML just detached the live svg
  wire();
  fillStrings();
  renderSetupRows();
  if (session && !session.done && session.round > 0) renderRound();
  showPanel(panel);
}

function wire() {
  q('fgStart').addEventListener('click', startSession);
  q('fgEnd').addEventListener('click', endSession);
  q('fgAgain').addEventListener('click', () => { session = null; showPanel('setup'); });
  q('fgNext').addEventListener('click', () => { clearTimeout(advanceTimer); nextRound(); });
  q('fgGiveup').addEventListener('click', () => resolve(false, null));
}

function fillStrings() {
  body.querySelectorAll('[data-s]').forEach(el => { el.textContent = s(el.dataset.s); });
}

function showPanel(p) {
  panel = p;
  if (!body) return;
  q('fgSetup').hidden = p !== 'setup';
  q('fgRun').hidden = p !== 'run';
  q('fgResult').hidden = p !== 'result';
}

// ---------- setup ----------

function renderSetupRows() {
  segRow(q('fgMode'), [
    { id: 'find', label: s('mFind') },
    { id: 'name', label: s('mName') },
  ], setup.mode, id => { setup.mode = id; renderSetupRows(); });

  segRow(q('fgSub'), [
    { id: 'single', label: s('subSingle') },
    { id: 'all', label: s('subAll') },
  ], setup.sub, id => { setup.sub = id; });

  segRow(q('fgRange'), [
    { id: 'open', label: s('rOpen') },
    { id: 'mid', label: s('rMid') },
    { id: 'all', label: s('rAll') },
  ], setup.range, id => { setup.range = id; });

  q('fgSubRow').hidden = setup.mode !== 'find';
  q('fgHint').textContent =
    s(setup.mode === 'name' ? 'hintName'
      : setup.sub === 'all' ? 'hintFindAll' : 'hintFind1');
}

// ---------- session ----------

function startSession() {
  const [lo, hi] = FRET_RANGES[setup.range] || FRET_RANGES.all;
  session = {
    mode: setup.mode, sub: setup.sub, lo, hi,
    round: 0, results: [], streak: 0, best: 0,
    sym: '', stat: null, pc: null, pos: null,
    positions: [], found: new Set(),
    picked: null, resolved: false, done: false, t0: 0, lastKey: null,
  };
  showPanel('run');
  nextRound();
}

function nextRound() {
  if (!session || session.done) return;
  if (session.round >= ROUNDS) { finish(); return; }
  session.round++;
  session.resolved = false;
  session.picked = null;
  session.found = new Set();
  pickRound();
  session.t0 = performance.now();
  renderRound();
}

function pickRound() {
  const se = session;
  if (se.mode === 'name') {
    // a random position inside the range becomes the question
    let str, fret, key, guard = 0;
    do {
      str = randInt(6);
      fret = se.lo + randInt(se.hi - se.lo + 1);
      key = posKey(str, fret);
    } while (key === se.lastKey && ++guard < 60);
    se.lastKey = key;
    se.pos = { string: str, fret };
    se.pc = nameAnswer(str, fret);
    se.positions = [se.pos];
  } else {
    // find mode: reveal a pc; the player locates it
    let pc, guard = 0;
    do { pc = randInt(12); } while (pc === se.lastKey && ++guard < 60);
    se.lastKey = pc;
    se.pc = pc;
    se.pos = null;
    se.positions = positionsOfPc(pc, se.lo, se.hi);
  }
  // display name + stats key. The stats key stays Latin so it doesn't
  // fork when the UI language changes (same convention as chord symbols).
  se.sym = pcName(se.pc, opts());
  se.stat = pcName(se.pc, { flat: settings.flat, lang: 'en' });
}

// ---------- board ----------

// (Re)build the board when it doesn't exist, the lefty flag flipped, or
// the mode's tappability changed — mirroring practice.js's lazy rebuild.
function ensureBoard() {
  const tappable = session && session.mode === 'find';
  if (board && boardLefty === settings.lefty && boardTappable === tappable) return;
  board = createFretboard(q('fgBoard'), {
    interactive: tappable,
    lefty: settings.lefty,
    onCellTap: tappable ? onCellTap : undefined,
  });
  boardLefty = settings.lefty;
  boardTappable = tappable;
}

// markers for the current round state
function roundMarkers() {
  const se = session;
  if (se.mode === 'name') {
    const m = { string: se.pos.string, fret: se.pos.fret, kind: 'root' };
    if (se.resolved) m.label = se.sym;         // reveal names the dot
    return [m];
  }
  // find mode: found cells stay green; once resolved, un-found answer
  // spots show as hollow accent rings
  return se.positions.map(p => ({
    string: p.string, fret: p.fret,
    kind: se.found.has(posKey(p.string, p.fret))
      ? 'good'
      : se.resolved ? 'ans' : null,
  })).filter(m => m.kind);
}

// ---------- round UI ----------

function renderRound() {
  const se = session;
  q('fgProgress').textContent = `${se.round}/${ROUNDS}`;
  const bar = q('fgRun')?.querySelector('.run-bar > i');
  if (bar) bar.style.width = `${(se.round - 1) / ROUNDS * 100}%`;
  paintScore();

  ensureBoard();
  board.setMarkers(roundMarkers());

  // find mode: the note name IS the prompt (no masking); name mode masks
  // the answer behind '?' until resolved — same convention as ear.js
  q('fgTitle').textContent =
    se.mode === 'name' && !se.resolved ? '?' : se.sym;
  q('fgPrompt').textContent = se.resolved ? ''
    : se.mode === 'name' ? s('whichNote')
    : se.sub === 'all' ? s('findAll') : s('tapIt');

  const tally = q('fgTally');
  const showTally = se.mode === 'find' && se.sub === 'all';
  tally.hidden = !showTally;
  if (showTally) tally.textContent = `${se.found.size}/${se.positions.length}`;

  const fb = q('fgFeedback');
  if (se.resolved) {
    const last = se.results[se.results.length - 1];
    fb.textContent = last && last.correct ? s('correct') : s('wrong');
    fb.className = 'feedback ' + (last && last.correct ? 'good' : 'bad');
  } else {
    fb.textContent = '';
    fb.className = 'feedback';
  }

  renderAnswers();
  q('fgGiveup').hidden = se.resolved;
  q('fgNext').hidden = !se.resolved;
}

function renderAnswers() {
  const el = q('fgAnswers');
  el.replaceChildren();
  el.classList.toggle('root-grid', session.mode === 'name');
  el.hidden = session.mode !== 'name';       // find mode answers on the board
  if (session.mode !== 'name') return;
  // quiz mode: no .sel toggling — markAnswers paints .right/.wrong
  rootPicker(el, -1, id => resolve(id === session.pc, id),
    { ...opts(), quiz: true });
  if (session.resolved) markAnswers();
}

function markAnswers() {
  q('fgAnswers').querySelectorAll('.chip').forEach(b => {
    b.disabled = true;
    if (Number(b.dataset.id) === session.pc) b.classList.add('right');
    else if (session.picked !== null && Number(b.dataset.id) === session.picked) {
      b.classList.add('wrong');
    }
  });
}

function paintScore() {
  const ok = session.results.filter(r => r.correct).length;
  q('fgScore').textContent = `✓${ok} ✗${session.results.length - ok}`;
  q('fgStreak').textContent = `${s('streak')} ${session.streak}`;
}

// find-mode tap input (interactive board → onCellTap)
function onCellTap(str, fret) {
  const se = session;
  if (!se || se.done || se.resolved || se.mode !== 'find') return;
  const key = posKey(str, fret);
  const hit = se.positions.some(p => posKey(p.string, p.fret) === key);
  if (se.found.has(key)) return;              // re-tap on a found cell: ignore
  if (!hit) {
    board.flashCell(str, fret, false);
    resolve(false, key);                      // any wrong tap fails the round
    return;
  }
  se.found.add(key);
  if (se.sub === 'all') {
    board.setMarkers(roundMarkers());
    const tally = q('fgTally');
    if (tally) tally.textContent = `${se.found.size}/${se.positions.length}`;
    board.flashCell(str, fret, true);
    if (allFound(se.pc, se.found, se.lo, se.hi)) resolve(true, key);
    return;
  }
  resolve(true, key);                         // single: one hit scores
}

function resolve(correct, picked) {
  const se = session;
  if (!se || se.done || se.resolved) return;
  se.resolved = true;
  se.picked = picked;
  const dt = performance.now() - se.t0;
  se.results.push({ sym: se.sym, correct, dt });
  recordAttempt(se.stat ?? se.sym, correct, dt);
  se.streak = correct ? se.streak + 1 : 0;
  se.best = Math.max(se.best, se.streak);
  paintScore();

  // reveal the board: found cells green, missed answers hollow accent
  board.setMarkers(roundMarkers());
  q('fgTitle').textContent = se.sym;
  q('fgPrompt').textContent = '';
  const fb = q('fgFeedback');
  fb.textContent = correct ? s('correct') : s('wrong');
  fb.className = 'feedback ' + (correct ? 'good' : 'bad');
  if (se.mode === 'name') markAnswers();
  q('fgGiveup').hidden = true;
  q('fgNext').hidden = false;
  if (correct) {
    // brief pause to read the board, then the next round deals itself
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(() => { advanceTimer = null; nextRound(); }, 1100);
  }
}

// ---------- finish ----------

function cleanup() {
  clearTimeout(advanceTimer); advanceTimer = null;
}

function endSession() {          // "끝내기" — discard the run, back to setup
  cleanup();
  if (session) session.done = true;
  showPanel('setup');
}

function finish() {
  session.done = true;
  cleanup();
  showPanel('result');
  const ok = session.results.filter(r => r.correct);
  const acc = session.results.length
    ? Math.round(100 * ok.length / session.results.length) : 0;
  const missed = session.results.filter(r => !r.correct).map(r => r.sym);
  q('fgResultBody').innerHTML =
    `${s('accuracy')}: ${acc}% (${ok.length}/${session.results.length})<br>` +
    `${s('bestStreak')}: ${session.best}<br>` +
    (missed.length
      ? `<span style="color:var(--bad)">${s('missed')}: ${missed.join(', ')}</span>`
      : '');
}

// ---------- wiring ----------

export function initFretGame() {
  body = document.getElementById('fretBody');
  render();
  onLangChange(render);          // rebuild labels; session state survives
  onSetting(k => {
    if (k !== 'lefty' && k !== 'flat') return;
    if (k === 'lefty') boardLefty = null;    // force a rebuild next render
    // a mid-run settings change re-spells the live round too
    if (session && !session.done && session.round > 0) {
      session.sym = pcName(session.pc, opts());
      session.stat = pcName(session.pc, { flat: settings.flat, lang: 'en' });
      renderRound();
    }
  });
}

// app.js calls this when leaving the tab: no mic/audio here, just stop
// the auto-advance timer so a resolved round can't fire while hidden.
export function suspendFretGame() {
  cleanup();
  if (session && !session.done) {
    session.done = true;
    showPanel('setup');
  }
}

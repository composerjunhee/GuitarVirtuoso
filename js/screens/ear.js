// Ear training screen. Six drills:
//   quality  — hear a chord, pick its quality (maj/min/7/maj7/m7/m7♭5/sus4…)
//   interval — hear two notes (asc/desc/harmonic), pick the interval
//   root     — hear a chord of a fixed quality, pick the root pc
//   prog     — hear a voice-led progression in a key, pick which preset it is
//   highlow  — hear two notes, pick higher/lower/same
//   play     — hear a chord, play the same one on a real guitar (mic-verified,
//              same ≥4-of-6 poll gate as practice.js)
// All DOM is built here inside #earBody; strings are a module-local {ko,en}
// table keyed by getLang() (i18n.js is shared and not ours to edit).

import { QUALITIES, QUALITY_ORDER, makeChord, chordSymbol, requiredPcs, bassPc }
  from '../theory/chords.js';
import { pcName, midiName, preferFlat } from '../theory/notes.js';
import { voicingsFor, voiceLead } from '../theory/voicings.js';
import { segRow, rootPicker, groupedChips, QUALITY_GROUPS, showBanner }
  from '../ui/components.js';
import { mic } from '../audio/input.js';
import { profileFromSpectrum, matchChord } from '../audio/chordDetect.js';
import { playVoicing, playNote } from '../audio/pluck.js';
import { audioCtx } from '../audio/engine.js';
import { t, getLang, onLangChange } from '../i18n.js';
import { settings, recordAttempt } from '../state.js';
import { PROGRESSIONS } from '../data/progressions.js';

const STR = {
  ko: {
    drill: '드릴',
    dQuality: '성격 맞히기',
    dInterval: '인터벌',
    dRoot: '루트 맞히기',
    dProg: '진행 듣기',
    dHighlow: '높낮이',
    dPlay: '따라 연주',
    pool: '코드 풀',
    fixedQ: '고정 코드',
    intPool: '인터벌 풀',
    dir: '방향',
    dirAsc: '상행',
    dirDesc: '하행',
    dirHarm: '화음',
    progPool: '진행 풀',
    gpPresets: '프리셋',
    ivgSteps: '2도',
    ivgThirds: '3도',
    ivg45: '4·5도',
    ivg6: '6도',
    ivg7: '7도',
    ivgOct: '옥타브',
    hintQuality: '코드를 듣고 성격(메이저/마이너/세븐스…)을 골라 보세요.',
    hintRoot: '고정된 성격의 코드를 듣고 루트를 골라 보세요.',
    hintPlay: '들은 코드를 기타로 똑같이 연주해 보세요. 마이크가 확인합니다.',
    hintInterval: '두 음을 듣고 사이의 인터벌을 골라 보세요.',
    hintProg: '코드 진행을 듣고 어떤 진행인지 골라 보세요.',
    hintHighlow: '두 음을 듣고 두 번째 음이 높은지 낮은지 골라 보세요.',
    start: '시작',
    end: '끝내기',
    replay: '다시 듣기',
    reveal: '정답 보기',
    next: '다음',
    whichQ: '어떤 성격일까요?',
    whichR: '루트는 무엇일까요?',
    whichInt: '어떤 인터벌일까요?',
    whichProg: '어떤 진행일까요?',
    whichHL: '두 번째 음은?',
    higher: '높음',
    lower: '낮음',
    same: '같음',
    playIt: '같은 코드를 연주하세요',
    listening: '듣는 중…',
    correct: '정답!',
    wrong: '오답',
    streak: '연속',
    results: '결과',
    accuracy: '정확도',
    bestStreak: '최고 연속',
    missed: '틀린 코드',
    again: '다시 하기',
    needTwo: '코드 풀에서 2개 이상 선택하세요.',
    needOne: '코드 풀에서 1개 이상 선택하세요.',
    needTwoG: '2개 이상 선택하세요.',
    micDenied: '마이크 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.',
    micFailed: '마이크를 열 수 없습니다.',
    deadString: '{n}번 줄',
  },
  en: {
    drill: 'Drill',
    dQuality: 'Quality ID',
    dInterval: 'Intervals',
    dRoot: 'Root ID',
    dProg: 'Progression ID',
    dHighlow: 'High–Low',
    dPlay: 'Play it back',
    pool: 'Chord pool',
    fixedQ: 'Fixed quality',
    intPool: 'Interval pool',
    dir: 'Direction',
    dirAsc: 'Ascending',
    dirDesc: 'Descending',
    dirHarm: 'Harmonic',
    progPool: 'Progression pool',
    gpPresets: 'Presets',
    ivgSteps: 'Steps',
    ivgThirds: 'Thirds',
    ivg45: '4th/5th',
    ivg6: '6ths',
    ivg7: '7ths',
    ivgOct: 'Octave',
    hintQuality: 'Hear a chord and pick its quality.',
    hintRoot: 'Hear a chord of a fixed quality and pick its root.',
    hintPlay: 'Hear a chord, then play the same one on your guitar — mic-verified.',
    hintInterval: 'Hear two notes and pick the interval between them.',
    hintProg: 'Hear a chord progression and pick which one it is.',
    hintHighlow: 'Hear two notes — is the second higher, lower, or the same?',
    start: 'Start',
    end: 'End',
    replay: 'Replay',
    reveal: 'Reveal',
    next: 'Next',
    whichQ: 'Which quality?',
    whichR: 'Which root?',
    whichInt: 'Which interval?',
    whichProg: 'Which progression?',
    whichHL: 'The second note is…',
    higher: 'Higher',
    lower: 'Lower',
    same: 'Same',
    playIt: 'Play the same chord',
    listening: 'Listening…',
    correct: 'Correct!',
    wrong: 'Wrong',
    streak: 'Streak',
    results: 'Results',
    accuracy: 'Accuracy',
    bestStreak: 'Best streak',
    missed: 'Missed',
    again: 'Again',
    needTwo: 'Pick at least 2 qualities for the pool.',
    needOne: 'Pick at least 1 quality for the pool.',
    needTwoG: 'Pick at least 2.',
    micDenied: 'Mic permission denied. Allow it in browser settings.',
    micFailed: 'Could not open the microphone.',
    deadString: 'string {n}',
  },
};

const ROUNDS = 10;
const DEFAULT_POOL = ['', 'm', '7', 'maj7', 'm7', 'm7b5', 'sus4'];

// Two-note drills stay inside the guitar band; roots sit in the comfy middle.
const EAR_LO = 40, EAR_HI = 76;   // E2..E5-ish playable band
const ROOT_LO = 45, ROOT_HI = 64; // A2..E4

// Interval pool: ids are semitone counts; labels are the usual symbols.
const INTERVALS = [
  { semis: 1, label: 'm2' }, { semis: 2, label: 'M2' },
  { semis: 3, label: 'm3' }, { semis: 4, label: 'M3' },
  { semis: 5, label: 'P4' }, { semis: 6, label: 'TT' }, { semis: 7, label: 'P5' },
  { semis: 8, label: 'm6' }, { semis: 9, label: 'M6' },
  { semis: 10, label: 'm7' }, { semis: 11, label: 'M7' },
  { semis: 12, label: 'P8' },
];
const INTERVAL_LABEL = Object.fromEntries(INTERVALS.map(i => [i.semis, i.label]));
const INTERVAL_GROUPS = [
  { key: 'ivgSteps', semis: [1, 2] },
  { key: 'ivgThirds', semis: [3, 4] },
  { key: 'ivg45', semis: [5, 6, 7] },
  { key: 'ivg6', semis: [8, 9] },
  { key: 'ivg7', semis: [10, 11] },
  { key: 'ivgOct', semis: [12] },
];
const DEFAULT_INT_POOL = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12];  // TT off by default

// Progression drill pool: preset ids from data/progressions.js (same ids
// the practice/strum pickers use). Standards excluded — too long to quiz.
const DEFAULT_PROG_POOL = ['I-V-vi-IV', 'vi-IV-I-V', 'I-vi-IV-V', 'ii-V-I'];
const PROG_GAP_MS = 900;

const HINTS = {
  quality: 'hintQuality', interval: 'hintInterval', root: 'hintRoot',
  prog: 'hintProg', highlow: 'hintHighlow', play: 'hintPlay',
};

const setup = {
  type: 'quality', pool: new Set(DEFAULT_POOL), fixedQ: '',
  intPool: new Set(DEFAULT_INT_POOL), intDir: 'asc',
  progPool: new Set(DEFAULT_PROG_POOL),
};

let body = null;                 // #earBody
let panel = 'setup';             // 'setup' | 'run' | 'result'
// {type, round, results, streak, best, sym, picked, resolved, done, t0,
//  lastKey, stat — plus per-drill payload:
//    chord drills: chord, voicing
//    highlow/interval: notes [midiA, midiB], semis (interval), ivDir, hl
//    prog: keyPc, prog, chords, seq}
let session = null;
let pollTimer = null;
let advanceTimer = null;
let voteRing = [];               // sliding window of recent match results
let seenOnset = 0;               // last onset timestamp the vote consumed

const s = k => STR[getLang()]?.[k] ?? STR.en[k] ?? k;
const opts = () => ({ flat: settings.flat, lang: getLang() });
const q = id => body.querySelector('#' + id);
const randInt = n => Math.floor(Math.random() * n);
const pick = arr => arr[randInt(arr.length)];

// ---------- DOM ----------

function render() {
  body.innerHTML = `
    <div id="earSetup" class="setup-card">
      <div class="chip-row"><span class="row-label" data-s="drill"></span>
        <span id="earDrill" class="seg"></span></div>
      <div id="earPoolRow"><span class="row-label" data-s="pool"></span>
        <div id="earPool"></div></div>
      <div id="earFixedRow" hidden>
        <span class="row-label" data-s="fixedQ"></span>
        <div id="earFixed"></div></div>
      <div id="earIntRow" hidden>
        <span class="row-label" data-s="intPool"></span>
        <div id="earIntPool"></div>
        <div class="chip-row" style="margin-top:6px">
          <span class="row-label" data-s="dir"></span>
          <span id="earIntDir" class="seg"></span></div></div>
      <div id="earProgRow" hidden>
        <span class="row-label" data-s="progPool"></span>
        <div id="earProgPool"></div></div>
      <p class="hint" id="earHint"></p>
      <button id="earStart" class="primary big" data-s="start"></button>
    </div>
    <div id="earRun" class="setup-card" hidden>
      <div class="run-top">
        <span id="earProgress" class="mono"></span>
        <span><span id="earScore" class="mono"></span>&ensp;<span id="earStreak" class="mono"></span></span>
        <button id="earEnd" class="ghost" data-s="end"></button>
      </div>
      <div class="run-bar" aria-hidden="true"><i></i></div>
      <div class="run-body">
        <h2 id="earReveal" class="chord-title huge"></h2>
        <div id="earPrompt" class="feedback"></div>
        <div id="earAnswers" class="chip-row wrap center"></div>
        <div id="earHeard" class="heard"></div>
        <div id="earFeedback" class="feedback"></div>
        <div class="row" style="justify-content:center">
          <button id="earReplay" class="ghost" data-s="replay"></button>
          <button id="earGiveup" class="ghost" data-s="reveal"></button>
          <button id="earNext" class="primary" data-s="next" hidden></button>
        </div>
      </div>
    </div>
    <div id="earResult" class="setup-card" hidden>
      <h2 data-s="results"></h2>
      <div id="earResultBody" style="font-family:var(--mono);font-size:14px;line-height:1.9"></div>
      <button id="earAgain" class="primary big" data-s="again"></button>
    </div>`;
  wire();
  fillStrings();
  renderSetupRows();
  if (session && !session.done && session.round > 0) renderRound();
  showPanel(panel);
}

function wire() {
  q('earStart').addEventListener('click', startSession);
  q('earEnd').addEventListener('click', endSession);
  q('earAgain').addEventListener('click', () => { session = null; showPanel('setup'); });
  q('earReplay').addEventListener('click', playCurrent);
  q('earNext').addEventListener('click', () => { clearTimeout(advanceTimer); nextRound(); });
  q('earGiveup').addEventListener('click', () => resolve(false, null));
}

function fillStrings() {
  body.querySelectorAll('[data-s]').forEach(el => { el.textContent = s(el.dataset.s); });
}

function showPanel(p) {
  panel = p;
  if (!body) return;
  q('earSetup').hidden = p !== 'setup';
  q('earRun').hidden = p !== 'run';
  q('earResult').hidden = p !== 'result';
}

// ---------- setup ----------

function renderSetupRows() {
  segRow(q('earDrill'), [
    { id: 'quality', label: s('dQuality') },
    { id: 'interval', label: s('dInterval') },
    { id: 'root', label: s('dRoot') },
    { id: 'prog', label: s('dProg') },
    { id: 'highlow', label: s('dHighlow') },
    { id: 'play', label: s('dPlay') },
  ], setup.type, id => { setup.type = id; renderSetupRows(); });

  // quality families, shared with the library picker
  const groups = QUALITY_GROUPS.map(g => ({
    label: t(g.key),
    items: g.qs.map(qk => ({ id: qk, label: QUALITIES[qk].label })),
  }));

  // chord pool: multi-select quality chips, grouped by family
  groupedChips(q('earPool'), groups, setup.pool,
    qk => { if (setup.pool.has(qk)) setup.pool.delete(qk); else setup.pool.add(qk); },
    { multi: true });

  // root drill: single fixed quality, same grouping
  groupedChips(q('earFixed'), groups, setup.fixedQ, id => { setup.fixedQ = id; });

  // interval drill: grouped semitone pool + direction seg
  const igroups = INTERVAL_GROUPS.map(g => ({
    label: s(g.key),
    items: g.semis.map(n => ({ id: n, label: INTERVAL_LABEL[n] })),
  }));
  groupedChips(q('earIntPool'), igroups, setup.intPool,
    n => { if (setup.intPool.has(n)) setup.intPool.delete(n); else setup.intPool.add(n); },
    { multi: true });
  segRow(q('earIntDir'), [
    { id: 'asc', label: s('dirAsc') },
    { id: 'desc', label: s('dirDesc') },
    { id: 'harm', label: s('dirHarm') },
  ], setup.intDir, id => { setup.intDir = id; });

  // prog drill: preset pool (ids shared with the practice/strum pickers)
  groupedChips(q('earProgPool'), [{
    label: s('gpPresets'),
    items: PROGRESSIONS.map(p => ({ id: p.id, label: p.label })),
  }], setup.progPool,
    id => { if (setup.progPool.has(id)) setup.progPool.delete(id); else setup.progPool.add(id); },
    { multi: true });

  q('earPoolRow').hidden = setup.type !== 'quality' && setup.type !== 'play';
  q('earFixedRow').hidden = setup.type !== 'root';
  q('earIntRow').hidden = setup.type !== 'interval';
  q('earProgRow').hidden = setup.type !== 'prog';
  q('earHint').textContent = s(HINTS[setup.type]);
}

// ---------- session ----------

async function startSession() {
  audioCtx();                    // create/resume inside the click gesture
  if (setup.type === 'quality' && setup.pool.size < 2) {
    showBanner(s('needTwo'), 4000, 'info'); return;
  }
  if (setup.type === 'play' && setup.pool.size < 1) {
    showBanner(s('needOne'), 4000, 'info'); return;
  }
  if (setup.type === 'interval' && setup.intPool.size < 2) {
    showBanner(s('needTwoG'), 4000, 'info'); return;
  }
  if (setup.type === 'prog' && setup.progPool.size < 2) {
    showBanner(s('needTwoG'), 4000, 'info'); return;
  }
  if (setup.type === 'play') {
    try { await mic.start(); }
    catch (e) {
      showBanner(e && e.name === 'NotAllowedError' ? s('micDenied') : s('micFailed'));
      return;
    }
    // user may have left the tab while getUserMedia was pending
    if (!document.getElementById('screen-ear').classList.contains('active')) {
      mic.stop(); return;
    }
  }
  session = {
    type: setup.type, round: 0, results: [], streak: 0, best: 0,
    chord: null, voicing: null, sym: '', picked: null, resolved: false,
    done: false, t0: 0, lastKey: null, stat: null,
    notes: null, semis: null, ivDir: setup.intDir, hl: null,
    keyPc: null, prog: null, chords: null, seq: null,
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
  session.stat = null;
  voteRing = [];
  pickRound();
  session.t0 = performance.now();
  renderRound();
  playCurrent();
  if (session.type === 'play') startPoll();
}

function pickRound() {
  const ty = session.type;
  if (ty === 'highlow') return pickHighlow();
  if (ty === 'interval') return pickInterval();
  if (ty === 'prog') return pickProg();
  session.chord = pickChord();
  // the reference shape doubles as the mic template in the play drill
  session.voicing = voicingsFor(session.chord)[0] || null;
  // chord symbols stay Latin in every UI language (same convention as
  // library.js / the practice deck keys)
  session.sym = chordSymbol(session.chord, { flat: settings.flat });
}

function pickChord() {
  let chord, key;
  do {
    const qk = session.type === 'root' ? setup.fixedQ : pick([...setup.pool]);
    chord = makeChord(randInt(12), qk);
    key = `${chord.root}|${qk}`;
  } while (key === session.lastKey);       // no immediate repeats
  session.lastKey = key;
  return chord;
}

// ---- pure drill math (exported so the selftest can exercise it w/o DOM) ----

export function clampMidi(m, lo = EAR_LO, hi = EAR_HI) {
  return Math.min(hi, Math.max(lo, m));
}

// highlow answer id for a note pair: 'higher' | 'lower' | 'same'
export function hlAnswerId(root, second) {
  return second > root ? 'higher' : second < root ? 'lower' : 'same';
}

// interval drill: second midi for a direction ('harm' reveals the asc pair)
export function intervalSecond(root, semis, dir) {
  return dir === 'desc' ? root - semis : root + semis;
}

// prog drill: resolve a preset's degrees in a key — the same recipe
// strum.js/practice.js use (root = key + off; makeChord mods into 0..11).
export function progChords(keyPc, prog) {
  return prog.bars.map(b => makeChord(keyPc + b.off, b.q));
}

function pickHighlow() {
  let root, second, key, guard = 0;
  do {
    root = ROOT_LO + randInt(ROOT_HI - ROOT_LO + 1);   // 45..64
    second = clampMidi(root + randInt(25) - 12);       // delta ∈ -12..+12
    key = hlAnswerId(root, second);
  } while (key === session.lastKey && ++guard < 60);   // no answer repeats
  session.lastKey = key;
  session.notes = [root, second];
  session.hl = key;
  // stat:false → resolve() skips recordAttempt for this drill; the pair
  // label "E → G" was only noise in the stats list
  session.stat = false;
  session.sym = `${midiName(root, opts())} → ${midiName(second, opts())}`;
}

function pickInterval() {
  const pool = [...setup.intPool];
  let root, semis, second, key, guard = 0;
  do {
    root = ROOT_LO + randInt(ROOT_HI - ROOT_LO + 1);
    semis = pick(pool);
    second = intervalSecond(root, semis, session.ivDir);
    key = String(semis);
  } while ((second < EAR_LO || second > EAR_HI || key === session.lastKey)
    && ++guard < 200);
  second = clampMidi(second);
  session.lastKey = key;
  session.notes = [root, second];
  session.semis = semis;
  const sym = INTERVAL_LABEL[semis];
  session.stat = 'iv:' + sym;            // stats key = "iv:M3", "iv:P5", …
  session.sym = session.ivDir === 'harm'
    ? `${midiName(root, opts())} + ${midiName(second, opts())} (${sym})`
    : `${midiName(root, opts())} → ${midiName(second, opts())} (${sym})`;
}

function pickProg() {
  const pool = PROGRESSIONS.filter(p => setup.progPool.has(p.id));
  let prog, keyPc, guard = 0;
  do {
    prog = pick(pool);
    keyPc = randInt(12);
  } while (prog.id === session.lastKey && ++guard < 60);
  session.lastKey = prog.id;
  session.prog = prog;
  session.keyPc = keyPc;
  session.chords = progChords(keyPc, prog);
  // voice-lead up front like strum.js; a null slot falls back to the
  // chord's top voicing so the sequence never goes silent
  const led = voiceLead(session.chords);
  session.seq = session.chords.map((c, i) => led[i] ?? voicingsFor(c)[0] ?? null);
  session.stat = 'prog:' + prog.label;
  session.sym =
    `${pcName(keyPc, { flat: preferFlat(keyPc), lang: getLang() })} — ${prog.label}`;
}

// Strum each voicing gapMs apart. Everything is scheduled on the
// AudioContext clock (playVoicing `at`), so there are no JS timers for
// suspendEar to chase — a cut-off sequence just rings out its last chord.
function playSequence(voicings, gapMs = PROG_GAP_MS) {
  voicings.forEach((v, i) => {
    if (v) playVoicing(v, { at: i * gapMs / 1000, dur: 1.4 });
  });
}

function playCurrent() {
  if (!session || session.done) return;
  const ty = session.type;
  if (ty === 'highlow' || ty === 'interval') {
    const pair = session.notes;
    if (!pair) return;
    playNote(pair[0]);
    // harmonic = both at once (a 25 ms stagger keeps it a dyad, not a flam);
    // melodic pairs land 0.7 s apart
    playNote(pair[1], { at: ty === 'interval' && session.ivDir === 'harm' ? 0.025 : 0.7 });
    return;
  }
  if (ty === 'prog') { playSequence(session.seq || []); return; }
  if (!session.chord) return;
  const v = session.voicing || voicingsFor(session.chord)[0];
  if (v) playVoicing(v);
}

// ---------- round UI ----------

function promptKey() {
  return {
    quality: 'whichQ', interval: 'whichInt', root: 'whichR',
    prog: 'whichProg', highlow: 'whichHL', play: 'playIt',
  }[session.type];
}

function masked() {
  // what fills the big title before the answer is revealed
  return session.type === 'root'
    ? '?' + session.chord.quality.replace('b5', '♭5')
    : '?';
}

function want() {
  switch (session.type) {
    case 'quality': return session.chord.quality;
    case 'root': return session.chord.root;
    case 'highlow': return session.hl;
    case 'interval': return String(session.semis);
    case 'prog': return session.prog.id;
    default: return '';
  }
}

function renderRound() {
  const se = session;
  q('earProgress').textContent = `${se.round}/${ROUNDS}`;
  const bar = q('earRun')?.querySelector('.run-bar > i');
  if (bar) bar.style.width = `${(se.round - 1) / ROUNDS * 100}%`;
  paintScore();
  q('earReveal').textContent = se.resolved ? se.sym : masked();
  q('earPrompt').textContent = se.resolved ? '' : s(promptKey());
  const fb = q('earFeedback');
  if (se.resolved) {
    const last = se.results[se.results.length - 1];
    fb.textContent = last && last.correct ? s('correct') : s('wrong');
    fb.className = 'feedback ' + (last && last.correct ? 'good' : 'bad');
  } else {
    fb.textContent = se.type === 'play' ? s('listening') : '';
    fb.className = 'feedback';
  }
  q('earHeard').replaceChildren();
  q('earGiveup').hidden = se.resolved;
  q('earNext').hidden = !se.resolved;
  renderAnswers();
}

function renderAnswers() {
  const el = q('earAnswers');
  el.replaceChildren();
  // root answers share the picker's two-row grid; every other drill gets a
  // uniform tile grid (.ans-grid). The classes must be removed explicitly —
  // they live on the container, not the chips, so they survive
  // replaceChildren().
  const ty = session.type;
  el.classList.toggle('root-grid', ty === 'root');
  el.classList.toggle('ans-grid', ty !== 'root' && ty !== 'play');
  if (ty === 'play') return;             // mic answers, not chips
  if (ty === 'root') {
    // quiz mode: no .sel toggling — markAnswers paints .right/.wrong
    rootPicker(el, -1, id => resolve(id === want(), id),
      { ...opts(), quiz: true });
    if (session.resolved) markAnswers();
    return;
  }
  let items;
  if (ty === 'quality') {
    items = QUALITY_ORDER.filter(k => setup.pool.has(k))
      .map(k => ({ id: k, label: QUALITIES[k].label }));
  } else if (ty === 'interval') {
    items = INTERVALS.filter(iv => setup.intPool.has(iv.semis))
      .map(iv => ({ id: String(iv.semis), label: iv.label }));
  } else if (ty === 'prog') {
    items = PROGRESSIONS.filter(p => setup.progPool.has(p.id))
      .map(p => ({ id: p.id, label: p.label }));
  } else {                                // highlow: 3 tiles
    items = ['higher', 'lower', 'same'].map(id => ({ id, label: s(id) }));
  }
  const w = String(want());
  for (const it of items) {
    const b = document.createElement('button');
    b.className = 'chip';
    b.dataset.id = it.id;
    b.textContent = it.label;
    b.disabled = session.resolved;
    b.addEventListener('click', () => resolve(it.id === w, it.id));
    el.append(b);
  }
  if (session.resolved) markAnswers();
}

// after resolve: .chip.right = correct answer, .chip.wrong = the bad pick
function markAnswers() {
  const w = String(want());
  q('earAnswers').querySelectorAll('.chip').forEach(b => {
    b.disabled = true;
    if (b.dataset.id === w) b.classList.add('right');
    else if (session.picked !== null && b.dataset.id === String(session.picked)) {
      b.classList.add('wrong');
    }
  });
}

function paintScore() {
  const ok = session.results.filter(r => r.correct).length;
  q('earScore').textContent = `✓${ok} ✗${session.results.length - ok}`;
  q('earStreak').textContent = `${s('streak')} ${session.streak}`;
}

function resolve(correct, picked) {
  const se = session;
  if (!se || se.done || se.resolved) return;
  se.resolved = true;
  se.picked = picked;
  stopPoll();
  const dt = performance.now() - se.t0;
  se.results.push({ sym: se.sym, correct, dt });
  if (se.stat !== false) recordAttempt(se.stat ?? se.sym, correct, dt);
  se.streak = correct ? se.streak + 1 : 0;
  se.best = Math.max(se.best, se.streak);
  paintScore();
  q('earReveal').textContent = se.sym;
  q('earPrompt').textContent = '';
  const fb = q('earFeedback');
  fb.textContent = correct ? s('correct') : s('wrong');
  fb.className = 'feedback ' + (correct ? 'good' : 'bad');
  if (se.type !== 'play') markAnswers();
  q('earGiveup').hidden = true;
  q('earNext').hidden = false;
  if (correct) {
    // brief pause to read the answer, then the next chord plays itself
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(() => { advanceTimer = null; nextRound(); }, 1100);
  }
}

// ---------- mic verification (play drill) ----------

// Poll the spectrum ~14×/s; the chord passes when ≥4 of the last 6 frames
// verify — same vote gate as practice.js, tolerates noisy strum frames.
// Same two extra gates too: voicing template per frame (≤1 dead string) and
// votes only count within ~1.8 s of a pick attack, so leftover ring from
// the revealed answer can't score the next round.
function startPoll() {
  stopPoll();
  pollTimer = setInterval(() => {
    if (!session || session.done || session.resolved) return;
    const spec = mic.spectrum();
    if (!spec) return;
    const prof = profileFromSpectrum(spec.db, spec.binHz,
      requiredPcs(session.chord), session.voicing);
    const res = matchChord(prof, session.chord);
    paintHeard(res);
    // a fresh attack re-arms the vote: drop whatever the ring still holds
    if (mic.lastOnset !== seenOnset) { seenOnset = mic.lastOnset; voteRing = []; }
    const fresh = seenOnset > 0 && performance.now() - seenOnset < 1800;
    const frameOk = res.ok && res.stringsOk !== false;
    voteRing.push(frameOk);
    if (voteRing.length > 6) voteRing.shift();
    if (fresh && frameOk && voteRing.filter(Boolean).length >= 4) resolve(true, null);
  }, 70);
}

function stopPoll() { clearInterval(pollTimer); pollTimer = null; }

function paintHeard(res) {
  const el = q('earHeard');
  if (!el || !session) return;
  el.replaceChildren();
  for (const pc of requiredPcs(session.chord)) {
    const sp = document.createElement('span');
    sp.className = res.heard.has(pc) ? 'hit' : 'miss';
    sp.textContent = pcName(pc, opts()) + ' ';
    el.append(sp);
  }
  if (res.bassPc != null && res.bassPc !== bassPc(session.chord)) {
    const sp = document.createElement('span');
    sp.className = 'miss';
    sp.textContent = `bass:${pcName(res.bassPc, opts())}`;
    el.append(sp);
  }
  // voicing template: name the strings that should ring but don't
  if (res.strings) {
    for (const st of res.strings) {
      if (st.ok) continue;
      const sp = document.createElement('span');
      sp.className = 'miss';
      sp.textContent = s('deadString').replace('{n}', st.s + 1) +
        (st.heard != null ? ':' + pcName(st.heard, opts()) : '');
      el.append(sp);
    }
  }
}

// ---------- finish ----------

function cleanupAudio() {
  stopPoll();
  clearTimeout(advanceTimer); advanceTimer = null;
  if (mic.running) mic.stop();
}

function endSession() {          // "끝내기" — discard the run, back to setup
  cleanupAudio();
  if (session) session.done = true;
  showPanel('setup');
}

function finish() {
  session.done = true;
  cleanupAudio();
  showPanel('result');
  const ok = session.results.filter(r => r.correct);
  const acc = session.results.length
    ? Math.round(100 * ok.length / session.results.length) : 0;
  const missed = session.results.filter(r => !r.correct).map(r => r.sym);
  q('earResultBody').innerHTML =
    `${s('accuracy')}: ${acc}% (${ok.length}/${session.results.length})<br>` +
    `${s('bestStreak')}: ${session.best}<br>` +
    (missed.length
      ? `<span style="color:var(--bad)">${s('missed')}: ${missed.join(', ')}</span>`
      : '');
}

// ---------- wiring ----------

export function initEar() {
  body = document.getElementById('earBody');
  render();
  onLangChange(render);          // rebuild labels; session state survives
}

// app.js calls this when leaving the ear tab: release the mic and every
// scheduled timer so nothing plays or polls in the background.
export function suspendEar() {
  cleanupAudio();
  if (session && !session.done) {
    session.done = true;
    showPanel('setup');
  }
}

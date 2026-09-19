// Strum pattern trainer. Pick a D/U/rest pattern + chord + tempo; a lookahead
// metronome drives an 8th-note slot highlighter (onBeat fires ~120ms EARLY on
// the audio clock, so all visuals are deferred with setTimeout). The
// metronome's first bar is a count-in — clicks plus a big flashing number,
// mic unscored — and session bar 0 opens on the next bar line. With mic
// check off, each bar starts with a synthesized reference strum to copy; with
// mic check on the reference is muted (the mic would hear it and self-pass)
// and a bar passes only when the chord verifies AND ≥3/4 of the sounded
// slots got a pick attack near their grid position (mic.lastOnset tracking).
// All DOM is built here inside #strumBody; strings are a module-local {ko,en}
// table like ear.js.

import { QUALITIES, makeChord, chordSymbol, requiredPcs }
  from '../theory/chords.js';
import { voicingsFor, voiceLead } from '../theory/voicings.js';
import { preferFlat, pcName } from '../theory/notes.js';
import { PROGRESSIONS } from '../data/progressions.js';
import { STANDARDS, GENRES } from '../data/standards.js';
import { renderChordDiagram } from '../ui/chordDiagram.js';
import { chipRow, segRow, rootPicker, showBanner } from '../ui/components.js';
import { Metronome } from '../audio/metronome.js';
import { playVoicing } from '../audio/pluck.js';
import { audioCtx } from '../audio/engine.js';
import { mic } from '../audio/input.js';
import { profileFromSpectrum, matchChord } from '../audio/chordDetect.js';
import { getLang, onLangChange } from '../i18n.js';
import { settings, recordAttempt } from '../state.js';

const STR = {
  ko: {
    pattern: '패턴',
    mode: '모드',
    modeOne: '한 코드',
    modeProg: '진행',
    key: '키',
    prog: '진행',
    root: '루트',
    quality: '성격',
    mic: '마이크',
    micOn: '확인',
    micOff: '끄기',
    hint: '패턴·코드·템포를 고르고 시작하세요. 마이크 확인을 끄면 매 마디 첫 박에 참고 스트럼이 들립니다.',
    start: '시작',
    end: '끝내기',
    again: '다시 하기',
    results: '결과',
    bars: '마디',
    passed: '통과',
    listening: '듣는 중…',
    clean: '깔끔해요!',
    missed: '코드가 안 들렸어요',
    timing: '타이밍이 빗나갔어요',
    strumAlong: '패턴을 따라 쳐 보세요',
    micDenied: '마이크 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.',
    micFailed: '마이크를 열 수 없습니다.',
    progPresets: '프리셋',
    standards: '재즈 스탠다드',
    search: '곡/진행 검색…',
    noMatch: '결과 없음',
    newPat: '+ 새 패턴',
    customBadge: '커스텀',
    meter: '박자',
    patNamePh: '패턴 이름',
    myPattern: '내 패턴',
    save: '저장',
    cancel: '취소',
    del: '삭제',
    patSaved: '패턴 저장됨',
    modeRhythm: '리듬',
    input: '입력',
    inputMic: '마이크',
    inputTap: '탭 패드',
    level: '레벨',
    rhHint: '레벨·입력·템포를 고르고 시작하세요. 카운트인 후 칸에 표시된 박자를 맞춰 연주합니다. Lv1은 8분음표, Lv2는 쉼표·엇박, Lv3은 16분·싱코페이션을 섞습니다.',
    tapPad: '탭',
    tapAlong: '표시된 박자에 맞춰 치세요',
    rhHit: '정확',
    rhLate: '늦음',
    rhEarly: '빠름',
    rhMiss: '미스',
    rhExtra: '추가 타격',
    rhHits: '히트',
    rhAvg: '평균',
    sumAcc: '정확도',
    sumAvg: '평균 오차',
    sumBest: '최고 연속 마디',
  },
  en: {
    pattern: 'Pattern',
    mode: 'Mode',
    modeOne: 'One chord',
    modeProg: 'Progression',
    key: 'Key',
    prog: 'Progression',
    root: 'Root',
    quality: 'Quality',
    mic: 'Mic check',
    micOn: 'On',
    micOff: 'Off',
    hint: 'Pick a pattern, chord, and tempo. Turn mic check off to hear a reference strum on beat 1 of each bar.',
    start: 'Start',
    end: 'End',
    again: 'Again',
    results: 'Results',
    bars: 'Bars',
    passed: 'Passed',
    listening: 'Listening…',
    clean: 'Clean!',
    missed: 'Chord not heard',
    timing: 'Timing was off',
    strumAlong: 'Strum along with the pattern',
    micDenied: 'Mic permission denied. Allow it in browser settings.',
    micFailed: 'Could not open the microphone.',
    progPresets: 'Presets',
    standards: 'Jazz standards',
    search: 'Search songs…',
    noMatch: 'No matches',
    newPat: '+ New',
    customBadge: 'Custom',
    meter: 'Meter',
    patNamePh: 'Pattern name',
    myPattern: 'My pattern',
    save: 'Save',
    cancel: 'Cancel',
    del: 'Delete',
    patSaved: 'Pattern saved',
    modeRhythm: 'Rhythm',
    input: 'Input',
    inputMic: 'Mic',
    inputTap: 'Tap pad',
    level: 'Level',
    rhHint: 'Pick a level, input, and tempo. After the count-in, hit every marked slot on time. Lv1 is 8th notes, Lv2 adds rests/off-beats, Lv3 adds 16ths and syncopation.',
    tapPad: 'TAP',
    tapAlong: 'Play the marked beats on time',
    rhHit: 'on time',
    rhLate: 'late',
    rhEarly: 'early',
    rhMiss: 'miss',
    rhExtra: 'extra tap',
    rhHits: 'hits',
    rhAvg: 'avg',
    sumAcc: 'Accuracy',
    sumAvg: 'Avg error',
    sumBest: 'Best bar streak',
  },
};

// A bar = 8th-note slots, each 'D' | 'U' | '.' (rest). `beats` is the
// metronome's beats-per-bar, so slots.length === beats * 2. Ordered
// roughly by density — sparse/laid-back cards first, full-8th drivers last.
// Exported for the selftest's grid-contract assertions.
export const PATTERNS = [
  { id: 'ballad',   beats: 4, slots: 'D...DU.U', name: { ko: '발라드',      en: 'Ballad' } },
  { id: 'campfire', beats: 4, slots: 'D..U.U.U', name: { ko: '캠프파이어',  en: 'Campfire' } },
  { id: 'waltz',    beats: 3, slots: 'D.U.U.',   name: { ko: '왈츠 3/4',    en: 'Waltz 3/4' } },
  { id: 'folk',     beats: 4, slots: 'D.DU.UDU', name: { ko: '포크',        en: 'Folk' } },
  { id: 'country',  beats: 4, slots: 'D.U.DU.U', name: { ko: '컨트리',      en: 'Country' } },
  { id: 'poprock',  beats: 4, slots: 'D.UD.DU.', name: { ko: '팝록',        en: 'Pop/Rock' } },
  { id: 'push',     beats: 4, slots: 'D..DU.U.', name: { ko: '싱코페이션',  en: 'Syncopated Push' } },
  { id: 'rumba',    beats: 4, slots: 'D.U.UD.U', name: { ko: '룸바',        en: 'Rumba' } },
  { id: 'soul',     beats: 4, slots: 'D.D.U.UD', name: { ko: '소울',        en: 'Soul' } },
  { id: 'off',      beats: 4, slots: '.U.U.U.U', name: { ko: '오프비트',    en: 'Offbeats' } },
  { id: 'gallop',   beats: 4, slots: 'DU.UDU.U', name: { ko: '갤럽',        en: 'Gallop' } },
  { id: 'drive',    beats: 4, slots: 'DUDUDUDU', name: { ko: '드라이브',    en: 'Driving 8ths' } },
];

const COMMON_Q = ['', 'm', '7', 'maj7', 'm7', 'm7b5', 'sus2', 'sus4'];

// ---------- rhythm reading (mode 'rhythm') ----------
// A bar of 4/4 as 16 sixteenth-note slots: true = attack expected. The
// generator is pure and rng-seeded so the selftest can pin the contract.
//   Lv1: 8th-note grid only (even slots), slot 0 on, ~60% density
//   Lv2: + the off-16ths can sound (25%) — rests and off-beat attacks
//   Lv3: all 16 slots weighted (beats .7 / 8ths .45 / 16ths .3) plus a
//        guaranteed syncopation: an odd 'a'-slot attack leading into a
//        silent beat (slots 3|7|11 → rest on the next beat)
export const RH_BARS = 8;              // fixed session length, bars are the rounds
const RH_WIN = 200;                    // an attack matches an expected slot ±ms
const RH_HIT = 100;                    // ≤ this offset is a clean hit

export function genRhythm(level = 1, rng = Math.random) {
  const g = new Array(16).fill(false);
  g[0] = true;                          // downbeat always sounds
  const fixed = new Set();              // syncopation anchor — clamp may not touch
  if (level >= 3) {
    const b = 4 * (1 + Math.floor(rng() * 3));   // anticipated beat: 2, 3 or 4
    g[b - 1] = true; fixed.add(b - 1);           // attack on the 'a' before it
    g[b] = false;    fixed.add(b);               // …and the beat itself rests
  }
  const p = i => level >= 3
    ? (i % 4 === 0 ? 0.7 : i % 2 === 0 ? 0.45 : 0.3)
    : (i % 2 === 0 ? 0.6 : 0.25);
  for (let i = 1; i < 16; i++) {
    if (fixed.has(i)) continue;
    if (level === 1 && i % 2) continue;          // Lv1 stays on the 8th grid
    g[i] = rng() < p(i);
  }
  // density bounds per level: Lv1 4–8, Lv2 5–11, Lv3 6–12. Fill/thin pick
  // random eligible slots so a seeded rng stays deterministic.
  const [lo, hi] = level >= 3 ? [6, 12] : level === 2 ? [5, 11] : [4, 8];
  const n = () => g.reduce((a, x) => a + (x ? 1 : 0), 0);
  const fillable = [];
  for (let i = 1; i < 16; i++) {
    if (g[i] || fixed.has(i) || (level === 1 && i % 2)) continue;
    fillable.push(i);
  }
  while (n() < lo && fillable.length)
    g[fillable.splice(Math.floor(rng() * fillable.length), 1)[0]] = true;
  const thinnable = [];
  for (let i = 1; i < 16; i++) if (g[i] && !fixed.has(i)) thinnable.push(i);
  while (n() > hi && thinnable.length)
    g[thinnable.splice(Math.floor(rng() * thinnable.length), 1)[0]] = false;
  return g;
}

const setup = {
  pattern: 'folk', mode: 'one',      // 'one' | 'prog' | 'rhythm'
  root: 7, quality: '',              // one-chord mode target
  progKey: 0, prog: PROGRESSIONS[0].id,   // progression mode: key root + preset id
  bpm: 80, micCheck: false,
  rhInput: 'tap',                    // 'tap' = tap pad, 'mic' = pick attacks
  rhLevel: 1, rhBpm: 70,             // rhythm-drill options (bpm 40–120)
};

let body = null;                 // #strumBody
let panel = 'setup';             // 'setup' | 'run' | 'result'
let session = null;              // see startSession() for fields
let starting = false;            // guards the async mic.start() in startSession
let metro = null;
let slotEls = [];
let rhCellEls = [];              // 16 .rh-cell elements for the current bar
let rhCurSlot = -1;              // playhead position in rhCellEls
let timers = new Set();          // pending visual-sync timeouts
let pollTimer = null;
let voteRing = [];               // sliding window of recent match results

const LS_PATS = 'gt.patterns';       // saved custom patterns (progBuilder pattern)

const s = k => STR[getLang()]?.[k] ?? STR.en[k] ?? k;
const q = id => body.querySelector('#' + id);

let patDraft = null;                 // editor draft {beats, slots, name} or null

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// defer a visual to an audio-clock time, tracked for cleanup
function later(fn, ms) {
  const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
  timers.add(id);
}

// ---------- custom patterns (gt.patterns) ----------

// Same one-store-per-feature pattern as progBuilder (gt.progs) and songs
// (gt.songs): entries keep the PATTERNS shape so the session only ever
// reads pattern.beats/pattern.slots — no other plumbing needed. `name` is
// the user's own label, stored under both langs like a chart's `label`.
//   [{ id:'pat-<ts>', beats:3|4, slots:'D/U/.', name:{ko,en} }]
// Exported for the selftest's validator assertions.
export function validPattern(p) {
  return !!p && typeof p.id === 'string' &&
    (p.beats === 3 || p.beats === 4) &&
    typeof p.slots === 'string' && /^[DU.]+$/.test(p.slots) &&
    p.slots.length === p.beats * 2 &&
    !!p.name && typeof p.name.ko === 'string' && typeof p.name.en === 'string';
}

export function getCustomPatterns() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_PATS));
    if (!Array.isArray(raw)) return [];
    const seen = new Set();           // dedupe by id, like registerCustomSongs
    return raw.filter(p => {
      if (!validPattern(p) || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  } catch {
    return [];
  }
}

function savePatterns(list) {
  try {
    localStorage.setItem(LS_PATS, JSON.stringify(list));
    return true;
  } catch {
    return false;                     // storage full/blocked — stay put
  }
}

// presets first, then the user's own cards
function allPatterns() { return [...PATTERNS, ...getCustomPatterns()]; }

// ---------- DOM ----------

function render() {
  body.innerHTML = `
    <div id="stSetup" class="setup-card">
      <div class="chip-row"><span class="row-label" data-s="mode"></span>
        <span id="stMode" class="seg"></span></div>
      <div id="stPatRow">
        <div class="pat-head"><span class="picker-label" data-s="pattern"></span>
          <button id="stPatNew" class="chip pat-new" data-s="newPat"></button></div>
        <div id="stPat" class="pat-grid"></div>
        <div id="stPatEditor" class="pat-editor" hidden></div></div>
      <div id="stOneOpts">
        <div class="chip-row"><span class="row-label" data-s="root"></span>
          <span id="stRoot" class="chip-row"></span></div>
        <div class="chip-row"><span class="row-label" data-s="quality"></span>
          <span id="stQual" class="chip-row wrap"></span></div>
      </div>
      <div id="stProgOpts" hidden>
        <div class="chip-row"><input id="stProgSearch" type="search" class="gt-search"></div>
        <div class="chip-row"><span class="row-label" data-s="key"></span>
          <span id="stKey" class="chip-row"></span></div>
        <div class="chip-row"><span class="row-label" data-s="prog"></span>
          <select id="stProg" class="gt-select"></select></div>
      </div>
      <div id="stRhOpts" hidden>
        <div class="chip-row"><span class="row-label" data-s="input"></span>
          <span id="stRhInput" class="seg"></span></div>
        <div class="chip-row"><span class="row-label" data-s="level"></span>
          <span id="stRhLevel" class="seg"></span></div>
        <div class="chip-row bpm-row"><span class="row-label">BPM</span>
          <button id="stRhBpmDown" class="chip bpm-step" aria-label="BPM down">−</button>
          <input id="stRhBpm" type="range" min="40" max="120" value="${setup.rhBpm}">
          <button id="stRhBpmUp" class="chip bpm-step" aria-label="BPM up">+</button>
          <span id="stRhBpmVal" class="mono">${setup.rhBpm}</span></div>
      </div>
      <div class="chip-row bpm-row" id="stBpmRowSetup"><span class="row-label">BPM</span>
        <button id="stBpmDown" class="chip bpm-step" aria-label="BPM down">−</button>
        <input id="stBpm" type="range" min="40" max="160" value="${setup.bpm}">
        <button id="stBpmUp" class="chip bpm-step" aria-label="BPM up">+</button>
        <span id="stBpmVal" class="mono">${setup.bpm}</span></div>
      <div class="chip-row" id="stMicRow"><span class="row-label" data-s="mic"></span>
        <span id="stMic" class="seg"></span></div>
      <p class="hint" id="stHint" data-s="hint"></p>
      <button id="stStart" class="primary big" data-s="start"></button>
    </div>
    <div id="stRun" class="setup-card" hidden>
      <div id="stCountin" class="countin" hidden aria-hidden="true"></div>
      <div class="run-top">
        <span id="stBars" class="mono"></span>
        <span id="stScore" class="mono"></span>
        <button id="stEnd" class="ghost" data-s="end"></button>
      </div>
      <div class="run-bar" aria-hidden="true"><i></i></div>
      <div class="run-body">
        <div class="chord-line" id="stChordLine">
          <h2 id="stChord" class="chord-title"></h2>
          <span id="stMaps" class="beat-maps" hidden>
            <span id="stBeat" class="beat-strip" aria-hidden="true"></span>
            <span class="beat-sep" aria-hidden="true"></span>
            <span id="stBeatB" class="beat-strip future" aria-hidden="true"></span>
          </span>
        </div>
        <div id="stPatView" class="strum-pat"></div>
        <div id="stRhRun" hidden>
          <div class="rh-beats" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span></div>
          <div id="stRhGrid" class="rh-grid" aria-hidden="true"></div>
          <div id="stRhNext" class="rh-grid rh-next" aria-hidden="true"></div>
          <button id="stRhPad" class="tap-pad" data-s="tapPad" hidden></button>
        </div>
        <div id="stDiagram" class="chord-diagram"></div>
        <div id="stHist" class="strum-hist"></div>
        <div id="stFeedback" class="feedback"></div>
        <div class="chip-row bpm-row" id="stBpmRow" style="justify-content:center">
          <span class="row-label">BPM</span>
          <button id="stBpmLiveDown" class="chip bpm-step" aria-label="BPM down">−</button>
          <input id="stBpmLive" type="range" min="40" max="160" value="${setup.bpm}" style="max-width:220px">
          <button id="stBpmLiveUp" class="chip bpm-step" aria-label="BPM up">+</button>
          <span id="stBpmLiveVal" class="mono">${setup.bpm}</span>
        </div>
      </div>
    </div>
    <div id="stResult" class="setup-card" hidden>
      <h2 data-s="results"></h2>
      <div id="stResultBody" style="font-family:var(--mono);font-size:14px;line-height:1.9"></div>
      <button id="stAgain" class="primary big" data-s="again"></button>
    </div>`;
  wire();
  fillStrings();
  renderSetupRows();
  if (session && !session.done) paintRun();
  else if (session && session.done && session.bars) paintResult();
  showPanel(panel);
}

// one bpm setter drives both sliders (setup + live) and their steppers
function setBpm(v) {
  setup.bpm = Math.min(160, Math.max(40, Math.round(v)));
  for (const [sl, val] of [['stBpm', 'stBpmVal'], ['stBpmLive', 'stBpmLiveVal']]) {
    q(sl).value = setup.bpm;
    q(val).textContent = setup.bpm;
  }
  metro?.setBpm(setup.bpm);
}

// the rhythm drill keeps its own tempo state (40–120, not the strum 40–160)
// — a live bpm slider mid-run would desync the pre-generated grid, so the
// run card hides the shared live row in rhythm mode
function setRhBpm(v) {
  setup.rhBpm = Math.min(120, Math.max(40, Math.round(v)));
  q('stRhBpm').value = setup.rhBpm;
  q('stRhBpmVal').textContent = setup.rhBpm;
}

function wire() {
  q('stStart').addEventListener('click', startSession);
  q('stEnd').addEventListener('click', endSession);
  q('stAgain').addEventListener('click', () => { session = null; showPanel('setup'); });
  q('stBpm').addEventListener('input', () => setBpm(+q('stBpm').value));
  q('stBpmLive').addEventListener('input', () => setBpm(+q('stBpmLive').value));
  q('stBpmDown').addEventListener('click', () => setBpm(setup.bpm - 1));
  q('stBpmUp').addEventListener('click', () => setBpm(setup.bpm + 1));
  q('stBpmLiveDown').addEventListener('click', () => setBpm(setup.bpm - 1));
  q('stBpmLiveUp').addEventListener('click', () => setBpm(setup.bpm + 1));
  q('stRhBpm').addEventListener('input', () => setRhBpm(+q('stRhBpm').value));
  q('stRhBpmDown').addEventListener('click', () => setRhBpm(setup.rhBpm - 1));
  q('stRhBpmUp').addEventListener('click', () => setRhBpm(setup.rhBpm + 1));
  // pointerdown (not click) — it's a timing instrument; each touch is one
  // attack stamped on the same clock the mic's lastOnset uses
  q('stRhPad').addEventListener('pointerdown', e => {
    e.preventDefault();
    rhAttack(performance.now());
    const p = q('stRhPad');
    p.classList.remove('tap');
    void p.offsetWidth;                        // restart the pop animation
    p.classList.add('tap');
  });
  // same semantics as the old chip click: pick the progression; a
  // standard's canonical key adopts into the key picker on re-render.
  // wired here (once per render()) — renderSetupRows re-runs on the same
  // element and would stack listeners.
  q('stProgSearch').addEventListener('input', e => fillProgSelect(e.target.value));
  // pattern editor toggle — opens a fresh draft; a second tap closes it
  q('stPatNew').addEventListener('click', () => {
    if (patDraft) closePatEditor();
    else openPatEditor();
  });
  q('stProg').addEventListener('change', () => {
    const p = [...PROGRESSIONS, ...STANDARDS]
      .find(x => x.id === q('stProg').value);
    if (!p) return;
    setup.prog = p.id;
    if (p.key !== undefined) setup.progKey = p.key;
    renderSetupRows();
  });
}

function fillStrings() {
  body.querySelectorAll('[data-s]').forEach(el => { el.textContent = s(el.dataset.s); });
  const se = q('stProgSearch');
  if (se) se.placeholder = s('search');
}

function showPanel(p) {
  panel = p;
  if (!body) return;
  // the live BPM slider may have moved setup.bpm during a run — keep the
  // setup slider honest when we come back
  if (p === 'setup') {
    q('stBpm').value = setup.bpm;
    q('stBpmVal').textContent = setup.bpm;
  }
  q('stSetup').hidden = p !== 'setup';
  q('stRun').hidden = p !== 'run';
  q('stResult').hidden = p !== 'result';
}

// ---------- setup ----------

function renderSetupRows() {
  // mode switch: 'one' repeats a single chord; 'prog' advances through a
  // key-resolved progression with voice-led voicings. Toggling re-runs this
  // whole function so the pickers repaint into their visible containers.
  segRow(q('stMode'), [
    { id: 'one', label: s('modeOne') },
    { id: 'prog', label: s('modeProg') },
    { id: 'rhythm', label: s('modeRhythm') },
  ], setup.mode, id => { setup.mode = id; renderSetupRows(); });
  const progMode = setup.mode === 'prog';
  const rhMode = setup.mode === 'rhythm';
  if (rhMode && patDraft) closePatEditor();
  q('stPatRow').hidden = rhMode;
  q('stOneOpts').hidden = progMode || rhMode;
  q('stProgOpts').hidden = !progMode;
  q('stRhOpts').hidden = !rhMode;
  // the shared BPM slider and mic-check row only serve the strum modes —
  // rhythm carries its own tempo slider and input seg
  q('stBpmRowSetup').hidden = rhMode;
  q('stMicRow').hidden = rhMode;
  q('stHint').textContent = s(rhMode ? 'rhHint' : 'hint');

  // self-previewing radio-cards: pattern name + a miniature glyph strip of
  // its slot string (D/U/· in compact .strum-slot form). Custom patterns
  // (gt.patterns) ride the same grid — dashed border, a 커스텀/Custom badge
  // and a corner ✕ that arms on first tap and deletes on the second
  // (stats.js two-tap convention). The ✕ sits in a .pat-cell wrapper, not
  // inside the card — nested buttons are invalid markup.
  const patEl = q('stPat');
  patEl.replaceChildren();
  const pats = allPatterns();
  // a deleted/invalid selection falls back to the first preset
  if (!pats.some(p => p.id === setup.pattern)) setup.pattern = PATTERNS[0].id;
  const presetIds = new Set(PATTERNS.map(p => p.id));
  for (const p of pats) {
    const custom = !presetIds.has(p.id);
    const card = document.createElement('button');
    card.className = 'pat-card' + (custom ? ' custom' : '') +
      (p.id === setup.pattern ? ' sel' : '');
    card.dataset.id = p.id;
    const name = document.createElement('span');
    name.className = 'pat-name';
    name.textContent = p.name[getLang()] ?? p.name.en;
    const strip = document.createElement('span');
    strip.className = 'pat-strip';
    strip.setAttribute('aria-hidden', 'true');
    for (const ch of p.slots) {
      const slot = document.createElement('span');
      slot.className = 'strum-slot';
      slot.dataset.ch = ch;
      slot.textContent = ch === '.' ? '·' : ch;
      strip.append(slot);
    }
    if (custom) card.append(name, el('span', 'pat-badge', s('customBadge')), strip);
    else card.append(name, strip);
    card.addEventListener('click', () => {
      patEl.querySelectorAll('.pat-card').forEach(c => c.classList.remove('sel'));
      card.classList.add('sel');
      setup.pattern = p.id;
    });
    if (custom) {
      const cell = el('div', 'pat-cell');
      cell.append(card, patDelButton(p.id));
      patEl.append(cell);
    } else {
      patEl.append(card);
    }
  }
  // the editor re-opens over the rebuilt rows (e.g. language switch mid-edit)
  if (patDraft) paintPatEditor();

  // chips localize note names like the other screens; the big chord title
  // stays a Latin chord symbol (chordSymbol is called without `lang`)
  rootPicker(q('stRoot'), setup.root, id => { setup.root = id; },
    { flat: settings.flat, lang: getLang() });
  chipRow(q('stQual'),
    COMMON_Q.map(qk => ({ id: qk, label: QUALITIES[qk].label })),
    setup.quality, id => { setup.quality = id; });

  // progression-mode pickers: key root (same rootPicker as the chord root)
  // and a preset <select>. A standard's canonical key rides in the option
  // text ("Autumn Leaves (Gm)") now that the chip's .prog-songs sub-line
  // is gone; optgroups stand in for the "Jazz standards" divider.
  rootPicker(q('stKey'), setup.progKey, id => { setup.progKey = id; },
    { flat: settings.flat, lang: getLang() });
  // keep setup.prog pointing at a real option (same fallback as practice)
  if (![...PROGRESSIONS, ...STANDARDS].some(p => p.id === setup.prog))
    setup.prog = PROGRESSIONS[0].id;
  fillProgSelect(q('stProgSearch').value);
  // rhythm mode pickers: mic needs a guitar (muted strings work — only the
  // attack timing is scored); the tap pad works anywhere, no mic at all
  segRow(q('stRhInput'), [
    { id: 'mic', label: s('inputMic') },
    { id: 'tap', label: s('inputTap') },
  ], setup.rhInput, id => { setup.rhInput = id; });
  segRow(q('stRhLevel'), [
    { id: '1', label: 'Lv1' },
    { id: '2', label: 'Lv2' },
    { id: '3', label: 'Lv3' },
  ], String(setup.rhLevel), id => { setup.rhLevel = +id; });
  segRow(q('stMic'), [
    { id: 'off', label: s('micOff') },
    { id: 'on', label: s('micOn') },
  ], setup.micCheck ? 'on' : 'off', id => { setup.micCheck = id === 'on'; });
}

// ✕ arms on the first tap, deletes on the second — the stats.js two-tap
// convention. Deleting the selected pattern falls back to the first preset.
function patDelButton(id) {
  const rm = el('button', 'pat-del', '✕');
  rm.title = s('del');
  let armed = false, t = null;
  rm.addEventListener('click', e => {
    e.stopPropagation();             // never toggle the card under it
    if (!armed) {
      armed = true;
      rm.classList.add('armed');
      t = setTimeout(() => {
        armed = false; rm.classList.remove('armed');
      }, 1600);
      return;
    }
    clearTimeout(t);
    savePatterns(getCustomPatterns().filter(p => p.id !== id));
    if (setup.pattern === id) setup.pattern = PATTERNS[0].id;
    renderSetupRows();
  });
  return rm;
}

// ---------- pattern editor ----------

// Inline D/U/rest editor inside the pattern row: a 4/4|3/4 meter seg, a
// tap-to-cycle slot strip (D → U → · → D), a name field, save/cancel.
// Saves to gt.patterns; the new card is selected immediately.
const CYCLE = { 'D': 'U', 'U': '.', '.': 'D' };

function openPatEditor() {
  patDraft = { beats: 4, slots: 'D.......', name: '' };
  paintPatEditor();
}

function closePatEditor() {
  patDraft = null;
  const ed = q('stPatEditor');
  if (ed) { ed.hidden = true; ed.replaceChildren(); }
}

function paintPatEditor() {
  const ed = q('stPatEditor');
  if (!ed || !patDraft) return;
  ed.replaceChildren();
  ed.hidden = false;

  const meterRow = el('div', 'chip-row');
  meterRow.append(el('span', 'row-label', s('meter')));
  const seg = el('span');
  meterRow.append(seg);
  segRow(seg, [
    { id: '4', label: '4/4' },
    { id: '3', label: '3/4' },
  ], String(patDraft.beats), id => {
    patDraft.beats = +id;
    // resize the strip to the new meter: keep what fits, pad with rests
    const n = patDraft.beats * 2;
    patDraft.slots = (patDraft.slots + '........').slice(0, n);
    paintPatEditor();
  });
  ed.append(meterRow);

  const strip = el('div', 'pat-edit-strip');
  [...patDraft.slots].forEach((ch, i) => {
    const b = el('button', 'strum-slot pat-edit-slot');
    b.dataset.ch = ch;
    b.textContent = ch === '.' ? '·' : ch;
    b.addEventListener('click', () => {
      patDraft.slots =
        patDraft.slots.slice(0, i) + CYCLE[ch] + patDraft.slots.slice(i + 1);
      paintPatEditor();
    });
    strip.append(b);
  });
  ed.append(strip);

  // the draft mirrors the input so a slot-tap repaint can't lose typed text
  const nameIn = el('input', 'gt-input');
  nameIn.type = 'text';
  nameIn.placeholder = s('patNamePh');
  nameIn.maxLength = 40;
  nameIn.value = patDraft.name;
  nameIn.addEventListener('input', () => { patDraft.name = nameIn.value; });
  ed.append(nameIn);

  const foot = el('div', 'chip-row wrap pat-edit-foot');
  const save = el('button', 'primary', s('save'));
  save.addEventListener('click', savePatDraft);
  const cancel = el('button', 'ghost', s('cancel'));
  cancel.addEventListener('click', closePatEditor);
  foot.append(save, cancel);
  ed.append(foot);
}

function savePatDraft() {
  if (!patDraft) return;
  const name = patDraft.name.trim() || s('myPattern');
  const p = {
    id: `pat-${Date.now()}`,
    beats: patDraft.beats,
    slots: patDraft.slots,
    name: { ko: name, en: name },     // the user's own label, both langs
  };
  const list = getCustomPatterns();
  list.push(p);
  if (!savePatterns(list)) return;    // storage blocked — keep the editor open
  setup.pattern = p.id;
  closePatEditor();
  renderSetupRows();
  showBanner(s('patSaved'), 2500);
}

// ---------- song search ----------
// <option hidden> is patchy cross-browser, so the filter rebuilds the
// select's optgroups per keystroke instead. fold() drops case + accents so
// "gm", "(Gm" or "autumn" all hit "Autumn Leaves (Gm)". The current pick
// stays while visible, else the first hit is adopted via the normal
// change handler.
const foldText = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const progLabel = (p, std) => p.label + (std && p.key !== undefined
  ? ` (${pcName(p.key, { flat: preferFlat(p.key) })}${p.minor ? 'm' : ''})` : '');

function fillProgSelect(filter = '') {
  const progEl = q('stProg');
  const needle = foldText(filter.trim());
  progEl.replaceChildren();
  const addGroup = (label, progs, std) => {
    const hits = progs.filter(p => !needle || foldText(progLabel(p, std)).includes(needle));
    if (!hits.length) return;
    const og = document.createElement('optgroup');
    og.label = label;
    for (const p of hits) og.append(new Option(progLabel(p, std), p.id));
    progEl.append(og);
  };
  addGroup(s('progPresets'), PROGRESSIONS, false);
  // one optgroup per genre present, in GENRES order
  for (const g of Object.keys(GENRES)) {
    addGroup(GENRES[g][getLang()] ?? GENRES[g].en,
      STANDARDS.filter(p => p.genre === g), true);
  }
  if (!progEl.options.length) {
    const o = new Option(s('noMatch'), '');
    o.disabled = true;
    progEl.append(o);
  }
  progEl.value = setup.prog;
  if (progEl.value !== setup.prog) {         // the pick was filtered out
    const first = [...progEl.options].find(o => !o.disabled);
    if (first) {
      progEl.value = first.value;
      progEl.dispatchEvent(new Event('change'));
    } else progEl.value = '';
  }
}

// ---------- session ----------

async function startSession() {
  if (starting) return;          // double-click while getUserMedia is pending
  starting = true;
  q('stStart').disabled = true;
  try {
    audioCtx();                  // create/resume inside the click gesture
    if (setup.mode === 'rhythm') { await startRhythm(); return; }
    if (setup.micCheck) {
      try { await mic.start(); }
      catch (e) {
        showBanner(e && e.name === 'NotAllowedError' ? s('micDenied') : s('micFailed'));
        return;
      }
      // user may have left the tab while getUserMedia was pending
      if (!document.getElementById('screen-strum').classList.contains('active')) {
        mic.stop(); return;
      }
    }
    // custom patterns are lookup-identical to presets — the session only
    // reads pattern.beats/pattern.slots
    const pattern = allPatterns().find(p => p.id === setup.pattern) || PATTERNS[0];
    // 'one' = a single-chord session (items.length 1 keeps the item index
    // at 0); 'prog' resolves the preset's bars against the chosen key, the
    // same way practice.js does (root = key + off, mod 12 inside makeChord).
    const prog = setup.mode === 'prog'
      ? ([...PROGRESSIONS, ...STANDARDS].find(p => p.id === setup.prog)
         || PROGRESSIONS[0])
      : null;
    const chords = prog
      ? prog.bars.map(b => makeChord(setup.progKey + b.off, b.q))
      : [makeChord(setup.root, setup.quality)];
    // Voice-lead the whole sequence up front; a null slot falls back to the
    // chord's top voicing (and stays null only if it has none — that bar just
    // skips the diagram/reference).
    const led = voiceLead(chords);
    const voicings = chords.map((c, i) => led[i] ?? voicingsFor(c)[0] ?? null);
    // prog symbols spell flat in flat keys like practice.js (minor-flagged
    // standards too — Gm/Cm tunes are flat keys); one-chord keeps the
    // user's flat/sharp display setting
    const flat = prog ? (preferFlat(setup.progKey) || !!prog.minor)
                      : settings.flat;
    const syms = chords.map(c => chordSymbol(c, { flat }));
    // a `half` item lasts 2 beats and shares its bar with the next half;
    // everything else occupies the full 4-beat bar. Custom songs may carry
    // an explicit `beats` (1 or 3) instead of the half flag.
    const items = chords.map((c, i) => ({
      chord: c, sym: syms[i], voicing: voicings[i],
      beats: prog ? (prog.bars[i].beats || (prog.bars[i].half ? 2 : 4)) : 4,
    }));
    session = {
      pattern, prog, items,
      chord: items[0].chord,       // display/mic target — follows the item,
      sym: items[0].sym,           // repointed mid-bar when a half ends
      voicing: items[0].voicing,
      barChord: items[0].chord,    // beat-1 anchor this bar is scored against
      barSym: items[0].sym,
      ci: 0,                       // index into items of the sounding chord
      itemLeft: items[0].beats,    // beats left in items[ci]
      sb: 0,                       // session beat counter (item clock)
      countin: true,               // the metronome's first bar counts in
      micOn: setup.micCheck,
      bars: 0, hits: 0, barOk: false, done: false, hist: [],
      barT0: 0, halfMs: 0,       // wall-clock bar start + ms per 8th slot
      onsets: [],                // pick-attack timestamps this bar
      lastOnsetSeen: mic.lastOnset,   // attacks before Start don't count
    };
    voteRing = [];
    showPanel('run');
    paintRun();
    metro = new Metronome(onBeat);
    metro.start(setup.bpm, pattern.beats);
    if (session.micOn) startPoll();
  } finally {
    starting = false;
    const b = q('stStart');
    if (b) b.disabled = false;
  }
}

// Fires ~120ms before the beat sounds. Schedule the count-in flash, the
// item tick, the two 8th slots of this beat (and, on beat 1, the bar-start
// work) on the wall clock. The metronome's first bar is a count-in — one
// full bar of the pattern's meter, so session beat 0 falls on a bar line.
function onBeat(beatIndex, audioTime) {
  if (!session || session.done) return;
  const delay = Math.max(0, (audioTime - audioCtx().currentTime) * 1000);
  const beats = session.pattern.beats;
  if (beatIndex < beats) {
    later(() => showCountin(beats - beatIndex), delay);
    return;
  }
  const sb = beatIndex - beats;               // session beat; 0 = session start
  const beatInBar = sb % beats;
  // tickItem is scheduled before barStart so at a bar line the item pointer
  // is already on the beat-1 chord when barStart anchors the scoring chord
  if (session.prog) later(() => tickItem(sb), delay);
  later(() => beatNow(beatInBar), delay);
  if (beatInBar === 0) later(() => barStart(sb), delay);
  const s0 = beatInBar * 2;
  const half = (60 / (metro?.bpm || setup.bpm)) * 500;
  later(() => highlight(s0), delay);
  later(() => highlight(s0 + 1), delay + half);
}

// Per-session-beat item bookkeeping (progression mode only): each item
// holds for `beats` beats — a `half` bar is 2 — then the display/mic chord
// repoints. Half items change chord mid-bar at the halfway slot.
function tickItem(sb) {
  const se = session;
  if (!se || se.done) return;
  se.sb = sb;
  if (sb === 0) { se.ci = 0; se.itemLeft = se.items[0].beats; }
  else if (--se.itemLeft > 0) return;         // still inside the item
  else {
    se.ci = (se.ci + 1) % se.items.length;
    se.itemLeft = se.items[se.ci].beats;
  }
  const it = se.items[se.ci];
  se.chord = it.chord; se.sym = it.sym; se.voicing = it.voicing;
  paintBar();
}

// Count-in overlay: the big number over the run card. .tick re-arms the CSS
// pulse each beat; with prefers-reduced-motion the number just swaps.
function showCountin(n) {
  if (!session || session.done || !session.countin) return;
  const el = q('stCountin');
  if (!el) return;
  el.textContent = n;
  el.hidden = false;
  el.classList.remove('tick');
  void el.offsetWidth;                        // restart the animation
  el.classList.add('tick');
}

function hideCountin() {
  const el = q('stCountin');
  if (el) el.hidden = true;
}

// The audible bar line: end the count-in, tally the bar that just closed,
// reset the mic vote, and (mic check off only) play the reference strum for
// the new bar.
function barStart(sb) {
  if (!session || session.done) return;
  session.countin = false;
  hideCountin();
  if (sb > 0) closeBar();
  session.barOk = false;
  session.barT0 = performance.now();
  session.halfMs = 30000 / (metro?.bpm || setup.bpm);
  voteRing = [];
  session.sb = sb;                 // tickItem already set it in prog mode;
                                   // harmless here, keeps paintBarMap honest
  paintBeatStrip();                // strip B's map promotes to current bar
  // this bar's attempt is scored/recorded against the chord that sounded on
  // beat 1 — tickItem already advanced the pointer on this same beat, so
  // mid-bar halves don't move the anchor
  session.barChord = session.chord;
  session.barSym = session.sym;
  const fb = q('stFeedback');
  fb.textContent = session.micOn ? s('listening') : s('strumAlong');
  fb.className = 'feedback';
  // no reference while verifying — the mic would hear the synth strum and
  // pass the bar without the user playing anything
  if (!session.micOn) {
    const v = session.voicing;
    if (v) playVoicing(v);
  }
}

function closeBar() {
  const se = session;
  se.bars++;
  let pass = true;
  if (se.micOn) {
    // pattern check: each sounded slot wants a pick attack within ±tol of
    // its grid position (tol < half a slot so one strum can't cover two).
    // The worklet refractory (REFRACT_S=0.3 in worklet-processor.js) caps
    // attacks at ~1/300ms — faster than 8ths at 100bpm — so the denominator
    // is limited to what the detector can physically report in a bar.
    const tol = Math.min(170, se.halfMs * 0.45);
    const barMs = se.halfMs * se.pattern.slots.length;
    const maxOnsets = Math.floor(barMs / 300) + 1;
    let sounded = 0, got = 0;
    [...se.pattern.slots].forEach((ch, i) => {
      if (ch === '.') return;
      sounded++;
      const t = se.barT0 + i * se.halfMs;
      if (se.onsets.some(o => Math.abs(o - t) <= tol)) got++;
    });
    const need = Math.min(sounded, maxOnsets);
    const patternOk = need === 0 || got * 4 >= need * 3;   // ≥75% of slots
    pass = se.barOk && patternOk;
    if (pass) se.hits++;
    se.hist.push(pass);
    if (se.hist.length > 16) se.hist.shift();
    const fb = q('stFeedback');
    fb.textContent = pass ? s('clean') : se.barOk ? s('timing') : s('missed');
    fb.className = 'feedback ' + (pass ? 'good' : 'bad');
    paintHist();
  }
  // one attempt per completed bar, recorded under the beat-1 chord — mic-off
  // bars are unverified follow-along and recording them as "correct" would
  // inflate the stats screen
  if (se.micOn) recordAttempt(se.barSym, pass, se.pattern.beats * 60000 / setup.bpm);
  paintScore();
}

// ---------- run UI ----------

function paintRun() {
  hideCountin();                 // first beat re-shows it within ~25ms
  const rh = !!session.rhythm;
  // rhythm swaps the chord/pattern/diagram row for the 16-slot grid; the
  // live BPM row hides because tempo is baked into the generated session
  q('stChordLine').hidden = rh;
  q('stPatView').hidden = rh;
  q('stDiagram').hidden = rh;
  q('stBpmRow').hidden = rh;
  q('stRhRun').hidden = !rh;
  if (rh) {
    q('stRhPad').hidden = session.input !== 'tap';
    buildRhGrid();
    paintRhNext();
  } else {
    paintBar();
    q('stBpmLive').value = setup.bpm;
    q('stBpmLiveVal').textContent = setup.bpm;
    buildPattern();
    highlight(-1);
  }
  paintHist();
  paintScore();
  const fb = q('stFeedback');
  fb.textContent = rh
    ? (session.input === 'mic' ? s('listening') : s('tapAlong'))
    : session.micOn ? s('listening') : s('strumAlong');
  fb.className = 'feedback';
}

// Paint the current item's chord: the big title and the voice-led diagram.
// The bar-map strips beside the title show where chords land this bar and
// next (prog mode only — paintBeatStrip). A null voicing still shows the
// title; the diagram just clears for that span.
function paintBar() {
  const items = session.items;
  const it = items[session.ci];
  q('stChord').textContent = it.sym;
  const dg = q('stDiagram');
  if (it.voicing) renderChordDiagram(dg, it.voicing, { lefty: settings.lefty });
  else dg.replaceChildren();
  paintBeatStrip();
}

// Bar-map strips: two adjacent maps of `pattern.beats` cells — strip A the
// current bar, strip B the next bar (dimmer "future" preview). A cell where
// an item STARTS widens into a chip with its symbol: .snd sounding now,
// .up starting later this bar, .past already over. A bar with no start
// stays all pips — no label means the previous chord is still sounding
// (Chordify rule). Items wrap modulo, so strip B always exists.
function paintBeatStrip() {
  const maps = q('stMaps');
  if (!maps) return;
  maps.hidden = !session.prog;
  if (!session.prog) return;
  const beats = session.pattern.beats;
  const w0 = session.sb - (session.sb % beats);    // current bar window
  paintBarMap(q('stBeat'), w0);
  paintBarMap(q('stBeatB'), w0 + beats);
}

// Paint one bar-map strip for session-beat window [w0, w0+beats): locate
// the item covering w0 by walking item intervals from the live pointer
// (ci covers [sb + itemLeft - beats, sb + itemLeft)), then chip every
// start inside the window. `.now` is beatNow's pip — classes toggle per
// cell, className is never rewritten wholesale.
function paintBarMap(strip, w0) {
  const se = session, items = se.items, N = items.length;
  const B = se.pattern.beats;
  if (strip.childElementCount !== B) {
    strip.replaceChildren();
    for (let i = 0; i < B; i++) {
      const c = document.createElement('i');
      c.className = 'beat-cell';
      strip.append(c);
    }
  }
  let k = se.ci, s = se.sb + se.itemLeft - items[k].beats;
  while (w0 < s) { k = (k - 1 + N) % N; s -= items[k].beats; }
  while (w0 >= s + items[k].beats) { s += items[k].beats; k = (k + 1) % N; }
  const now = se.countin ? -1 : se.sb;   // count-in: nothing sounds yet
  const map = new Array(B).fill(null);
  while (s < w0 + B) {
    if (s >= w0) {
      const end = s + items[k].beats;
      map[s - w0] = { sym: items[k].sym,
        cls: now < s ? 'up' : now < end ? 'snd' : 'past' };
    }
    s += items[k].beats; k = (k + 1) % N;
  }
  [...strip.children].forEach((c, i) => {
    const m = map[i];
    c.classList.toggle('chip', !!m);
    c.classList.toggle('snd', !!m && m.cls === 'snd');
    c.classList.toggle('up', !!m && m.cls === 'up');
    c.classList.toggle('past', !!m && m.cls === 'past');
    c.textContent = m ? m.sym : '';
  });
}

// live fill: light the sounding beat's pip each session beat — strip A
// only (one-chord mode keeps the maps hidden, so this no-ops there)
function beatNow(b) {
  const maps = q('stMaps');
  if (!maps || maps.hidden) return;
  [...q('stBeat').children].forEach((c, i) =>
    c.classList.toggle('now', i === b));
}

// The big pattern row — spans with .strum-slot (+.cur/.hit/.miss hooks for
// the designer). Inline styles carry the look until styles.css catches up.
function buildPattern() {
  const view = q('stPatView');
  view.replaceChildren();
  slotEls = [...session.pattern.slots].map(ch => {
    const sp = document.createElement('span');
    sp.className = 'strum-slot';
    sp.dataset.ch = ch;
    sp.textContent = ch === '.' ? '·' : ch;
    view.append(sp);
    return sp;
  });
}

function highlight(i) {
  if (!session || session.done) return;
  slotEls.forEach((el, j) => el.classList.toggle('cur', j === i));
}

function paintScore() {
  const se = session;
  if (se.rhythm) {
    const cur = se.countin || se.bar < 0 ? 0 : Math.min(RH_BARS, se.bar + 1);
    q('stBars').textContent = `${s('bars')} ${cur}/${RH_BARS}`;
    const avg = se.offsets.length
      ? Math.round(se.offsets.reduce((a, x) => a + Math.abs(x), 0) / se.offsets.length)
      : 0;
    q('stScore').textContent =
      `${s('rhHits')} ${se.hits}/${se.expTotal} · ${s('rhAvg')} ±${avg}ms`;
    // fixed 8-bar session — the run bar carries real progress this time
    const bar = q('stRun')?.querySelector('.run-bar > i');
    if (bar) bar.style.width = `${cur / RH_BARS * 100}%`;
    return;
  }
  q('stBars').textContent = `${s('bars')} ${se.bars}`;
  q('stScore').textContent = se.micOn ? `✓${se.hits} ✗${se.bars - se.hits}` : '';
  // bars are unbounded, so the bar carries accuracy instead of progress
  const bar = q('stRun')?.querySelector('.run-bar > i');
  if (bar) bar.style.width = se.bars && se.micOn
    ? `${se.hits / se.bars * 100}%` : '0';
}

// recent-bar history strip: one small dot per bar (green = bar passed)
function paintHist() {
  const el = q('stHist');
  el.replaceChildren();
  for (const ok of session.hist) {
    const d = document.createElement('span');
    d.className = 'strum-dot ' + (ok ? 'hit' : 'miss');
    el.append(d);
  }
}

// ---------- mic verification ----------

// Poll ~14×/s. Two jobs: (1) record every pick attack the worklet reports
// (mic.lastOnset) so closeBar can score the pattern grid, and (2) verify the
// chord — barOk latches when the current frame verifies and ≥3 of the last
// 6 did, looser than the practice gate since strums are noisy.
function startPoll() {
  stopPoll();
  pollTimer = setInterval(() => {
    if (!session || session.done || !session.micOn || session.countin) return;
    if (mic.lastOnset && mic.lastOnset !== session.lastOnsetSeen) {
      session.lastOnsetSeen = mic.lastOnset;
      session.onsets.push(mic.lastOnset);
      if (session.onsets.length > 96) session.onsets.shift();
    }
    if (session.barOk) return;
    const spec = mic.spectrum();
    if (!spec) return;
    // score against the bar's beat-1 chord — mid-bar halves repoint the
    // display target but the bar still wants its anchor chord heard
    const prof = profileFromSpectrum(spec.db, spec.binHz, requiredPcs(session.barChord));
    const res = matchChord(prof, session.barChord);
    voteRing.push(res.ok);
    if (voteRing.length > 6) voteRing.shift();
    if (res.ok && voteRing.filter(Boolean).length >= 3) {
      session.barOk = true;
      const fb = q('stFeedback');
      fb.textContent = s('clean');
      fb.className = 'feedback good';
    }
  }, 70);
}

function stopPoll() { clearInterval(pollTimer); pollTimer = null; }

// ---------- rhythm-reading run ----------
// Same audio-clock machinery as the strum modes: the Metronome's first bar
// counts in, then RH_BARS generated bars of 4 beats each. Attacks come from
// the tap pad (pointerdown → performance.now) or mic.lastOnset — no pitch
// checking, muted strings are fine. Each attack is matched to the nearest
// still-open expected slot inside ±RH_WIN ms.

async function startRhythm() {
  if (setup.rhInput === 'mic') {
    try { await mic.start(); }
    catch (e) {
      showBanner(e && e.name === 'NotAllowedError' ? s('micDenied') : s('micFailed'));
      return;
    }
    // user may have left the tab while getUserMedia was pending
    if (!document.getElementById('screen-strum').classList.contains('active')) {
      mic.stop(); return;
    }
  }
  session = {
    rhythm: true, done: false, countin: true,
    level: setup.rhLevel, input: setup.rhInput,
    pats: [...Array(RH_BARS)].map(() => genRhythm(setup.rhLevel)),
    bar: -1, bars: 0,              // bar = current index; bars = completed
    pat: null, slotState: [],      // 'rest' | 'pending' | 'hit' | 'off' | 'miss'
    barT0: 0, slotMs: 15000 / setup.rhBpm,
    lastOnsetSeen: mic.lastOnset,  // onsets before Start don't count
    hits: 0, expTotal: 0, gotTotal: 0, expDone: 0,
    // expTotal counts expected slots in started bars (live score line);
    // expDone only completed ones (result accuracy — an End mid-bar
    // shouldn't score slots the player never had a chance to hit)
    offsets: [], barOffsets: [], extra: 0,
    hist: [], streak: 0, best: 0,
  };
  voteRing = [];
  showPanel('run');
  paintRun();
  metro = new Metronome(rhBeat);
  metro.start(setup.rhBpm, 4);
  startRhTick();
}

// Metronome callback — the strum modes' count-in convention: beats 0–3
// flash the overlay unscored, session beat 0 opens bar 0 on the next bar
// line, and the bar line after bar 7 (session beat 32) ends the session.
function rhBeat(beatIndex, audioTime) {
  if (!session || session.done) return;
  const delay = Math.max(0, (audioTime - audioCtx().currentTime) * 1000);
  if (beatIndex < 4) { later(() => showCountin(4 - beatIndex), delay); return; }
  const sb = beatIndex - 4;
  if (sb % 4 === 0) {
    const bar = sb / 4;
    later(() => { bar < RH_BARS ? rhBarStart(bar) : rhFinish(); }, delay);
  }
}

function rhBarStart(bar) {
  const se = session;
  if (!se || se.done) return;
  if (bar > 0) rhBarClose();           // tally the bar that just ended
  se.countin = false;
  hideCountin();
  se.bar = bar;
  se.pat = se.pats[bar];
  se.slotState = se.pat.map(on => (on ? 'pending' : 'rest'));
  se.barT0 = performance.now();
  se.slotMs = 15000 / (metro?.bpm || setup.rhBpm);
  se.barOffsets = [];
  se.extra = 0;
  se.expTotal += se.pat.filter(Boolean).length;
  buildRhGrid();
  paintRhNext();
  paintScore();
  const fb = q('stFeedback');
  fb.textContent = se.input === 'mic' ? s('listening') : s('tapAlong');
  fb.className = 'feedback';
}

// The bar line: still-pending slots miss, extra taps count against the bar
// (capped at its expected count, so spam can't bury an honest bar).
function rhBarClose() {
  const se = session;
  let exp = 0, got = 0;
  se.slotState.forEach((st, i) => {
    if (st === 'rest') return;
    exp++;
    if (st === 'pending') { se.slotState[i] = 'miss'; paintRhCell(i); }
    else got++;                        // 'hit' or 'off' — both matched
  });
  const acc = exp ? got / (exp + Math.min(se.extra, exp)) : 1;
  const ok = acc >= 0.7;
  se.bars++;
  se.gotTotal += got;
  se.expDone += exp;
  se.hist.push(ok);
  if (se.hist.length > 16) se.hist.shift();
  if (ok) { se.streak++; se.best = Math.max(se.best, se.streak); }
  else se.streak = 0;
  // one stat attempt per bar under 'rh:lvN'; ms = this bar's mean |offset|
  const avg = se.barOffsets.length
    ? se.barOffsets.reduce((a, x) => a + Math.abs(x), 0) / se.barOffsets.length
    : 0;
  recordAttempt(`rh:lv${se.level}`, ok, avg);
  paintHist();
  paintScore();
  const fb = q('stFeedback');
  fb.textContent = ok ? s('clean') : s('timing');
  fb.className = 'feedback ' + (ok ? 'good' : 'bad');
}

// One attack (tap or mic onset) → the nearest still-open expected slot
// inside ±RH_WIN. 'hit' ≤RH_HIT ms, 'off' within the window; anything
// unmatched is an extra for the bar. Note: the worklet's 300ms onset
// refractory means mic input physically can't resolve 16ths above ~100bpm
// — tap input (or sparser levels) is the way to play fast grids.
function rhAttack(t) {
  const se = session;
  if (!se || se.done || se.countin || se.bar < 0 || !se.pat) return;
  let best = -1, bd = RH_WIN;
  for (let i = 0; i < 16; i++) {
    if (se.slotState[i] !== 'pending') continue;
    const d = Math.abs(t - (se.barT0 + i * se.slotMs));
    if (d <= bd) { bd = d; best = i; }
  }
  const fb = q('stFeedback');
  if (best < 0) {
    se.extra++;
    fb.textContent = s('rhExtra');
    fb.className = 'feedback bad';
    return;
  }
  const off = t - (se.barT0 + best * se.slotMs);
  se.slotState[best] = Math.abs(off) <= RH_HIT ? 'hit' : 'off';
  se.offsets.push(off);
  se.barOffsets.push(off);
  if (se.slotState[best] === 'hit') se.hits++;
  paintRhCell(best);
  fb.textContent = se.slotState[best] === 'hit'
    ? `✓ ${off >= 0 ? '+' : '−'}${Math.round(Math.abs(off))}ms`
    : `${off > 0 ? s('rhLate') : s('rhEarly')} ${Math.round(Math.abs(off))}ms`;
  fb.className = 'feedback ' + (se.slotState[best] === 'hit' ? 'good' : 'bad');
  paintScore();
}

// ~30 Hz tick (reuses pollTimer so cleanupAudio covers it): drains mic
// onsets, sweeps the playhead, and expires pending slots whose window
// closed — a live miss flash instead of waiting for the bar line.
function startRhTick() {
  stopPoll();
  pollTimer = setInterval(() => {
    const se = session;
    if (!se || se.done || !se.rhythm) return;
    if (se.input === 'mic' && mic.lastOnset &&
        mic.lastOnset !== se.lastOnsetSeen) {
      se.lastOnsetSeen = mic.lastOnset;
      rhAttack(mic.lastOnset);
    }
    if (se.countin || se.bar < 0 || !se.pat) return;
    const now = performance.now();
    const cur = Math.max(0, Math.min(15, Math.floor((now - se.barT0) / se.slotMs)));
    rhPlayhead(cur);
    for (let i = 0; i < 16; i++) {
      if (se.slotState[i] === 'pending' &&
          now - (se.barT0 + i * se.slotMs) > RH_WIN) {
        se.slotState[i] = 'miss';
        paintRhCell(i);
      }
    }
  }, 33);
}

// the sweeping highlight: .now on the current slot, .past dims finished ones
function rhPlayhead(cur) {
  if (cur === rhCurSlot) return;
  rhCurSlot = cur;
  rhCellEls.forEach((c, i) => {
    c.classList.toggle('now', i === cur);
    c.classList.toggle('past', i < cur);
  });
}

// The 16-slot grid: four .rh-beat groups of four cells, so the beat-number
// row above lands column-for-column. During the count-in (pat still null)
// bar 0's pattern previews under the overlay.
function buildRhGrid() {
  const grid = q('stRhGrid');
  const pat = session.pat || session.pats[0];
  grid.replaceChildren();
  rhCellEls = [];
  rhCurSlot = -1;
  pat.forEach((on, i) => {
    if (i % 4 === 0) grid.append(el('span', 'rh-beat'));
    const c = document.createElement('i');
    c.className = 'rh-cell' + (on ? ' on' : '');
    grid.lastElementChild.append(c);
    rhCellEls.push(c);
    paintRhCell(i);
  });
}

// next-bar preview: same grid, smaller + dimmer (.beat-strip.future look)
function paintRhNext() {
  const nx = q('stRhNext');
  nx.replaceChildren();
  const np = session.pats[Math.max(0, session.bar) + 1];
  nx.hidden = !np;
  if (!np) return;
  np.forEach((on, i) => {
    if (i % 4 === 0) nx.append(el('span', 'rh-beat'));
    const c = document.createElement('i');
    c.className = 'rh-cell' + (on ? ' on' : '');
    nx.lastElementChild.append(c);
  });
}

function paintRhCell(i) {
  const c = rhCellEls[i];
  if (!c) return;
  const st = session.slotState[i] || 'rest';
  c.classList.toggle('hit', st === 'hit');
  c.classList.toggle('off', st === 'off');
  c.classList.toggle('miss', st === 'miss');
}

// natural finish — the metronome hit the bar line after bar 7
function rhFinish() {
  const se = session;
  if (!se || se.done) return;
  rhBarClose();
  se.done = true;
  cleanupAudio();
  hideCountin();
  showPanel('result');
  paintResult();
}

// ---------- finish ----------

function cleanupAudio() {
  stopPoll();
  metro?.stop(); metro = null;
  for (const id of timers) clearTimeout(id);
  timers.clear();
  if (mic.running) mic.stop();
}

function endSession() {          // "끝내기" — stop the clock, show light stats
  if (!session) { showPanel('setup'); return; }
  cleanupAudio();
  hideCountin();
  session.done = true;
  if (!session.bars) { showPanel('setup'); return; }
  showPanel('result');
  paintResult();
}

// split out so render() can repaint it after a language switch
function paintResult() {
  if (session.rhythm) {
    const se = session;
    const acc = se.expDone ? Math.round(100 * se.gotTotal / se.expDone) : 0;
    const avg = se.offsets.length
      ? Math.round(se.offsets.reduce((a, x) => a + Math.abs(x), 0) / se.offsets.length)
      : 0;
    q('stResultBody').innerHTML =
      `${s('modeRhythm')} Lv${se.level} · ${s('bars')}: ${se.bars}<br>` +
      `${s('sumAcc')}: ${acc}% (${se.gotTotal}/${se.expDone})<br>` +
      `${s('sumAvg')}: ±${avg}ms<br>` +
      `${s('sumBest')}: ${se.best}`;
    return;
  }
  const acc = session.micOn
    ? Math.round(100 * session.hits / session.bars) : null;
  q('stResultBody').innerHTML =
    (session.prog ? `${s('prog')}: ${session.prog.label}<br>` : '') +
    `${s('bars')}: ${session.bars}<br>` +
    (acc === null
      ? `<span style="color:var(--dim)">${s('strumAlong')}</span>`
      : `${s('passed')}: ${session.hits}/${session.bars} (${acc}%)`);
}

// ---------- wiring ----------

export function initStrum() {
  body = document.getElementById('strumBody');
  render();
  onLangChange(render);          // rebuild labels; session state survives
}

// app.js calls this when leaving the strum tab: release the metronome, the
// mic, and every scheduled visual timer so nothing runs in the background.
export function suspendStrum() {
  cleanupAudio();
  hideCountin();
  if (session && !session.done) {
    session.done = true;
    showPanel('setup');
  }
}

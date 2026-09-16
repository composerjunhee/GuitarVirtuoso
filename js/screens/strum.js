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
  },
};

// A bar = 8th-note slots, each 'D' | 'U' | '.' (rest). `beats` is the
// metronome's beats-per-bar, so slots.length === beats * 2.
const PATTERNS = [
  { id: 'folk',   beats: 4, slots: 'D.DU.UDU', name: { ko: '포크',      en: 'Folk' } },
  { id: 'ballad', beats: 4, slots: 'D...DU.U', name: { ko: '발라드',    en: 'Ballad' } },
  { id: 'drive',  beats: 4, slots: 'DUDUDUDU', name: { ko: '드라이브',  en: 'Driving 8ths' } },
  { id: 'off',    beats: 4, slots: '.U.U.U.U', name: { ko: '오프비트',  en: 'Offbeats' } },
  { id: 'rumba',  beats: 4, slots: 'D.U.UD.U', name: { ko: '룸바',      en: 'Rumba' } },
  { id: 'waltz',  beats: 3, slots: 'D.U.U.',   name: { ko: '왈츠 3/4',  en: 'Waltz 3/4' } },
];

const COMMON_Q = ['', 'm', '7', 'maj7', 'm7', 'm7b5', 'sus2', 'sus4'];

const setup = {
  pattern: 'folk', mode: 'one',      // 'one' = repeat one chord; 'prog' = cycle a progression
  root: 7, quality: '',              // one-chord mode target
  progKey: 0, prog: PROGRESSIONS[0].id,   // progression mode: key root + preset id
  bpm: 80, micCheck: false,
};

let body = null;                 // #strumBody
let panel = 'setup';             // 'setup' | 'run' | 'result'
let session = null;              // see startSession() for fields
let starting = false;            // guards the async mic.start() in startSession
let metro = null;
let slotEls = [];
let timers = new Set();          // pending visual-sync timeouts
let pollTimer = null;
let voteRing = [];               // sliding window of recent match results

const s = k => STR[getLang()]?.[k] ?? STR.en[k] ?? k;
const q = id => body.querySelector('#' + id);

// defer a visual to an audio-clock time, tracked for cleanup
function later(fn, ms) {
  const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
  timers.add(id);
}

// ---------- DOM ----------

function render() {
  body.innerHTML = `
    <div id="stSetup" class="setup-card">
      <div class="chip-row"><span class="row-label" data-s="mode"></span>
        <span id="stMode" class="seg"></span></div>
      <div id="stPatRow"><span class="picker-label" data-s="pattern"></span>
        <div id="stPat" class="pat-grid"></div></div>
      <div id="stOneOpts">
        <div class="chip-row"><span class="row-label" data-s="root"></span>
          <span id="stRoot" class="chip-row"></span></div>
        <div class="chip-row"><span class="row-label" data-s="quality"></span>
          <span id="stQual" class="chip-row wrap"></span></div>
      </div>
      <div id="stProgOpts" hidden>
        <div class="chip-row"><span class="row-label" data-s="key"></span>
          <span id="stKey" class="chip-row"></span></div>
        <div class="chip-row"><span class="row-label" data-s="prog"></span>
          <select id="stProg" class="gt-select"></select></div>
      </div>
      <div class="chip-row bpm-row"><span class="row-label">BPM</span>
        <button id="stBpmDown" class="chip bpm-step" aria-label="BPM down">−</button>
        <input id="stBpm" type="range" min="40" max="160" value="${setup.bpm}">
        <button id="stBpmUp" class="chip bpm-step" aria-label="BPM up">+</button>
        <span id="stBpmVal" class="mono">${setup.bpm}</span></div>
      <div class="chip-row"><span class="row-label" data-s="mic"></span>
        <span id="stMic" class="seg"></span></div>
      <p class="hint" data-s="hint"></p>
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
        <div class="chord-line">
          <h2 id="stChord" class="chord-title"></h2>
          <span id="stMaps" class="beat-maps" hidden>
            <span id="stBeat" class="beat-strip" aria-hidden="true"></span>
            <span class="beat-sep" aria-hidden="true"></span>
            <span id="stBeatB" class="beat-strip future" aria-hidden="true"></span>
          </span>
        </div>
        <div id="stPatView" class="strum-pat"></div>
        <div id="stDiagram" class="chord-diagram"></div>
        <div id="stHist" class="strum-hist"></div>
        <div id="stFeedback" class="feedback"></div>
        <div class="chip-row bpm-row" style="justify-content:center">
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
  // same semantics as the old chip click: pick the progression; a
  // standard's canonical key adopts into the key picker on re-render.
  // wired here (once per render()) — renderSetupRows re-runs on the same
  // element and would stack listeners.
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
  ], setup.mode, id => { setup.mode = id; renderSetupRows(); });
  const progMode = setup.mode === 'prog';
  q('stOneOpts').hidden = progMode;
  q('stProgOpts').hidden = !progMode;

  // self-previewing radio-cards: pattern name + a miniature glyph strip of
  // its slot string (D/U/· in compact .strum-slot form)
  const patEl = q('stPat');
  patEl.replaceChildren();
  for (const p of PATTERNS) {
    const card = document.createElement('button');
    card.className = 'pat-card' + (p.id === setup.pattern ? ' sel' : '');
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
    card.append(name, strip);
    card.addEventListener('click', () => {
      patEl.querySelectorAll('.pat-card').forEach(c => c.classList.remove('sel'));
      card.classList.add('sel');
      setup.pattern = p.id;
    });
    patEl.append(card);
  }

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
  const progEl = q('stProg');
  progEl.replaceChildren();
  const addGroup = (label, progs, std) => {
    if (!progs.length) return;
    const og = document.createElement('optgroup');
    og.label = label;
    for (const p of progs) {
      const keyHint = std && p.key !== undefined
        ? ` (${pcName(p.key, { flat: preferFlat(p.key) })}${p.minor ? 'm' : ''})`
        : '';
      og.append(new Option(p.label + keyHint, p.id));
    }
    progEl.append(og);
  };
  addGroup(s('progPresets'), PROGRESSIONS, false);
  // one optgroup per genre present, in GENRES order
  for (const g of Object.keys(GENRES)) {
    addGroup(GENRES[g][getLang()] ?? GENRES[g].en,
      STANDARDS.filter(p => p.genre === g), true);
  }
  progEl.value = setup.prog;
  segRow(q('stMic'), [
    { id: 'off', label: s('micOff') },
    { id: 'on', label: s('micOn') },
  ], setup.micCheck ? 'on' : 'off', id => { setup.micCheck = id === 'on'; });
}

// ---------- session ----------

async function startSession() {
  if (starting) return;          // double-click while getUserMedia is pending
  starting = true;
  q('stStart').disabled = true;
  try {
    audioCtx();                  // create/resume inside the click gesture
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
    const pattern = PATTERNS.find(p => p.id === setup.pattern) || PATTERNS[0];
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
    // everything else occupies the full 4-beat bar
    const items = chords.map((c, i) => ({
      chord: c, sym: syms[i], voicing: voicings[i],
      beats: prog && prog.bars[i].half ? 2 : 4,
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
  paintBar();
  q('stBpmLive').value = setup.bpm;
  q('stBpmLiveVal').textContent = setup.bpm;
  buildPattern();
  paintHist();
  paintScore();
  highlight(-1);
  const fb = q('stFeedback');
  fb.textContent = session.micOn ? s('listening') : s('strumAlong');
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

// Song mode: a jazz standard's full chord chart scrolls under the
// metronome — Chordify-style. The chart is a grid of bar cells built from
// data/standards.js; a `half` pair renders as one split cell (2 beats per
// chord). The metronome's first bar is a count-in — clicks plus the big
// flashing number — and session beat 0 opens bar 0 on the next bar line.
// The current cell highlights and the chart's own scroll box keeps it
// centered (once per bar line, so the page never jumps).
// Two modes: follow-along (no mic — a synthesized reference voicing sounds
// at each chord change) and mic scoring (the same ≥4-of-6 vote ring, 1.8 s
// onset-freshness gate and per-string voicing template as practice.js; each
// chord slot ends pass/miss and the cell paints its verdict). All DOM is
// built here inside #songsBody; strings are a module-local {ko,en} table
// like ear.js.

import { makeChord, chordSymbol, requiredPcs } from '../theory/chords.js';
import { voicingsFor, voiceLead } from '../theory/voicings.js';
import { preferFlat, pcName } from '../theory/notes.js';
import { STANDARDS, GENRES } from '../data/standards.js';
import { segRow, showBanner } from '../ui/components.js';
import { Metronome } from '../audio/metronome.js';
import { playVoicing } from '../audio/pluck.js';
import { audioCtx } from '../audio/engine.js';
import { mic } from '../audio/input.js';
import { profileFromSpectrum, matchChord } from '../audio/chordDetect.js';
import { t, getLang, onLangChange } from '../i18n.js';
import { recordAttempt } from '../state.js';

const STR = {
  ko: {
    song: '곡',
    mode: '모드',
    follow: '따라하기',
    micScore: '마이크 채점',
    hint: '메트로놈에 맞춰 차트가 흐르고 현재 마디가 밝게 표시됩니다. 마이크 채점을 켜면 각 코드를 확인합니다.',
    start: '시작',
    end: '끝내기',
    again: '다시 하기',
    results: '결과',
    bars: '마디',
    listening: '듣는 중…',
    followAlong: '차트를 따라 연주하세요',
    clean: '좋아요!',
    missedChord: '코드가 안 들렸어요',
    accuracy: '정확도',
    bestStreak: '최고 연속',
    missed: '놓친 코드',
    followResult: '연습 완료 — 채점하려면 마이크 채점을 켜세요.',
    standards: '재즈 스탠다드',
  },
  en: {
    song: 'Song',
    mode: 'Mode',
    follow: 'Follow along',
    micScore: 'Mic scoring',
    hint: 'The chart scrolls with the metronome and the current bar stays lit. Turn on mic scoring to verify each chord.',
    start: 'Start',
    end: 'End',
    again: 'Again',
    results: 'Results',
    bars: 'Bars',
    listening: 'Listening…',
    followAlong: 'Play along with the chart',
    clean: 'Nice!',
    missedChord: 'Chord not heard',
    accuracy: 'Accuracy',
    bestStreak: 'Best streak',
    missed: 'Missed',
    followResult: 'Run complete — turn on mic scoring to be graded.',
    standards: 'Jazz standards',
  },
};

const setup = { song: STANDARDS[0].id, bpm: 120, mic: false };

let body = null;                 // #songsBody
let panel = 'setup';             // 'setup' | 'run' | 'result'
let session = null;              // see startSession() for fields
let starting = false;            // guards the async mic.start() in startSession
let metro = null;
let cellEls = [];                // .chart-cell per display bar
let lastPip = null;              // the lit .chart-beats pip (cleared each beat)
let timers = new Set();          // pending visual-sync timeouts
let pollTimer = null;
let voteRing = [];               // sliding window of recent match results

const s = k => STR[getLang()]?.[k] ?? STR.en[k] ?? k;
const q = id => body.querySelector('#' + id);

// defer a visual to an audio-clock time, tracked for cleanup (same pattern
// as strum.js/practice.js — onBeat fires ~120ms early on the audio clock)
function later(fn, ms) {
  const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
  timers.add(id);
}

// ---------- pure layout helper (exported for the selftest) ----------

// Flat slot list → display cells: a `half` pair shares one cell (2 beats
// per chord); any other slot fills its own 4-beat bar. A malformed lone
// half still gets a cell to itself rather than swallowing the next bar.
export function barCells(song) {
  const cells = [];
  const bars = song.bars;
  for (let i = 0; i < bars.length; i++) {
    if (bars[i].half && bars[i + 1] && bars[i + 1].half) {
      cells.push({ slots: [i, i + 1] });
      i++;
    } else {
      cells.push({ slots: [i] });
    }
  }
  return cells;
}

// ---------- DOM ----------

function render() {
  body.innerHTML = `
    <div id="sgSetup" class="setup-card">
      <div class="chip-row"><span class="row-label" data-s="song"></span>
        <select id="sgSong" class="gt-select"></select></div>
      <div class="chip-row bpm-row"><span class="row-label">BPM</span>
        <button id="sgBpmDown" class="chip bpm-step" aria-label="BPM down">−</button>
        <input id="sgBpm" type="range" min="40" max="160" value="${setup.bpm}">
        <button id="sgBpmUp" class="chip bpm-step" aria-label="BPM up">+</button>
        <span id="sgBpmVal" class="mono">${setup.bpm}</span></div>
      <div class="chip-row"><span class="row-label" data-s="mode"></span>
        <span id="sgMode" class="seg"></span></div>
      <p class="hint" data-s="hint"></p>
      <button id="sgStart" class="primary big" data-s="start"></button>
    </div>
    <div id="sgRun" class="setup-card" hidden>
      <div id="sgCountin" class="countin" hidden aria-hidden="true"></div>
      <div class="run-top">
        <span id="sgBars" class="mono"></span>
        <span id="sgScore" class="mono"></span>
        <button id="sgEnd" class="ghost" data-s="end"></button>
      </div>
      <div class="run-bar" aria-hidden="true"><i></i></div>
      <div class="sg-nowbar"><span id="sgNow" class="sg-now"></span></div>
      <div id="sgFeedback" class="feedback sg-fb"></div>
      <div id="sgChart" class="chart-scroll"><div id="sgCells" class="chart-grid"></div></div>
      <div class="chip-row bpm-row" style="justify-content:center">
        <span class="row-label">BPM</span>
        <button id="sgBpmLiveDown" class="chip bpm-step" aria-label="BPM down">−</button>
        <input id="sgBpmLive" type="range" min="40" max="160" value="${setup.bpm}" style="max-width:220px">
        <button id="sgBpmLiveUp" class="chip bpm-step" aria-label="BPM up">+</button>
        <span id="sgBpmLiveVal" class="mono">${setup.bpm}</span></div>
    </div>
    <div id="sgResult" class="setup-card" hidden>
      <h2 data-s="results"></h2>
      <div id="sgResultBody"></div>
      <button id="sgAgain" class="primary big" data-s="again"></button>
    </div>`;
  wire();
  fillStrings();
  renderSetupRows();
  if (session && !session.done) paintRun();
  else if (session && session.done && session.cells) paintResult();
  showPanel(panel);
}

// one bpm setter drives both sliders (setup + live) and their steppers
function setBpm(v) {
  setup.bpm = Math.min(160, Math.max(40, Math.round(v)));
  for (const [sl, val] of [['sgBpm', 'sgBpmVal'], ['sgBpmLive', 'sgBpmLiveVal']]) {
    q(sl).value = setup.bpm;
    q(val).textContent = setup.bpm;
  }
  metro?.setBpm(setup.bpm);
}

function wire() {
  q('sgStart').addEventListener('click', startSession);
  q('sgEnd').addEventListener('click', endSession);
  q('sgAgain').addEventListener('click', () => { session = null; showPanel('setup'); });
  q('sgSong').addEventListener('change', () => { setup.song = q('sgSong').value; });
  q('sgBpm').addEventListener('input', () => setBpm(+q('sgBpm').value));
  q('sgBpmLive').addEventListener('input', () => setBpm(+q('sgBpmLive').value));
  q('sgBpmDown').addEventListener('click', () => setBpm(setup.bpm - 1));
  q('sgBpmUp').addEventListener('click', () => setBpm(setup.bpm + 1));
  q('sgBpmLiveDown').addEventListener('click', () => setBpm(setup.bpm - 1));
  q('sgBpmLiveUp').addEventListener('click', () => setBpm(setup.bpm + 1));
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
    q('sgBpm').value = setup.bpm;
    q('sgBpmVal').textContent = setup.bpm;
  }
  q('sgSetup').hidden = p !== 'setup';
  q('sgRun').hidden = p !== 'run';
  q('sgResult').hidden = p !== 'result';
}

// ---------- setup ----------

function renderSetupRows() {
  // one optgroup per genre present in the catalog, in GENRES order —
  // same shape as the strum/practice pickers. A song's canonical key
  // rides in the option text: "Autumn Leaves (Gm)".
  const sel = q('sgSong');
  sel.replaceChildren();
  for (const g of Object.keys(GENRES)) {
    const progs = STANDARDS.filter(p => p.genre === g);
    if (!progs.length) continue;
    const og = document.createElement('optgroup');
    og.label = GENRES[g][getLang()] ?? GENRES[g].en;
    for (const p of progs) {
      const keyHint = Number.isInteger(p.key)
        ? ` (${pcName(p.key, { flat: preferFlat(p.key) })}${p.minor ? 'm' : ''})`
        : '';
      og.append(new Option(p.label + keyHint, p.id));
    }
    sel.append(og);
  }
  if (!STANDARDS.some(p => p.id === setup.song)) setup.song = STANDARDS[0].id;
  sel.value = setup.song;
  segRow(q('sgMode'), [
    { id: 'follow', label: s('follow') },
    { id: 'mic', label: s('micScore') },
  ], setup.mic ? 'mic' : 'follow', id => { setup.mic = id === 'mic'; });
}

// ---------- session ----------

async function startSession() {
  if (starting) return;          // double-click while getUserMedia is pending
  starting = true;
  q('sgStart').disabled = true;
  try {
    audioCtx();                  // create/resume inside the click gesture
    if (setup.mic) {
      try { await mic.start(); }
      catch (e) {
        showBanner(e && e.name === 'NotAllowedError' ? t('mic.denied') : t('mic.failed'));
        return;
      }
      // user may have left the tab while getUserMedia was pending
      if (!document.getElementById('screen-songs').classList.contains('active')) {
        mic.stop(); return;
      }
    }
    const song = STANDARDS.find(x => x.id === setup.song) || STANDARDS[0];
    // canonical key like the strum/practice pickers; minor-flagged tunes
    // (Gm, Cm…) are flat keys, so spell with flats
    const flat = preferFlat(song.key) || !!song.minor;
    const cells = barCells(song);
    const chords = song.bars.map(b => makeChord(song.key + b.off, b.q));
    // voice-lead the whole sequence up front; a null slot falls back to the
    // chord's top voicing (stays null only if it has none — that slot just
    // skips the reference strum / string template)
    const led = voiceLead(chords);
    const items = song.bars.map((b, i) => ({
      chord: chords[i],
      sym: chordSymbol(chords[i], { flat }),
      voicing: led[i] ?? voicingsFor(chords[i])[0] ?? null,
      beats: b.half ? 2 : 4,      // a `half` slot shares its bar (2 beats)
      done: false, passed: false, // mic-scoring outcome
      cell: 0, slot: 0,           // display position — filled below
      el: null,                   // .chart-sym span — filled by buildChart
    }));
    cells.forEach((cell, ci) => cell.slots.forEach((slotIdx, k) => {
      items[slotIdx].cell = ci;
      items[slotIdx].slot = k;
    }));
    session = {
      song, cells, items,
      totalBeats: items.reduce((a, it) => a + it.beats, 0),
      ci: 0,                       // index into items of the sounding chord
      itemLeft: items[0].beats,    // beats left in items[ci]
      sb: -1,                      // session beat (-1 until the count-in ends)
      countin: true,
      micOn: setup.mic,
      done: false,
      scored: 0, hits: 0, streak: 0, best: 0, missed: [],
      seenOnset: mic.lastOnset,    // attacks before Start don't count
    };
    voteRing = [];
    showPanel('run');
    paintRun();
    metro = new Metronome(onBeat);
    metro.start(setup.bpm, 4);     // all standards here are 4/4
    if (session.micOn) startPoll();
  } finally {
    starting = false;
    const b = q('sgStart');
    if (b) b.disabled = false;
  }
}

// Fires ~120ms before the beat sounds — schedule the count-in flash, the
// item tick, the beat pip, and (on bar lines) the cell highlight + scroll
// on the wall clock. Beats past the song's length trigger the result panel.
function onBeat(beatIndex, audioTime) {
  if (!session || session.done) return;
  const delay = Math.max(0, (audioTime - audioCtx().currentTime) * 1000);
  if (beatIndex < 4) { later(() => showCountin(4 - beatIndex), delay); return; }
  const sb = beatIndex - 4;                  // session beat; 0 = bar 0 beat 1
  if (sb >= session.totalBeats) { later(() => endSong(), delay); return; }
  // tickItem first so the cell/pip paint sees the item pointer already on
  // the sounding chord; barStart before beatNow so the bar-0 pip lights —
  // countin only clears inside barStart
  later(() => tickItem(sb), delay);
  if (sb % 4 === 0) later(() => barStart(sb), delay);
  later(() => beatNow(sb % 4), delay);
}

// Per-session-beat item bookkeeping: each item holds for `beats` beats —
// a `half` is 2 — then the display/mic target repoints to the next slot.
// The outgoing item is scored at its boundary (a miss if it never passed).
function tickItem(sb) {
  const se = session;
  if (!se || se.done) return;
  se.sb = sb;
  if (sb === 0) { se.ci = 0; se.itemLeft = se.items[0].beats; }
  else if (--se.itemLeft > 0) return;        // still inside the item
  else {
    scoreItem(se.items[se.ci], false);       // closed unverified → miss
    se.ci++;
    se.itemLeft = se.items[se.ci].beats;
  }
  itemStart();
}

// New item sounding: reset the vote, light its slot inside the cell, update
// the now-title — and in follow-along play the voice-led reference (mic
// mode stays silent: the mic would hear the synth and self-pass).
function itemStart() {
  const se = session;
  const it = se.items[se.ci];
  if (!it) return;
  voteRing = [];
  q('sgNow').textContent = it.sym;
  cellEls[it.cell]?.querySelectorAll('.chart-sym')
    .forEach((el, k) => el.classList.toggle('snd', k === it.slot && !it.done));
  const fb = q('sgFeedback');
  if (fb) {
    fb.textContent = se.micOn ? s('listening') : s('followAlong');
    fb.className = 'feedback sg-fb';
  }
  if (!se.micOn && it.voicing) playVoicing(it.voicing);
}

// The audible bar line: end the count-in, promote the new cell to .cur,
// demote the last to .past, and keep the playing bar centered in the
// chart's scroll box — only on bar changes, never per beat.
function barStart(sb) {
  const se = session;
  if (!se || se.done) return;
  se.countin = false;
  hideCountin();
  const bar = sb >> 2;
  if (bar > 0) {
    const prev = cellEls[bar - 1];
    if (prev) { prev.classList.remove('cur'); prev.classList.add('past'); }
  }
  const cell = cellEls[bar];
  if (cell) {
    cell.classList.add('cur');
    const box = q('sgChart');
    box.scrollTo({
      top: cell.offsetTop - (box.clientHeight - cell.offsetHeight) / 2,
      behavior: 'smooth',
    });
  }
  paintScore();
}

// live fill: light the sounding beat's pip inside the current cell
function beatNow(b) {
  const se = session;
  if (!se || se.done || se.countin) return;
  if (lastPip) { lastPip.classList.remove('now'); lastPip = null; }
  const pip = cellEls[se.sb >> 2]?.querySelectorAll('.chart-beats i')[b];
  if (pip) { pip.classList.add('now'); lastPip = pip; }
}

// Count-in overlay: the big number over the run card. .tick re-arms the CSS
// pulse each beat; with prefers-reduced-motion the number just swaps.
function showCountin(n) {
  if (!session || session.done || !session.countin) return;
  const el = q('sgCountin');
  if (!el) return;
  el.textContent = n;
  el.hidden = false;
  el.classList.remove('tick');
  void el.offsetWidth;                        // restart the animation
  el.classList.add('tick');
}

function hideCountin() {
  const el = q('sgCountin');
  if (el) el.hidden = true;
}

// ---------- run UI ----------

function paintRun() {
  hideCountin();                 // first beat re-shows it within ~25ms
  buildChart();
  // a re-render (language switch) mid-run re-applies the live state
  if (!session.countin && session.sb >= 0) {
    const bar = session.sb >> 2;
    cellEls.forEach((c, i) => {
      c.classList.toggle('past', i < bar);
      c.classList.toggle('cur', i === bar);
    });
    session.items.forEach(it => {
      if (it.done) it.el?.classList.add(it.passed ? 'good' : 'miss');
    });
    const it = session.items[session.ci];
    if (it && !it.done) it.el?.classList.add('snd');
    q('sgNow').textContent = it ? it.sym : '';
    const cell = cellEls[bar];
    const box = q('sgChart');
    if (cell && box) {
      box.scrollTop = cell.offsetTop - (box.clientHeight - cell.offsetHeight) / 2;
    }
  }
  q('sgBpmLive').value = setup.bpm;
  q('sgBpmLiveVal').textContent = setup.bpm;
  paintScore();
}

// One cell per display bar: chord symbol(s) on top — a half-bar cell splits
// into two .chart-sym spans — and a 4-pip beat strip below.
function buildChart() {
  const grid = q('sgCells');
  grid.replaceChildren();
  lastPip = null;                // old pip node is being discarded anyway
  cellEls = session.cells.map(cell => {
    const el = document.createElement('div');
    el.className = 'chart-cell';
    const syms = document.createElement('div');
    syms.className = 'chart-syms';
    cell.slots.forEach(slotIdx => {
      const it = session.items[slotIdx];
      const sp = document.createElement('span');
      sp.className = 'chart-sym' + (cell.slots.length > 1 ? ' half' : '');
      sp.textContent = it.sym;
      it.el = sp;
      syms.append(sp);
    });
    const beats = document.createElement('div');
    beats.className = 'chart-beats';
    beats.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) beats.append(document.createElement('i'));
    el.append(syms, beats);
    grid.append(el);
    return el;
  });
}

function paintScore() {
  const se = session;
  if (!se) return;
  const bar = se.countin ? 0
    : Math.min((Math.max(0, se.sb) >> 2) + 1, se.cells.length);
  q('sgBars').textContent = `${s('bars')} ${bar}/${se.cells.length}`;
  q('sgScore').textContent = se.micOn ? `✓${se.hits} ✗${se.scored - se.hits}` : '';
  const rb = q('sgRun')?.querySelector('.run-bar > i');
  if (rb) rb.style.width =
    `${Math.min(100, Math.max(0, se.sb) / se.totalBeats * 100)}%`;
}

// ---------- mic scoring ----------

// Poll ~14×/s — the same gate as practice.js: a chord passes when the
// current frame verifies AND ≥4 of the last 6 did, votes only count within
// ~1.8 s of a pick attack (older energy is residual ring), and a frame also
// needs the voicing template (≤1 dead string). Passing early latches the
// item; whatever is still unverified at the item boundary is a miss.
function startPoll() {
  stopPoll();
  pollTimer = setInterval(() => {
    const se = session;
    if (!se || se.done || se.countin || !se.micOn) return;
    const it = se.items[se.ci];
    if (!it || it.done) return;
    const spec = mic.spectrum();
    if (!spec) return;
    const prof = profileFromSpectrum(spec.db, spec.binHz,
      requiredPcs(it.chord), it.voicing);
    const res = matchChord(prof, it.chord);
    // a fresh attack re-arms the vote: drop whatever the ring still holds
    if (mic.lastOnset !== se.seenOnset) { se.seenOnset = mic.lastOnset; voteRing = []; }
    const fresh = se.seenOnset > 0 && performance.now() - se.seenOnset < 1800;
    const frameOk = res.ok && res.stringsOk !== false;
    voteRing.push(frameOk);
    if (voteRing.length > 6) voteRing.shift();
    // the current frame must verify too — a stale ring can't pass alone
    if (fresh && frameOk && voteRing.filter(Boolean).length >= 4) {
      scoreItem(it, true);
    }
  }, 70);
}

function stopPoll() { clearInterval(pollTimer); pollTimer = null; }

// Tally an item's verdict once: cell paint, streak/score bookkeeping, and a
// stats attempt timed at the item's own length. Guards on it.done so the
// poll, the item boundary, and the song end can't double-score; no-ops in
// follow-along mode (no mic, nothing to score).
function scoreItem(it, pass) {
  const se = session;
  if (!se || !se.micOn || !it || it.done) return;
  it.done = true;
  it.passed = pass;
  se.scored++;
  if (pass) { se.hits++; se.streak++; se.best = Math.max(se.best, se.streak); }
  else { se.streak = 0; se.missed.push(it.sym); }
  if (it.el) {
    it.el.classList.remove('snd');
    it.el.classList.add(pass ? 'good' : 'miss');
  }
  recordAttempt(it.sym, pass, it.beats * 60000 / setup.bpm);
  const fb = q('sgFeedback');
  if (fb) {
    fb.textContent = pass ? s('clean') : s('missedChord');
    fb.className = 'feedback sg-fb ' + (pass ? 'good' : 'bad');
  }
  paintScore();
}

// ---------- finish ----------

function cleanupAudio() {
  stopPoll();
  metro?.stop(); metro = null;
  for (const id of timers) clearTimeout(id);
  timers.clear();
  if (mic.running) mic.stop();
}

function clearLive() {
  hideCountin();
  if (lastPip) { lastPip.classList.remove('now'); lastPip = null; }
}

function endSession() {          // "끝내기" — stop the clock, show stats
  if (!session) { showPanel('setup'); return; }
  cleanupAudio();
  clearLive();
  session.done = true;
  if (session.sb <= 0) { showPanel('setup'); return; }  // nothing played
  showPanel('result');
  paintResult();
}

// the metronome hit the bar line after the last bar
function endSong() {
  const se = session;
  if (!se || se.done) return;
  scoreItem(se.items[se.ci], false);   // the last open item fails if unheard
  se.done = true;
  cleanupAudio();
  clearLive();
  cellEls.forEach(c => { c.classList.remove('cur'); c.classList.add('past'); });
  showPanel('result');
  paintResult();
}

// split out so render() can repaint it after a language switch
function paintResult() {
  const se = session;
  const barsDone = Math.min(Math.max(0, se.sb >> 2) + 1, se.cells.length);
  const head = `${se.song.label} — ${s('bars')}: ${barsDone}/${se.cells.length}<br>`;
  if (!se.micOn) {
    q('sgResultBody').innerHTML =
      head + `<span style="color:var(--dim)">${s('followResult')}</span>`;
    return;
  }
  const acc = se.scored ? Math.round(100 * se.hits / se.scored) : 0;
  const missed = [...new Set(se.missed)];
  q('sgResultBody').innerHTML = head +
    `${s('accuracy')}: ${acc}% (${se.hits}/${se.scored})<br>` +
    `${s('bestStreak')}: ${se.best}<br>` +
    (missed.length
      ? `<span style="color:var(--bad)">${s('missed')}: ${missed.join(', ')}</span>`
      : '');
}

// ---------- wiring ----------

export function initSongs() {
  body = document.getElementById('songsBody');
  render();
  onLangChange(render);          // rebuild labels; session state survives
}

// app.js calls this when leaving the songs tab: release the metronome, the
// mic, and every scheduled visual timer so nothing runs in the background.
export function suspendSongs() {
  cleanupAudio();
  clearLive();
  if (session && !session.done) {
    session.done = true;
    showPanel('setup');
  }
}

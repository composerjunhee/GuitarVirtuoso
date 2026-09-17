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
    pause: '일시정지',
    resume: '재개',
    restart: '처음부터',
    loops: '반복',
    loop1: '1번',
    loop2: '2번',
    loop3: '3번',
    loopInf: '계속',
    search: '곡 검색…',
    noMatch: '결과 없음',
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
    pause: 'Pause',
    resume: 'Resume',
    restart: 'Restart',
    loops: 'Loops',
    loop1: '1×',
    loop2: '2×',
    loop3: '3×',
    loopInf: '∞',
    search: 'Search songs…',
    noMatch: 'No matches',
  },
};

const setup = { song: STANDARDS[0].id, bpm: 120, mic: false, loops: 2 };

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
      <div class="chip-row"><input id="sgSongSearch" type="search" class="gt-search"></div>
      <div class="chip-row"><span class="row-label" data-s="song"></span>
        <select id="sgSong" class="gt-select"></select></div>
      <div class="chip-row bpm-row"><span class="row-label">BPM</span>
        <button id="sgBpmDown" class="chip bpm-step" aria-label="BPM down">−</button>
        <input id="sgBpm" type="range" min="40" max="160" value="${setup.bpm}">
        <button id="sgBpmUp" class="chip bpm-step" aria-label="BPM up">+</button>
        <span id="sgBpmVal" class="mono">${setup.bpm}</span></div>
      <div class="chip-row"><span class="row-label" data-s="mode"></span>
        <span id="sgMode" class="seg"></span></div>
      <div class="chip-row"><span class="row-label" data-s="loops"></span>
        <span id="sgLoops" class="seg"></span></div>
      <p class="hint" data-s="hint"></p>
      <button id="sgStart" class="primary big" data-s="start"></button>
    </div>
    <div id="sgRun" class="setup-card" hidden>
      <div id="sgCountin" class="countin" hidden aria-hidden="true"></div>
      <div class="run-top">
        <span id="sgBars" class="mono"></span>
        <span id="sgScore" class="mono"></span>
        <span class="run-ctl">
          <button id="sgRestart" class="ghost sg-icon" data-st="restart">↺</button>
          <button id="sgPause" class="ghost sg-icon" data-st="pause">⏸</button>
          <button id="sgEnd" class="ghost" data-s="end"></button>
        </span>
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
  q('sgPause').addEventListener('click', togglePause);
  q('sgRestart').addEventListener('click', restartSession);
  q('sgAgain').addEventListener('click', () => { session = null; showPanel('setup'); });
  q('sgSong').addEventListener('change', () => { setup.song = q('sgSong').value; });
  q('sgSongSearch').addEventListener('input', e => fillSongSelect(e.target.value));
  q('sgBpm').addEventListener('input', () => setBpm(+q('sgBpm').value));
  q('sgBpmLive').addEventListener('input', () => setBpm(+q('sgBpmLive').value));
  q('sgBpmDown').addEventListener('click', () => setBpm(setup.bpm - 1));
  q('sgBpmUp').addEventListener('click', () => setBpm(setup.bpm + 1));
  q('sgBpmLiveDown').addEventListener('click', () => setBpm(setup.bpm - 1));
  q('sgBpmLiveUp').addEventListener('click', () => setBpm(setup.bpm + 1));
}

function fillStrings() {
  body.querySelectorAll('[data-s]').forEach(el => { el.textContent = s(el.dataset.s); });
  // icon buttons carry their label in title/aria (text is a glyph)
  body.querySelectorAll('[data-st]').forEach(el => {
    el.title = s(el.dataset.st);
    el.setAttribute('aria-label', s(el.dataset.st));
  });
  q('sgSongSearch').placeholder = s('search');
  paintPauseBtn();
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

// ---------- song search ----------
// <option hidden> support is patchy cross-browser, so the filter rebuilds
// #sgSong's optgroups each keystroke instead. fold() drops case + accents,
// so "gm", "(Gm" or "autumn" all hit "Autumn Leaves (Gm)". A genre group
// drops when nothing in it matches; the current pick stays while it's
// visible, else the first hit is adopted via the normal change handler.
const foldText = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const songLabel = p => p.label + (Number.isInteger(p.key)
  ? ` (${pcName(p.key, { flat: preferFlat(p.key) })}${p.minor ? 'm' : ''})` : '');

function fillSongSelect(filter = '') {
  const sel = q('sgSong');
  const needle = foldText(filter.trim());
  sel.replaceChildren();
  for (const g of Object.keys(GENRES)) {
    const progs = STANDARDS.filter(p =>
      p.genre === g && (!needle || foldText(songLabel(p)).includes(needle)));
    if (!progs.length) continue;
    const og = document.createElement('optgroup');
    og.label = GENRES[g][getLang()] ?? GENRES[g].en;
    for (const p of progs) og.append(new Option(songLabel(p), p.id));
    sel.append(og);
  }
  if (!sel.options.length) {
    const o = new Option(s('noMatch'), '');
    o.disabled = true;
    sel.append(o);
  }
  sel.value = setup.song;
  if (sel.value !== setup.song) {          // the pick was filtered out
    const first = [...sel.options].find(o => !o.disabled);
    if (first) {
      sel.value = first.value;
      sel.dispatchEvent(new Event('change'));   // same side-effect path
    } else sel.value = '';                 // nothing matches — keep setup.song
  }
}

function renderSetupRows() {
  // one optgroup per genre present in the catalog, in GENRES order —
  // same shape as the strum/practice pickers. A song's canonical key
  // rides in the option text: "Autumn Leaves (Gm)".
  if (!STANDARDS.some(p => p.id === setup.song)) setup.song = STANDARDS[0].id;
  fillSongSelect(q('sgSongSearch').value);
  segRow(q('sgMode'), [
    { id: 'follow', label: s('follow') },
    { id: 'mic', label: s('micScore') },
  ], setup.mic ? 'mic' : 'follow', id => { setup.mic = id === 'mic'; });
  // lap count for the run: 1/2/3 passes or ∞ (play until End)
  segRow(q('sgLoops'), [
    { id: '1', label: s('loop1') },
    { id: '2', label: s('loop2') },
    { id: '3', label: s('loop3') },
    { id: 'inf', label: s('loopInf') },
  ], setup.loops === Infinity ? 'inf' : String(setup.loops),
    id => { setup.loops = id === 'inf' ? Infinity : +id; });
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
      beatShift: -4,               // sb = metro beatIndex + beatShift
      seekBeat: -1,                // beat a seek/resume pre-positioned (re-sounds, no re-tick)
      countin: true,
      paused: false,
      loops: setup.loops,          // laps to play (Infinity = until End)
      loopsDone: 0,                // laps completed so far
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
// on the wall clock. `beatShift` maps the metronome's beatIndex to a
// session beat: -4 fresh (the first bar is the count-in), or the resume/
// seek position when the clock restarts mid-song. Crossing a lap boundary
// either wraps the chart (loops remain) or ends the run.
function onBeat(beatIndex, audioTime) {
  const se = session;
  if (!se || se.done || se.paused) return;
  const delay = Math.max(0, (audioTime - audioCtx().currentTime) * 1000);
  const sb = beatIndex + se.beatShift;
  if (sb < 0) { later(() => showCountin(-sb), delay); return; }
  const lap = Math.floor(sb / se.totalBeats);
  if (lap >= se.loops) { later(() => endSong(), delay); return; }
  if (lap > se.loopsDone) {
    se.loopsDone = lap;
    // close the lap's last item, then wipe every mark for the new lap
    later(() => {
      scoreItem(se.items[se.items.length - 1], false);
      resetLap();
    }, delay);
  }
  const pos = sb % se.totalBeats;
  // tickItem first so the cell/pip paint sees the item pointer already on
  // the sounding chord; barStart before beatNow so the bar-0 pip lights —
  // countin only clears inside barStart
  later(() => tickItem(pos), delay);
  if (pos % 4 === 0) later(() => barStart(pos), delay);
  later(() => beatNow(pos % 4), delay);
}

// Per-session-beat item bookkeeping: each item holds for `beats` beats —
// a `half` is 2 — then the display/mic target repoints to the next slot.
// The outgoing item is scored at its boundary (a miss if it never passed).
function tickItem(sb) {
  const se = session;
  if (!se || se.done) return;
  if (sb === se.seekBeat) {
    // a seek/resume already placed ci/itemLeft on this beat — re-sound the
    // item (itemStart) without consuming a beat or re-scoring the last one
    se.seekBeat = -1;
    se.sb = sb;
    itemStart();
    return;
  }
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
  q('sgRun').classList.toggle('paused', !!session.paused);
  paintPauseBtn();
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
      // symbol tap = audition the voicing + seek to the slot
      sp.addEventListener('click', e => {
        e.stopPropagation();
        seekToItem(slotIdx, true);
      });
      it.el = sp;
      syms.append(sp);
    });
    const beats = document.createElement('div');
    beats.className = 'chart-beats';
    beats.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) beats.append(document.createElement('i'));
    // cell background tap = seek to the bar's first slot (no audition)
    el.addEventListener('click', () => seekToItem(cell.slots[0]));
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

// ---------- play assist: pause/resume, restart, tap-to-seek ----------

// session beat on which an item starts (sum of earlier items' lengths)
function itemBeat(se, idx) {
  let b = 0;
  for (let i = 0; i < idx; i++) b += se.items[i].beats;
  return b;
}

// (Re)start the metronome clock so its next beat lands on session beat sb.
// seekBeat marks it as pre-positioned: tickItem re-sounds the item instead
// of consuming a beat.
function startClockAt(sb) {
  const se = session;
  se.beatShift = sb;
  se.seekBeat = sb;
  metro = metro || new Metronome(onBeat);
  metro.start(setup.bpm, 4);
}

// Tap a cell → jump to that bar's first slot; tap a .chart-sym → same plus
// the voice-led reference strum. Verdicts at/after the target are cleared
// (earlier marks stay), the tally is rebuilt from the surviving marks, and
// a paused run seeks in place — staying paused with the position lit.
function seekToItem(idx, sound = false) {
  const se = session;
  if (!se || se.done) return;
  const it = se.items[idx];
  if (!it) return;
  metro?.stop();
  for (const id of timers) clearTimeout(id);
  timers.clear();
  if (sound && it.voicing) playVoicing(it.voicing);
  for (let i = idx; i < se.items.length; i++) {
    const x = se.items[i];
    x.done = false;
    x.passed = false;
    x.el?.classList.remove('good', 'miss', 'snd');
  }
  se.scored = se.items.filter(x => x.done).length;
  se.hits = se.items.filter(x => x.passed).length;
  se.missed = se.items.filter(x => x.done && !x.passed).map(x => x.sym);
  se.streak = 0;
  for (let i = idx - 1; i >= 0; i--) {
    const x = se.items[i];
    if (!x.done || !x.passed) break;
    se.streak++;
  }
  const sb = itemBeat(se, idx);
  se.ci = idx;
  se.itemLeft = it.beats;
  se.sb = sb;
  se.countin = false;            // a seek never re-runs the count-in
  voteRing = [];
  clearLive();                   // pip + countin overlay
  const bar = sb >> 2;
  cellEls.forEach((c, i) => {
    c.classList.toggle('past', i < bar);
    c.classList.toggle('cur', i === bar);
  });
  it.el?.classList.add('snd');
  q('sgNow').textContent = it.sym;
  const fb = q('sgFeedback');
  if (fb) {
    fb.textContent = se.paused ? s('pause')
      : se.micOn ? s('listening') : s('followAlong');
    fb.className = 'feedback sg-fb';
  }
  const cell = cellEls[bar];
  const box = q('sgChart');
  if (cell && box) {
    box.scrollTo({
      top: cell.offsetTop - (box.clientHeight - cell.offsetHeight) / 2,
      behavior: 'smooth',
    });
  }
  paintScore();
  if (!se.paused) startClockAt(sb);
  else { se.beatShift = sb; se.seekBeat = sb; }
}

// New lap: every cell/slot mark clears so the chart looks fresh; the
// run's score tally keeps accumulating across laps.
function resetLap() {
  const se = session;
  if (!se || se.done) return;
  se.items.forEach(it => {
    it.done = false;
    it.passed = false;
    it.el?.classList.remove('good', 'miss', 'snd');
  });
  cellEls.forEach(c => c.classList.remove('cur', 'past'));
}

// ⏸/▶ — pause freezes the clock, the poll, and every pending visual; the
// chart dims but keeps the current cell lit. Resume restarts the clock on
// the paused beat (a paused count-in simply counts in again from 4).
function togglePause() {
  const se = session;
  if (!se || se.done) return;
  if (se.paused) {
    se.paused = false;
    q('sgRun').classList.remove('paused');
    if (se.countin) {
      se.beatShift = -4;
      metro = metro || new Metronome(onBeat);
      metro.start(setup.bpm, 4);
    } else {
      startClockAt(Math.max(0, se.sb));
    }
    if (se.micOn) startPoll();
  } else {
    se.paused = true;
    metro?.stop();
    for (const id of timers) clearTimeout(id);
    timers.clear();
    stopPoll();
    clearLive();
    q('sgRun').classList.add('paused');
    const fb = q('sgFeedback');
    if (fb) { fb.textContent = s('pause'); fb.className = 'feedback sg-fb'; }
  }
  paintPauseBtn();
}

function paintPauseBtn() {
  const b = q('sgPause');
  if (!b) return;
  const paused = !!(session && session.paused && !session.done);
  b.textContent = paused ? '▶' : '⏸';
  const lbl = s(paused ? 'resume' : 'pause');
  b.title = lbl;
  b.setAttribute('aria-label', lbl);
}

// ↺ — fresh session, same setup: bar 0 with the count-in, marks cleared.
// The mic stays open; mic.start() is a no-op while it's already running.
function restartSession() {
  if (!session || starting) return;
  stopPoll();
  metro?.stop(); metro = null;
  for (const id of timers) clearTimeout(id);
  timers.clear();
  session = null;
  startSession();
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
  session.paused = false;
  q('sgRun')?.classList.remove('paused');
  session.done = true;
  // nothing played → back to setup (pos 0 mid-lap still counts as played)
  if (session.sb <= 0 && !session.loopsDone) { showPanel('setup'); return; }
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
  const head = `${se.song.label} — ${s('bars')}: ${barsDone}/${se.cells.length}` +
    (se.loops !== 1 ? ` · ${s('loops')}: ${se.loopsDone}` : '') + '<br>';
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
  // spacebar = pause/resume while the run panel is up — never inside form
  // fields, and never on a focused button (it would click AND toggle)
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space' || e.repeat || panel !== 'run' || !session || session.done) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
    e.preventDefault();
    togglePause();
  });
}

// app.js calls this when leaving the songs tab: release the metronome, the
// mic, and every scheduled visual timer so nothing runs in the background.
export function suspendSongs() {
  cleanupAudio();
  clearLive();
  q('sgRun')?.classList.remove('paused');
  if (session && !session.done) {
    session.paused = false;
    session.done = true;
    showPanel('setup');
  }
}

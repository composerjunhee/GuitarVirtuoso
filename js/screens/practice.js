// Practice screen: flashcard drills + metronome-timed progression drills.
// Input is either the real guitar (mic → chord verification) or the virtual
// fretboard (tap a shape → check). Stats persist in localStorage.

import { parseSymbol, chordSymbol, requiredPcs, bassPc, QUALITIES } from '../theory/chords.js';
import { pcName, midiToPc, STRINGS, preferFlat } from '../theory/notes.js';
import { voicingsFor, voiceLead } from '../theory/voicings.js';
import { renderChordDiagram } from '../ui/chordDiagram.js';
import { createFretboard } from '../ui/fretboard.js';
import { rootPicker, showBanner } from '../ui/components.js';
import { mic } from '../audio/input.js';
import { profileFromSpectrum, matchChord } from '../audio/chordDetect.js';
import { playVoicing } from '../audio/pluck.js';
import { Metronome } from '../audio/metronome.js';
import { audioCtx } from '../audio/engine.js';
import { DECKS, PROGRESSIONS } from '../data/progressions.js';
import { STANDARDS, GENRES } from '../data/standards.js';
import { initProgBuilder, getCustomProgressions } from './progBuilder.js';
import { t, getLang, onLangChange } from '../i18n.js';
import { settings, loadStats, recordAttempt, loadDeck } from '../state.js';

const setup = {
  mode: 'flash', input: 'mic', deck: 'starter8', prog: 'I-IV-V', key: 0, bpm: 72,
  chgPair: 'C|G', chgA: { root: 0, quality: '', bass: null },
  chgB: { root: 7, quality: '', bass: null }, chgBpm: 60, chgAuto: true,
};
let session = null;
let metro = null;
let vboard = null;
let vboardLefty = null;
let pollTimer = null;
let voteRing = [];             // sliding window of recent match results
let seenOnset = 0;             // last onset timestamp the vote consumed
let timers = new Set();        // pending metronome-sync timeouts
let ciEl = null;               // .countin overlay inside #practiceRun
let nbEl = null;               // #nextBeat row (built lazily — index.html untouched)
let chgEl = null;              // #chgRun pair panel (built lazily, like nbEl)
let pendingFocus = null;       // symbols primed by another screen's deeplink
let focusChip = null;          // transient 'focus' deck chip in the deck seg

// defer a visual to an audio-clock time, tracked for cleanup (strum.js
// uses the same pattern — onBeat fires ~120ms early on the audio clock)
function later(fn, ms) {
  const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
  timers.add(id);
}

const $ = id => document.getElementById(id);

function opts() { return { flat: settings.flat, lang: getLang() }; }

// ---------- chord-change drill ----------
// Module-local strings (delegated-module convention — i18n.js is shared).
const STR = {
  ko: {
    mode: '전환', pair: '페어', custom: '직접', weak: '취약', focus: '지정',
    auto: '자동 템포+', changes: '전환', streak: '연속',
    tempoUp: b => `템포 업! ${b}bpm`,
    sameChord: '같은 코드끼리는 전환할 수 없습니다.',
    sumChanges: '총 전환', sumStreak: '최고 연속', sumBpm: '최고 템포',
  },
  en: {
    mode: 'Changes', pair: 'Pair', custom: 'custom', weak: 'weak', focus: 'picked',
    auto: 'auto tempo+', changes: 'changes', streak: 'streak',
    tempoUp: b => `Tempo up! ${b}bpm`,
    sameChord: 'Pick two different chords.',
    sumChanges: 'Total changes', sumStreak: 'Best streak', sumBpm: 'Top tempo',
  },
};
const cs = k => STR[getLang()]?.[k] ?? STR.en[k] ?? k;

// canonical beginner switches — the preset pair chips in the chg setup
export const CHG_PAIRS = [
  ['C', 'G'], ['C', 'Am'], ['G', 'D'], ['D', 'A'],
  ['Em', 'Am'], ['G', 'Em'], ['C', 'F'], ['A', 'E'],
];
// the slot picker's quality subset, like the song editor's select
const CHG_QUALITIES = ['', 'm', '7', 'm7', 'maj7', 'sus4', 'sus2', '6', 'add9'];

// A pair is unordered: one Leitner entry covers A→B and B→A. Symbols are
// already canonical when they reach here (chordSymbol + preferFlat at
// session start), so 'F#' and 'Gb' can't fork the stats.
export function chgKey(symA, symB) {
  return 'chg:' + [symA, symB].sort().join('|');
}
const chgPairId = (a, b) => [a, b].sort().join('|');

// weakest recorded pair (≥3 attempts) → the "취약: A↔B" setup chip
function weakestChgPair() {
  const s = loadStats();
  let weak = null;
  for (const [key, e] of Object.entries(s)) {
    if (!key.startsWith('chg:') || !e || e.att < 3) continue;
    const acc = e.ok / e.att;
    if (!weak || acc < weak.acc) weak = { key, acc };
  }
  return weak;
}

// ---------- setup UI ----------

function renderSetup() {
  document.querySelectorAll('[data-pmode]').forEach(b =>
    b.classList.toggle('sel', b.dataset.pmode === setup.mode));
  document.querySelectorAll('[data-input]').forEach(b =>
    b.classList.toggle('sel', b.dataset.input === setup.input));
  document.querySelectorAll('[data-deck]').forEach(b =>
    b.classList.toggle('sel', b.dataset.deck === setup.deck));
  paintFocusChip();
  $('flashOpts').hidden = setup.mode !== 'flash';
  $('progOpts').hidden = setup.mode !== 'prog';
  $('chgOpts').hidden = setup.mode !== 'chg';
  $('inputRow').hidden = setup.mode === 'chg';   // changes are mic-only
  $('chgModeBtn').textContent = cs('mode');
  $('chgPairLabel').textContent = cs('pair');
  paintChgSetup();

  // a custom progression may have been deleted while selected — fall back
  const customs = getCustomProgressions();
  const allProgs = [...PROGRESSIONS, ...STANDARDS, ...customs];
  if (!allProgs.some(p => p.id === setup.prog)) setup.prog = PROGRESSIONS[0].id;
  fillProgSelect($('progSearch').value, customs);
  $('progSearch').placeholder = t('pr.search');
  rootPicker($('keyChips'), setup.key, id => { setup.key = id; }, opts());
}

// A primed 'focus' deck gets a transient chip after the fixed deck chips —
// it hides again the moment another deck is picked. (style.display, not
// `hidden` — .chip's inline-flex beats the attribute.)
function paintFocusChip() {
  const on = setup.deck === 'focus';
  if (on && !focusChip) {
    focusChip = document.createElement('button');
    focusChip.className = 'chip sel';
    focusChip.addEventListener('click', renderSetup);   // already selected
    document.querySelector('[data-deck="weak"]')?.after(focusChip);
  }
  if (focusChip) {
    focusChip.style.display = on ? '' : 'none';
    if (on) {
      const shown = [...new Set(pendingFocus)].slice(0, 3).join('·');
      focusChip.textContent = `${cs('focus')}: ${shown}`;
    }
  }
}

// ---------- chg setup UI ----------

// Preset chips + the weakest-pair suggestion + 'custom'. Chips carry the
// canonical (sorted) pair id so a weak pair that duplicates a preset just
// merges into it instead of showing twice.
function paintChgSetup() {
  const wrap = $('chgPairs');
  wrap.replaceChildren();
  const seen = new Set();
  const mk = (id, label, pair) => {
    if (seen.has(id)) return;
    seen.add(id);
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = label;
    b.dataset.pid = id;
    b.addEventListener('click', () => {
      setup.chgPair = id;
      if (pair) {
        setup.chgA = parseSymbol(pair[0]);
        setup.chgB = parseSymbol(pair[1]);
      }
      renderSetup();
    });
    wrap.append(b);
  };
  for (const [a, b] of CHG_PAIRS) mk(chgPairId(a, b), `${a}↔${b}`, [a, b]);
  const weak = weakestChgPair();
  if (weak) {
    const [a, b] = weak.key.slice(4).split('|');
    mk(chgPairId(a, b), `${cs('weak')}: ${a}↔${b}`, [a, b]);
  }
  mk('custom', cs('custom'), null);
  // a stats reset may have orphaned the remembered pick — fall back
  if (!seen.has(setup.chgPair)) {
    setup.chgPair = chgPairId(...CHG_PAIRS[0]);
    setup.chgA = parseSymbol(CHG_PAIRS[0][0]);
    setup.chgB = parseSymbol(CHG_PAIRS[0][1]);
  }
  [...wrap.children].forEach(c =>
    c.classList.toggle('sel', c.dataset.pid === setup.chgPair));
  $('chgCustom').hidden = setup.chgPair !== 'custom';
  paintChgSlot('A');
  paintChgSlot('B');
  $('chgAuto').classList.toggle('sel', setup.chgAuto);
  $('chgAuto').textContent = cs('auto');
}

function paintChgSlot(slot) {
  const chord = slot === 'A' ? setup.chgA : setup.chgB;
  $('chgSlot' + slot).textContent =
    `${slot}: ${chordSymbol(chord, { flat: settings.flat })}`;
}

// one slot picker open at a time — the song editor's rootPicker + quality
// <select> pattern, shrunk to the chg subset
function openChgPick(slot) {
  const panel = $('chgPick' + slot);
  const show = panel.hidden;
  $('chgPickA').hidden = true;
  $('chgPickB').hidden = true;
  if (!show) return;
  const chord = slot === 'A' ? setup.chgA : setup.chgB;
  rootPicker($('chgRoots' + slot), chord.root,
    pc => { chord.root = pc; paintChgSlot(slot); }, opts());
  $('chgQual' + slot).value = chord.quality;
  panel.hidden = false;
}

// ---------- song search ----------
// <option hidden> is patchy cross-browser, so the filter rebuilds the
// select's optgroups per keystroke instead. fold() drops case + accents so
// "gm", "(Gm" or "autumn" all hit "Autumn Leaves (Gm)". The current pick
// stays while visible, else the first hit is adopted via the normal
// change handler (which also adopts a standard's canonical key).
const foldText = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const progLabel = (p, std) => p.label + (std && Number.isInteger(p.key)
  ? ` (${pcName(p.key, { flat: preferFlat(p.key) })}${p.minor ? 'm' : ''})` : '');

function fillProgSelect(filter = '', customs = getCustomProgressions()) {
  const sel = $('progChips');
  const needle = foldText(filter.trim());
  sel.replaceChildren();
  const addGroup = (label, progs, std) => {
    const hits = progs.filter(p => !needle || foldText(progLabel(p, std)).includes(needle));
    if (!hits.length) return;
    const og = document.createElement('optgroup');
    og.label = label;
    for (const p of hits) og.append(new Option(progLabel(p, std), p.id));
    sel.append(og);
  };
  addGroup(t('pr.progPresets'), PROGRESSIONS, false);
  // one optgroup per genre present, in GENRES order
  for (const g of Object.keys(GENRES)) {
    addGroup(GENRES[g][getLang()] ?? GENRES[g].en,
      STANDARDS.filter(p => p.genre === g), true);
  }
  addGroup(t('pr.myProgs'), customs, false);
  if (!sel.options.length) {
    const o = new Option(t('pr.noMatch'), '');
    o.disabled = true;
    sel.append(o);
  }
  sel.value = setup.prog;
  if (sel.value !== setup.prog) {            // the pick was filtered out
    const first = [...sel.options].find(o => !o.disabled);
    if (first) {
      sel.value = first.value;
      sel.dispatchEvent(new Event('change'));
    } else sel.value = '';
  }
}

// the 10 weakest recorded chords (box ≤ 2) — the 'weak' deck and also the
// fallback when a focus deeplink primes nothing usable
function weakDeck() {
  const s = loadStats();
  return Object.entries(s)
    // parseable chord symbols only — interval/note/prog stat keys must
    // not crowd real chords out of the 10-slot weak deck
    .filter(([sym, e]) => e.att > 0 && e.box <= 2 && parseSymbol(sym))
    .sort((a, b) => a[1].box - b[1].box || (a[1].ok / a[1].att) - (b[1].ok / b[1].att))
    .slice(0, 10).map(([sym]) => sym);
}

function resolveDeck() {
  if (setup.deck === 'custom') return loadDeck();
  if (setup.deck === 'weak') return weakDeck();
  if (setup.deck === 'focus') {
    const focus = expandFocus(pendingFocus);
    return focus.length ? focus : weakDeck();
  }
  return DECKS[setup.deck] || [];
}

// ---------- stats → practice deeplinks ----------

// A focus drill repeats its chords so the session isn't a one-off:
// 1 chord → 8 rounds, 2 → 4× each, n → ceil(8/n) passes. The session's
// shuffle+slice(0,10) trims any overshoot.
export function expandFocus(symbols, target = 8) {
  const okSym = sym => typeof sym === 'string' && !!parseSymbol(sym);
  const uniq = [...new Set((symbols || []).filter(okSym))];
  if (!uniq.length) return [];
  const out = [];
  for (let i = 0, reps = Math.ceil(target / uniq.length); i < reps; i++)
    out.push(...uniq);
  return out;
}

// Entry point other screens call before switching to the practice tab:
//   primePractice({mode:'flash', focus:['Am','C']}) — drill just these
//   primePractice({mode:'flash', deck:'weak'})    — weak-deck session
//   primePractice({mode:'chg', pair:['C','G']})   — change drill on a pair
// Only mutates `setup`; safe to call before initPractice ran (the repaint
// is DOM-guarded). Prime first, THEN click the practice tab.
export function primePractice(o = {}) {
  if (o.mode === 'flash') {
    setup.mode = 'flash';
    if (Array.isArray(o.focus)) {
      pendingFocus = o.focus.filter(sym => typeof sym === 'string' && parseSymbol(sym));
      setup.deck = pendingFocus.length ? 'focus' : 'weak';
    } else if (o.deck) {
      pendingFocus = null;
      setup.deck = o.deck;
    }
  } else if (o.mode === 'chg' && Array.isArray(o.pair) && o.pair.length === 2) {
    const ca = parseSymbol(o.pair[0]), cb = parseSymbol(o.pair[1]);
    // unparseable input or the same chord twice → nothing to prime
    if (ca && cb && (ca.root !== cb.root || ca.quality !== cb.quality)) {
      setup.mode = 'chg';
      setup.chgA = { root: ca.root, quality: ca.quality, bass: null };
      setup.chgB = { root: cb.root, quality: cb.quality, bass: null };
      const id = chgPairId(chordSymbol(ca, { flat: preferFlat(ca.root) }),
                           chordSymbol(cb, { flat: preferFlat(cb.root) }));
      const weak = weakestChgPair();
      const weakId = weak ? chgPairId(...weak.key.slice(4).split('|')) : null;
      // preset/weak chips carry canonical pair ids — a pair outside them
      // is shown as the 'custom' pick with the slots already filled
      setup.chgPair =
        (id === weakId || CHG_PAIRS.some(([a, b]) => chgPairId(a, b) === id))
          ? id : 'custom';
    }
  }
  // the setup card is rendered once at init — repaint if it exists
  if (typeof document !== 'undefined' && $('practiceSetup')) renderSetup();
}

// ---------- session ----------

async function startSession() {
  if (setup.mode === 'chg') return startChg();
  let items;   // [{sym, chord, scored}]
  if (setup.mode === 'flash') {
    const symbols = resolveDeck();
    if (!symbols.length) { showBanner(t('pr.deckEmpty'), 4000, 'info'); return; }
    items = shuffle(symbols).slice(0, 10)
      .map(sym => ({ sym, chord: parseSymbol(sym), scored: false }))
      .filter(x => x.chord);
  } else {
    const prog = [...PROGRESSIONS, ...STANDARDS, ...getCustomProgressions()]
      .find(p => p.id === setup.prog);
    if (!prog) { showBanner(t('pr.deckEmpty'), 4000, 'info'); return; }
    // minor-key standards live in flat keys (Gm, Cm…) — spell with flats
    const flat = preferFlat(setup.key) || !!prog.minor;
    items = prog.bars.map(b => {
      const chord = { root: (setup.key + b.off) % 12, quality: b.q, bass: null };
      return { sym: chordSymbol(chord, { flat }),
               chord, scored: false,
               // a `half` bar lasts 2 beats; the next half shares its bar.
               // custom songs may carry an explicit `beats` (1 or 3)
               beats: b.beats || (b.half ? 2 : 4) };
    });
    // voice-lead the chain once: the displayed shape doubles as the mic
    // template, so nearby-position voicings are what the player must play
    const led = voiceLead(items.map(i => i.chord));
    items.forEach((it, i) => { it.voicing = led[i] ?? voicingsFor(it.chord)[0] ?? null; });
  }
  if (!items.length) { showBanner(t('pr.deckEmpty'), 4000, 'info'); return; }

  if (setup.input === 'mic') {
    try { await mic.start(); }
    catch (e) {
      showBanner(e && e.name === 'NotAllowedError' ? t('mic.denied') : t('mic.failed'));
      return;
    }
  }

  session = {
    items, idx: 0, results: [], t0: 0, done: false,
    progMode: setup.mode === 'prog',
    timed: setup.mode === 'prog' && setup.input === 'mic',  // metronome drives
    advancing: false,
    countin: false,              // suppresses the vote during the count-in
    nextAt: 0,                   // session beat when the current item ends
    sb: -1,                      // current session beat (-1 = count-in)
  };
  $('practiceSetup').hidden = true;
  $('practiceResult').hidden = true;
  $('practiceRun').hidden = false;
  $('runDiagram').hidden = false;      // chg mode hides these — restore
  $('skipChord').hidden = false;
  if (chgEl) chgEl.hidden = true;
  hideCountin();
  showTarget();
  startPoll();

  if (session.timed) {
    // 4-beat count-in: clicks + a flashing number run while the mic stays
    // unscored; session beat 0 (bar 0, item 0) opens on the next bar line
    session.countin = true;
    session.nextAt = items[0].beats || 4;
    metro = new Metronome((beat, atTime) => {
      const delay = Math.max(0, (atTime - audioCtx().currentTime) * 1000);
      if (beat < 4) { later(() => showCountin(4 - beat), delay); return; }
      const sb = beat - 4;
      later(() => {
        if (!session) return;
        session.sb = sb;
        beatNow(sb % 4);                            // live beat pip
      }, delay);
      if (sb === 0) {
        later(() => {
          if (!session || session.done) return;
          session.countin = false;
          hideCountin();
          // item 0's clock starts with the session, not at the click
          session.t0 = performance.now();
          paintNextBeat();   // bar-1 chips promote .up → .snd
        }, delay);
      } else if (sb === session.nextAt) {
        later(onBarBoundary, delay);
      }
    });
    metro.start(setup.bpm, 4);
  }
  paintNextBeat();               // nextAt is final now (timed) / hides (untimed)
}

// #nextBeat: two adjacent bar-map strips under the target chord (timed
// mode is always 4/4). Strip A maps the current bar — a cell where an
// item starts widens into a chip carrying its symbol (.snd sounding now,
// .up later this bar, .past already over; no start = all pips, the
// previous chord still sounds). Strip B maps the NEXT bar, smaller and
// dimmer, so a half-bar change is visible in its landing cell before the
// bar line promotes it. Built lazily — index.html is out of scope; hidden
// in flashcard/virtual modes.
function ensureNextBeat() {
  if (nbEl) return;
  nbEl = document.createElement('div');
  nbEl.id = 'nextBeat';
  nbEl.className = 'next-row';
  const maps = document.createElement('span');
  maps.className = 'beat-maps';
  const mkStrip = future => {
    const strip = document.createElement('span');
    strip.className = 'beat-strip' + (future ? ' future' : '');
    strip.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('i');
      c.className = 'beat-cell';
      strip.append(c);
    }
    return strip;
  };
  const sep = document.createElement('span');
  sep.className = 'beat-sep';
  sep.setAttribute('aria-hidden', 'true');
  maps.append(mkStrip(false), sep, mkStrip(true));
  nbEl.append(maps);
  $('targetChord').after(nbEl);
}

function paintNextBeat() {
  ensureNextBeat();
  const show = !!(session && !session.done && session.timed);
  nbEl.hidden = !show;
  if (!show) return;
  const now = session.countin ? -1 : session.sb;
  const w0 = now - (now % 4);      // -1 → 0: count-in shows bar 0
  const [stripA, sep, stripB] = nbEl.firstElementChild.children;
  paintBarMapEl(stripA, w0, now);
  // last bars of the progression: no item starts in the next window, so
  // the future strip (and its divider) hide gracefully
  const future = paintBarMapEl(stripB, w0 + 4, now);
  stripB.hidden = !future;
  sep.hidden = !future;
}

// Paint one bar-map strip for session-beat window [w0, w0+4): locate the
// item covering w0 by walking intervals from the live pointer (item idx
// covers [nextAt - beats, nextAt)), then chip every start in the window.
// `.now` is beatNow's pip — classes toggle per cell only. Returns whether
// any cell got a chip (callers hide an empty future strip).
function paintBarMapEl(strip, w0, now) {
  const items = session.items;
  let k = session.idx, s = session.nextAt - items[k].beats;
  while (k > 0 && w0 < s) { k--; s -= items[k].beats; }
  while (k < items.length && w0 >= s + items[k].beats) { s += items[k].beats; k++; }
  const map = new Array(4).fill(null);
  while (k < items.length && s < w0 + 4) {
    if (s >= w0) {
      const end = s + items[k].beats;
      map[s - w0] = { sym: items[k].sym,
        cls: now < s ? 'up' : now < end ? 'snd' : 'past' };
    }
    s += items[k].beats; k++;
  }
  let any = false;
  [...strip.children].forEach((c, i) => {
    const m = map[i];
    any = any || !!m;
    c.classList.toggle('chip', !!m);
    c.classList.toggle('snd', !!m && m.cls === 'snd');
    c.classList.toggle('up', !!m && m.cls === 'up');
    c.classList.toggle('past', !!m && m.cls === 'past');
    c.textContent = m ? m.sym : '';
  });
  return any;
}

// live fill: light the sounding beat's pip — strip A only (no-ops when
// the row is hidden)
function beatNow(b) {
  if (!nbEl || nbEl.hidden) return;
  const strip = nbEl.querySelector('.beat-strip');
  [...strip.children].forEach((c, i) => c.classList.toggle('now', i === b));
}

// Count-in overlay: a huge beat number floats over the run card. .tick
// re-arms the CSS pulse each beat; prefers-reduced-motion → plain swap.
function showCountin(n) {
  if (!session || session.done || !session.countin) return;
  if (!ciEl) {
    ciEl = document.createElement('div');
    ciEl.className = 'countin';
    ciEl.setAttribute('aria-hidden', 'true');
    $('practiceRun').append(ciEl);
  }
  ciEl.textContent = n;
  ciEl.hidden = false;
  ciEl.classList.remove('tick');
  void ciEl.offsetWidth;                   // restart the animation
  ciEl.classList.add('tick');
}

function hideCountin() { if (ciEl) ciEl.hidden = true; }

function showTarget() {
  const it = session.items[session.idx];
  session.t0 = performance.now();
  session.advancing = false;
  voteRing = [];
  $('targetChord').textContent = it.sym;
  const v = it.voicing ?? voicingsFor(it.chord)[0] ?? null;
  it.voicing = v;              // the displayed shape doubles as the mic template
  if (v) renderChordDiagram($('runDiagram'), v, { lefty: settings.lefty });
  $('runFeedback').textContent = t(setup.input === 'mic' ? 'pr.listening' : 'pr.tapFrets');
  $('runFeedback').className = 'feedback';
  $('runHeard').replaceChildren();
  $('runProgress').textContent = `${session.idx + 1}/${session.items.length}`;
  const rb = document.querySelector('#practiceRun .run-bar > i');
  if (rb) rb.style.width = `${session.idx / session.items.length * 100}%`;
  paintNextBeat();               // timed: repainted again after nextAt bumps
  const showVirtual = setup.input === 'virtual';
  $('virtualBoard').hidden = !showVirtual;
  $('submitVirtual').hidden = !showVirtual;
  if (showVirtual) {
    if (!vboard || vboardLefty !== settings.lefty) {
      vboard = createFretboard($('virtualBoard'),
        { interactive: true, lefty: settings.lefty });
      vboardLefty = settings.lefty;
    }
    vboard.clear();
  }
}

function advanceTarget() {
  if (!session || session.done || session.advancing) return;
  session.advancing = true;
  if (session.idx + 1 >= session.items.length) { finish(); return; }
  session.idx++;
  showTarget();
}

// Timed mode: an item boundary scored the outgoing chord if it never
// passed. Boundaries land on the item's own length — a `half` item ends on
// beat 3 of its bar (or wherever it started + 2 beats).
function onBarBoundary() {
  if (!session || session.done) return;
  const it = session.items[session.idx];
  if (!it.scored) markResult(false);
  session.advancing = false;                         // item change always advances
  advanceTarget();
  if (session && !session.done)
    session.nextAt += session.items[session.idx].beats || 4;
  paintNextBeat();
}

function markResult(correct) {
  const it = session.items[session.idx];
  if (it.scored) return;
  it.scored = true;
  const dt = performance.now() - session.t0;
  session.results.push({ sym: it.sym, correct, dt });
  recordAttempt(it.sym, correct, dt);
  const ok = session.results.filter(r => r.correct).length;
  $('runScore').textContent = `✓${ok} ✗${session.results.length - ok}`;
}

function onCorrect() {
  const it = session.items[session.idx];
  if (it.scored && !session.timed) return;
  markResult(true);
  $('runFeedback').textContent = t('pr.correct');
  $('runFeedback').className = 'feedback good';
  if (!session.timed) {
    // flashcards / virtual progressions advance on success; timed mode waits
    // for the bar boundary.
    session.advancing = true;
    setTimeout(() => {
      session.advancing = false;
      advanceTarget();
    }, 900);
  }
}

function onSkip() {
  if (!session || session.done || session.countin) return;
  if (session.timed) { markResult(false); return; }  // bar boundary advances
  markResult(false);
  advanceTarget();
}

// ---------- chord-change run ----------

// Pair panel inside #practiceRun: two named mini diagrams with the
// sounding chord lit (.cur) and a 4-pip beat row under them. Built lazily
// like nbEl; the single-target #runDiagram is hidden while it shows.
function ensureChgRun() {
  if (!chgEl) {
    chgEl = document.createElement('div');
    chgEl.id = 'chgRun';
    const pair = document.createElement('div');
    pair.className = 'chg-pair';
    chgEl._slots = [];
    for (let i = 0; i < 2; i++) {
      if (i === 1) {
        const ar = document.createElement('span');
        ar.className = 'chg-arrow';
        ar.textContent = '⇄';
        ar.setAttribute('aria-hidden', 'true');
        pair.append(ar);
      }
      const slot = document.createElement('div');
      slot.className = 'chg-slot';
      const nm = document.createElement('div');
      nm.className = 'chg-name';
      const dg = document.createElement('div');
      dg.className = 'chg-diag chord-diagram';
      slot.append(nm, dg);
      pair.append(slot);
      chgEl._slots.push({ slot, nm, dg });
    }
    const beats = document.createElement('div');
    beats.className = 'chg-beats';
    beats.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) beats.append(document.createElement('i'));
    chgEl._beats = beats;
    chgEl.append(pair, beats);
    $('runDiagram').before(chgEl);
  }
  chgEl.hidden = false;
}

// One bar = one chord; A | B | A | B … Each bar is a scored change attempt
// under the unordered chg: key — bar 0 counts too (it's the landing that
// matters, not where the hand started). The mic vote is exactly the prog
// drill's: same spectrum → profile → matchChord → ≥4-of-6 ring inside the
// 1.8 s onset-fresh window; only the pass action differs.
async function startChg() {
  const chA = setup.chgA, chB = setup.chgB;
  const symA = chordSymbol(chA, { flat: preferFlat(chA.root) });
  const symB = chordSymbol(chB, { flat: preferFlat(chB.root) });
  if (symA === symB) { showBanner(cs('sameChord'), 4000, 'info'); return; }
  try { await mic.start(); }
  catch (e) {
    showBanner(e && e.name === 'NotAllowedError' ? t('mic.denied') : t('mic.failed'));
    return;
  }
  const items = [chA, chB].map((chord, i) => ({
    sym: i ? symB : symA, chord, scored: false, beats: 4 }));
  // voice-lead the pair once — the shown shape doubles as the mic template
  const led = voiceLead(items.map(it => it.chord));
  items.forEach((it, i) => { it.voicing = led[i] ?? voicingsFor(it.chord)[0] ?? null; });
  session = {
    items, idx: 0, results: [], t0: 0, done: false,
    chgMode: true, timed: false,          // own bar machinery — not prog's
    advancing: false, countin: true, nextAt: 0, sb: -1,
    chg: {
      key: chgKey(symA, symB),
      bpm: setup.chgBpm, topBpm: setup.chgBpm, auto: setup.chgAuto,
      streak: 0, best: 0, changes: 0, oks: 0,
      bar: -1, barScored: true, lastOk: null,
    },
  };
  $('practiceSetup').hidden = true;
  $('practiceResult').hidden = true;
  $('practiceRun').hidden = false;
  $('runDiagram').hidden = true;
  $('skipChord').hidden = true;
  $('virtualBoard').hidden = true;
  $('submitVirtual').hidden = true;
  if (nbEl) nbEl.hidden = true;
  const rb = document.querySelector('#practiceRun .run-bar > i');
  if (rb) rb.style.width = '0%';
  hideCountin();
  ensureChgRun();
  chgEl._slots.forEach((o, i) => {        // fixed for the whole run
    o.dg.replaceChildren();
    if (items[i].voicing)
      renderChordDiagram(o.dg, items[i].voicing, { lefty: settings.lefty });
  });
  $('runProgress').textContent = `${symA}⇄${symB}`;
  paintChgScore();
  paintChg();
  startPoll();
  // same audio-clock scheduling as the timed prog drill: the first bar is
  // a 4-beat count-in (unscored), then every 4th session beat is a bar line
  metro = new Metronome((beat, atTime) => {
    const delay = Math.max(0, (atTime - audioCtx().currentTime) * 1000);
    if (beat < 4) { later(() => showCountin(4 - beat), delay); return; }
    const sb = beat - 4;
    later(() => {
      if (!session || session.done) return;
      session.sb = sb;
      chgBeatNow(sb % 4);
    }, delay);
    if (sb === 0) {
      later(() => {
        if (!session || session.done) return;
        session.countin = false;
        hideCountin();
        chgBarStart(0);
      }, delay);
    } else if (sb % 4 === 0) {
      later(() => chgBarStart(sb / 4), delay);
    }
  });
  metro.start(setup.chgBpm, 4);
}

// bar line: the outgoing bar misses if it never landed, then the target
// flips and a fresh vote window opens
function chgBarStart(bar) {
  if (!session || session.done) return;
  const c = session.chg;
  if (c.bar >= 0 && !c.barScored) chgScore(false);
  c.bar = bar;
  c.barScored = false;
  session.idx = bar % 2;
  session.t0 = performance.now();
  voteRing = [];
  paintChg();
}

// one attempt — an early in-bar detect (ok) or the bar-line miss. Records
// under the unordered pair key only; the chords stay out of chord mastery.
function chgScore(ok) {
  if (!session || session.done) return;
  const c = session.chg;
  if (c.barScored) return;
  c.barScored = true;
  c.changes++;
  const dt = ok ? performance.now() - session.t0 : 0;
  if (ok) { c.oks++; c.streak++; c.best = Math.max(c.best, c.streak); }
  else c.streak = 0;
  session.results.push({ sym: session.items[session.idx].sym, correct: ok, dt });
  recordAttempt(c.key, ok, dt);
  c.lastOk = ok;
  if (ok && c.auto && c.streak % 8 === 0 && c.bpm < 140) {
    c.bpm += 5;
    c.topBpm = Math.max(c.topBpm, c.bpm);
    metro?.setBpm(c.bpm);
    showBanner(cs('tempoUp')(c.bpm), 2500);
  }
  paintChgFeedback();
  paintChgScore();
}

function paintChg() {
  chgEl._slots.forEach((o, i) => {
    o.nm.textContent = session.items[i].sym;
    o.slot.classList.toggle('cur', i === session.idx);
  });
  $('targetChord').textContent = session.items[session.idx].sym;
  $('runHeard').replaceChildren();
  paintChgFeedback();
}

// the last change's verdict stays up through the next bar
function paintChgFeedback() {
  const fb = $('runFeedback');
  const lastOk = session.chg.lastOk;
  if (lastOk == null) {
    fb.textContent = t('pr.listening');
    fb.className = 'feedback';
  } else {
    fb.textContent = lastOk ? '✓' : '✕';
    fb.className = 'feedback ' + (lastOk ? 'good' : 'bad');
  }
}

function paintChgScore() {
  const c = session.chg;
  $('runScore').textContent =
    `${cs('changes')} ${c.changes} · ${cs('streak')} ${c.streak} · ${c.bpm}bpm`;
}

// live beat fill: the 4 pips + the run-bar track fill across the bar
function chgBeatNow(b) {
  if (!chgEl) return;
  [...chgEl._beats.children].forEach((el, i) =>
    el.classList.toggle('now', i === b));
  const rb = document.querySelector('#practiceRun .run-bar > i');
  if (rb) rb.style.width = `${(b + 1) / 4 * 100}%`;
}

// End button lands here for chg sessions — the drill is endless, so End
// IS the natural finish and shows the summary instead of quitting silently.
function finishChg() {
  if (!session || session.done) return;
  session.done = true;
  stopPoll();
  metro?.stop(); metro = null;
  for (const id of timers) clearTimeout(id);
  timers.clear();
  hideCountin();
  mic.stop();
  $('practiceRun').hidden = true;
  $('practiceResult').hidden = false;
  const c = session.chg;
  const acc = c.changes ? Math.round(100 * c.oks / c.changes) : 0;
  $('resultBody').innerHTML =
    `${cs('sumChanges')}: ${c.changes}<br>` +
    `${t('pr.accuracy')}: ${acc}%<br>` +
    `${cs('sumStreak')}: ${c.best}<br>` +
    `${cs('sumBpm')}: ${c.topBpm}bpm`;
}

// ---------- checking ----------

// Mic path: poll spectrum ~14×/s; a chord passes when ≥4 of the last 6
// frames verify — tolerates the noisy frames a real strum produces.
// Two extra gates: a frame also needs the voicing template (≥1 dead string
// allowed), and votes only count within ~1.8 s of a pick attack — anything
// older is residual ring, not a strum.
function startPoll() {
  stopPoll();
  pollTimer = setInterval(() => {
    if (!session || session.done || session.countin) return;
    const spec = mic.spectrum();
    if (!spec) return;
    const it = session.items[session.idx];
    if (it.voicing === undefined) it.voicing = voicingsFor(it.chord)[0] || null;
    const prof = profileFromSpectrum(spec.db, spec.binHz,
      requiredPcs(it.chord), it.voicing);
    const res = matchChord(prof, it.chord);
    paintHeard(it.chord, res);
    // a fresh attack re-arms the vote: drop whatever the ring still holds
    if (mic.lastOnset !== seenOnset) { seenOnset = mic.lastOnset; voteRing = []; }
    const fresh = seenOnset > 0 && performance.now() - seenOnset < 1800;
    const frameOk = res.ok && res.stringsOk !== false;
    voteRing.push(frameOk);
    if (voteRing.length > 6) voteRing.shift();
    // the current frame must verify too — without this a stale ring can
    // pass the chord on the frame after the spectrum already moved on
    if (fresh && frameOk && voteRing.filter(Boolean).length >= 4) {
      if (session.chgMode) chgScore(true); else onCorrect();
    }
  }, 70);
}

function stopPoll() { clearInterval(pollTimer); pollTimer = null; }

function paintHeard(chord, res) {
  const el = $('runHeard');
  el.replaceChildren();
  for (const pc of requiredPcs(chord)) {
    const s = document.createElement('span');
    s.className = res.heard.has(pc) ? 'hit' : 'miss';
    s.textContent = pcName(pc, opts()) + ' ';
    el.append(s);
  }
  if (res.bassPc != null && res.bassPc !== bassPc(chord)) {
    const s = document.createElement('span');
    s.className = 'miss';
    s.textContent = `bass:${pcName(res.bassPc, opts())}`;
    el.append(s);
  }
  // voicing template: name the strings that should ring but don't — a pc
  // row can't tell a dead B string from a detuned one
  if (res.strings) {
    for (const st of res.strings) {
      if (st.ok) continue;
      const sp = document.createElement('span');
      sp.className = 'miss';
      // i18n.js isn't ours to extend — inline the tiny label per language
      sp.textContent = (getLang() === 'ko' ? `${st.s + 1}번 줄` : `str ${st.s + 1}`) +
        (st.heard != null ? ':' + pcName(st.heard, opts()) : '');
      el.append(sp);
    }
  }
}

// Virtual path: evaluate the tapped shape on submit.
function checkVirtual() {
  if (!session || session.done) return;
  const it = session.items[session.idx];
  if (it.scored && !session.timed) return;
  const shape = vboard.getShape();
  const need = requiredPcs(it.chord);
  const heard = new Set();
  let bassNote = null;
  for (let s = 0; s < 6; s++) {
    if (shape[s] < 0) continue;
    const pc = midiToPc(STRINGS[s] + shape[s]);
    heard.add(pc);
    if (bassNote === null) bassNote = pc;
  }
  paintHeard(it.chord, { heard, bassPc: bassNote });
  let missing = [...need].filter(pc => !heard.has(pc));
  // fifth is omittable in >3-pc chords — same rule as voicings.js/chordDetect
  if (need.size > 3) missing = missing.filter(pc => pc !== (it.chord.root + 7) % 12);
  if (missing.length === 0 && bassNote === bassPc(it.chord)) onCorrect();
  else {
    $('runFeedback').textContent = t('pr.wrong');
    $('runFeedback').className = 'feedback bad';
  }
}

// ---------- finish ----------

function finish() {
  session.done = true;
  stopPoll();
  metro?.stop(); metro = null;
  for (const id of timers) clearTimeout(id);
  timers.clear();
  hideCountin();
  mic.stop();                        // release the mic indicator
  $('practiceRun').hidden = true;
  $('practiceResult').hidden = false;
  const ok = session.results.filter(r => r.correct);
  const acc = session.results.length
    ? Math.round(100 * ok.length / session.results.length) : 0;
  const avg = ok.length
    ? (ok.reduce((a, r) => a + r.dt, 0) / ok.length / 1000).toFixed(1) : '—';
  const weak = session.results.filter(r => !r.correct).map(r => r.sym);
  $('resultBody').innerHTML =
    `${t('pr.accuracy')}: ${acc}% (${ok.length}/${session.results.length})<br>` +
    `${t('pr.avgTime')}: ${avg}s<br>` +
    (weak.length ? `<span class="weak">${t('pr.weakChords')}: ${weak.join(', ')}</span>` : '');
}

export function endPractice() {   // leaving the tab mid-session
  if (session && !session.done) {
    session.done = true; stopPoll(); metro?.stop(); metro = null; mic.stop();
    for (const id of timers) clearTimeout(id);
    timers.clear();
    hideCountin();
  }
}

// ---------- wiring ----------

export function initPractice() {
  document.querySelectorAll('[data-pmode]').forEach(b =>
    b.addEventListener('click', () => { setup.mode = b.dataset.pmode; renderSetup(); }));
  document.querySelectorAll('[data-input]').forEach(b =>
    b.addEventListener('click', () => { setup.input = b.dataset.input; renderSetup(); }));
  document.querySelectorAll('[data-deck]').forEach(b =>
    b.addEventListener('click', () => { setup.deck = b.dataset.deck; renderSetup(); }));
  $('progSearch').addEventListener('input', e => fillProgSelect(e.target.value));
  // same semantics as the old chip click: pick the progression, and a
  // standard's canonical key adopts into the key picker on re-render
  $('progChips').addEventListener('change', () => {
    const p = [...PROGRESSIONS, ...STANDARDS, ...getCustomProgressions()]
      .find(x => x.id === $('progChips').value);
    if (!p) return;
    setup.prog = p.id;
    if (Number.isInteger(p.key)) setup.key = p.key;
    renderSetup();
  });
  const setBpm = v => {
    setup.bpm = Math.min(160, Math.max(40, Math.round(v)));
    $('bpm').value = setup.bpm;
    $('bpmVal').textContent = setup.bpm;
    metro?.setBpm(setup.bpm);
  };
  $('bpm').addEventListener('input', () => setBpm(+$('bpm').value));
  $('bpmDown').addEventListener('click', () => setBpm(setup.bpm - 1));
  $('bpmUp').addEventListener('click', () => setBpm(setup.bpm + 1));
  $('startSession').addEventListener('click', startSession);
  $('endSession').addEventListener('click', () => {
    if (session && session.chgMode && !session.done) { finishChg(); return; }
    endPractice();
    $('practiceRun').hidden = true;
    $('practiceSetup').hidden = false;
  });
  // chord-change setup: slot pickers (rootPicker + quality <select>, the
  // song editor's pattern), 30–140 bpm slider, auto-ramp toggle
  for (const slot of ['A', 'B']) {
    const q = $('chgQual' + slot);
    CHG_QUALITIES.forEach(k => q.add(new Option(QUALITIES[k].label, k)));
    q.addEventListener('change', () => {
      (slot === 'A' ? setup.chgA : setup.chgB).quality = q.value;
      paintChgSlot(slot);
    });
    $('chgSlot' + slot).addEventListener('click', () => openChgPick(slot));
  }
  const setChgBpm = v => {
    setup.chgBpm = Math.min(140, Math.max(30, Math.round(v)));
    $('chgBpm').value = setup.chgBpm;
    $('chgBpmVal').textContent = setup.chgBpm;
    if (session && session.chgMode && !session.done) {
      session.chg.bpm = setup.chgBpm;
      session.chg.topBpm = Math.max(session.chg.topBpm, setup.chgBpm);
      metro?.setBpm(setup.chgBpm);
      paintChgScore();
    }
  };
  $('chgBpm').addEventListener('input', () => setChgBpm(+$('chgBpm').value));
  $('chgBpmDown').addEventListener('click', () => setChgBpm(setup.chgBpm - 1));
  $('chgBpmUp').addEventListener('click', () => setChgBpm(setup.chgBpm + 1));
  $('chgAuto').addEventListener('click', () => {
    setup.chgAuto = !setup.chgAuto;
    $('chgAuto').classList.toggle('sel', setup.chgAuto);
    if (session && session.chgMode) session.chg.auto = setup.chgAuto;
  });
  $('hearTarget').addEventListener('click', () => {
    const v = voicingsFor(session.items[session.idx].chord)[0];
    if (v) playVoicing(v);
  });
  $('skipChord').addEventListener('click', onSkip);
  $('submitVirtual').addEventListener('click', checkVirtual);
  $('againBtn').addEventListener('click', () => {
    $('practiceResult').hidden = true;
    $('practiceSetup').hidden = false;
  });
  onLangChange(renderSetup);
  initProgBuilder(renderSetup);
  renderSetup();
}

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

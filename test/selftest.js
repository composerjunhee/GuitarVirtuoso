// Selftest: feeds synthesized audio through the detectors and sanity-checks
// the theory engine. Runs in Node (npm test) and in test/selftest.html.
//
//   - pitch: Karplus-Strong plucks must come back as the right note
//   - chord: mixed 6-string strums must verify against the expected chord
//            (and fail against a wrong one)
//   - voicings: every root × quality yields ≥1 playable, correct voicing
//   - symbols: parseSymbol ↔ chordSymbol round-trips

import { renderPluck, renderStrum, playNote } from '../js/audio/pluck.js';
import { detectPitch } from '../js/audio/pitch.js';
import { makeOnsetDetector } from '../js/audio/worklet-processor.js';
import { profileFromSpectrum, matchChord } from '../js/audio/chordDetect.js';
import { voicingsFor, voicingPcs, voiceLead } from '../js/theory/voicings.js';
import { parseSymbol, chordSymbol, chordPcs, QUALITIES, makeChord } from '../js/theory/chords.js';
import { STRINGS, midiToFreq, freqToMidi, midiToPc } from '../js/theory/notes.js';
import { STANDARDS } from '../js/data/standards.js';
import { PROGRESSIONS } from '../js/data/progressions.js';

const SR = 44100;

// ear.js is dynamically imported in the ear-drills block below; its
// transitive deps (state.js, i18n.js) read localStorage at module load,
// which Node doesn't have — stub it before that import runs.
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: () => null, setItem: () => {}, removeItem: () => {},
  };
}

// seeded RNG so renders are deterministic — unseeded KS noise made the
// chord tests flaky run to run
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- tiny FFT (Hann window, magnitude → pseudo-analyser dB) ----------
function fftMagDb(samples, fftSize = 8192, offset = 0, peakDb = -32) {
  const N = fftSize;
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);       // Hann
    re[i] = (samples[offset + i] || 0) * w;
  }
  // iterative radix-2
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j |= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= N; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let cwr = 1, cwi = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = i + k + len / 2;
        const tr = re[b] * cwr - im[b] * cwi;
        const ti = re[b] * cwi + im[b] * cwr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const t = cwr * wr - cwi * wi; cwi = cwr * wi + cwi * wr; cwr = t;
      }
    }
  }
  const half = N / 2;
  const mags = new Float64Array(half);
  let max = 0;
  for (let i = 0; i < half; i++) {
    mags[i] = Math.hypot(re[i], im[i]);
    if (mags[i] > max) max = mags[i];
  }
  // analyser-style: strongest peak ≈ peakDb, floor −100. A lower peakDb
  // models quiet input (low mic gain): same spectrum shape, less of it
  // above the floor — that gap is what the adaptive noise floor lives on.
  const db = new Float32Array(half).fill(-100);
  if (max > 0) {
    for (let i = 0; i < half; i++) {
      const v = 20 * Math.log10(mags[i] / max) + peakDb;
      db[i] = Math.max(-100, Math.min(peakDb + 2, v));
    }
  }
  return { db, binHz: SR / fftSize };
}

// mix a voicing's strings into one buffer (strummed, ~24ms apart)
function synthChord(frets, sr = SR, dur = 1.6, seed = 1234) {
  const rng = mulberry32(seed);
  const gap = Math.round(sr * 0.024);
  const out = new Float32Array(Math.floor(sr * dur));
  for (let s = 0; s < 6; s++) {
    if (frets[s] < 0) continue;
    const sig = renderPluck(midiToFreq(STRINGS[s] + frets[s]), sr, dur - 0.2, rng);
    const off = s * gap;
    for (let i = 0; i < sig.length && off + i < out.length; i++) {
      out[off + i] += sig[i] * 0.4;
    }
  }
  return out;
}

// ---------- realism helpers (renderStrum path) ----------

// frets[] → renderStrum specs; muted strings stay null so they still take
// a strum slot, matching synthChord's s*gap timing
const specsFromFrets = frets =>
  frets.map((f, s) => (f < 0 ? null : { freq: midiToFreq(STRINGS[s] + f) }));

// poll analysis windows through the buffer, exactly like the app's vote
// ring: returns an array of per-window verdicts; the caller decides the
// pass threshold (≥3-of-5) or checks for any false-accept
function pollWindows(buf, sym, offsets = [1500, 3000, 4500, 6000, 7500], peakDb = -32) {
  const chord = parseSymbol(sym);
  const need = chordPcs(chord.root, chord.quality);
  return offsets.map(off => {
    const prof = profileFromSpectrum(fftMagDb(buf, 8192, off, peakDb).db, SR / 8192, need);
    return matchChord(prof, chord).ok;
  });
}
const wins = votes => votes.filter(Boolean).length;
const wbits = votes => votes.map(x => x ? 1 : 0).join('');

// ---------- onset path (worklet detector, hop-by-hop) ----------
const HOP = 512;

// Feed a rendered buffer through the worklet's onset detector exactly like
// FrameProcessor.process() does: DC-block each sample (same one-pole,
// DC_R = 0.995), fire every 512-sample hop. Returns the hop indices where
// an attack was reported.
function onsetHops(buf, sr = SR) {
  const detect = makeOnsetDetector(sr, HOP);
  const hop = new Float32Array(HOP);
  const hits = [];
  let x1 = 0, y1 = 0, pi = 0, idx = 0;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i];
    const y = x - x1 + 0.995 * y1;
    x1 = x; y1 = y;
    hop[pi++] = y;
    if (pi === HOP) {
      if (detect(hop)) hits.push(idx);
      idx++; pi = 0;
    }
  }
  return hits;
}

// Screen-gate model: a window's vote counts only while fresh — within
// ~1.8 s after a pick attack (screens: performance.now()-lastOnset < 1800).
// A window at sample offset `off` polls when its 8192-frame arrives ≈
// off+8192; an attack makes it fresh iff the attack came first and is
// younger than FRESH_MS.
const FRESH_MS = 1800;
const db2lin = db => Math.pow(10, db / 20);
function gatedWins(buf, sym, offsets = [1500, 3000, 4500, 6000, 7500], peakDb = -32) {
  const votes = pollWindows(buf, sym, offsets, peakDb);
  const hits = onsetHops(buf).map(h => h * HOP);        // attack sample index
  return votes.filter((v, i) => {
    const now = offsets[i] + 8192;
    const fresh = hits.some(h => h <= now && (now - h) / SR * 1000 < FRESH_MS);
    return v && fresh;
  }).length;
}

// ---------- tests ----------

export async function runAll(report = console.log) {
  let pass = 0, fail = 0, known = 0;
  const ok = (cond, name, extra = '') => {
    if (cond) { pass++; report(`  PASS ${name}`); }
    else { fail++; report(`  FAIL ${name} ${extra}`); }
  };
  // like ok(), but a failure marks a documented real-world limitation of the
  // detector instead of failing the suite — these are tuning targets
  const know = (cond, name, why) => {
    if (cond) { pass++; report(`  PASS ${name}`); }
    else { known++; report(`  KNOWN ${name} — ${why}`); }
  };

  // -- pitch: open strings + a few fretted notes --
  report('pitch (monophonic, KS plucks)');
  const notes = [
    ['E2', 40], ['A2', 45], ['D3', 50], ['G3', 55], ['B3', 59], ['E4', 64],
    ['G4', 67], ['C4', 60], ['F#3', 54], ['A4', 69],
  ];
  for (const [label, midi] of notes) {
    const sig = renderPluck(midiToFreq(midi), SR, 1.4, mulberry32(midi * 97));
    const det = detectPitch(sig.subarray(0, 2048), SR);
    const got = det ? Math.round(freqToMidi(det.freq)) : null;
    const cents = det ? 1200 * Math.log2(det.freq / midiToFreq(midi)) : NaN;
    ok(got === midi && Math.abs(cents) < 30, `${label}→${label}`,
      `got midi ${got}, ${cents?.toFixed(0)}c`);
  }

  // -- chord verification --
  report('chord verify (synthetic strums)');
  const cases = [
    { sym: 'C', frets: [-1, 3, 2, 0, 1, 0] },
    { sym: 'G', frets: [3, 2, 0, 0, 0, 3] },
    { sym: 'Am', frets: [-1, 0, 2, 2, 1, 0] },
    { sym: 'E7', frets: [0, 2, 0, 1, 0, 0] },
    { sym: 'D', frets: [-1, -1, 0, 2, 3, 2] },
    { sym: 'F', frets: [1, 3, 3, 2, 1, 1] },
  ];
  for (const c of cases) {
    const chord = parseSymbol(c.sym);
    const buf = synthChord(c.frets);
    const need = chordPcs(chord.root, chord.quality);
    // vote across 5 windows through the strum (mirrors the app's ≥4-of-6
    // poll gate): the chord verifies if the majority of windows do
    const oks = [1500, 3000, 4500, 6000, 7500].map(off => {
      const prof = profileFromSpectrum(fftMagDb(buf, 8192, off).db, SR / 8192, need);
      return matchChord(prof, chord).ok;
    });
    ok(oks.filter(Boolean).length >= 3, `hear ${c.sym}`,
      `windows=${oks.map(x => x ? 1 : 0).join('')}`);
    // negative: same audio must NOT verify as a distant chord
    const wrong = parseSymbol(c.sym === 'Am' ? 'E' : 'Abm');
    const needW = chordPcs(wrong.root, wrong.quality);
    const oksW = [2500, 4500, 6500].map(off => {
      const prof = profileFromSpectrum(fftMagDb(buf, 8192, off).db, SR / 8192, needW);
      return matchChord(prof, wrong).ok;
    });
    ok(!oksW.some(Boolean), `reject other chord for ${c.sym} audio`);
  }

  // -- realism: detune, gain jitter, quiet input, ring, sympathetic --
  // renderStrum layers model what a real mic hears; pollWindows mirrors the
  // app's sliding-window vote. KNOWN = documented limitation, not a failure.
  report('realism (detune / jitter / quiet / ring / sympathetic)');
  const C_F = [-1, 3, 2, 0, 1, 0], AM_F = [-1, 0, 2, 2, 1, 0];
  const G_F = [3, 2, 0, 0, 0, 3], EM_F = [0, 2, 2, 0, 0, 0];

  { // a ±15–35¢-detuned guitar must still verify (soft pc binning)
    const specs = specsFromFrets(C_F);
    [18, -25, 30, -15, 22, -30].forEach((c, i) => { if (specs[i]) specs[i].cents = c; });
    const v = pollWindows(renderStrum(specs, SR, 1.6, mulberry32(42)), 'C');
    ok(wins(v) >= 3, 'detuned C still hears C', wbits(v));
  }
  { // uneven string levels (beginners strum unevenly)
    const specs = specsFromFrets(G_F);
    [0.2, 0.6, 0.35, 0.5, 0.25, 0.55].forEach((g, i) => { if (specs[i]) specs[i].gain = g; });
    const v = pollWindows(renderStrum(specs, SR, 1.6, mulberry32(43)), 'G');
    ok(wins(v) >= 3, 'gain-jittered G still hears G', wbits(v));
  }
  { // quiet input: same spectrum, 23dB down — exercises the adaptive floor
    const buf = renderStrum(specsFromFrets(C_F), SR, 1.6, mulberry32(44));
    const v = pollWindows(buf, 'C', undefined, -55);
    ok(wins(v) >= 3, 'quiet C (-55dB) still hears C', wbits(v));
  }
  { // noise bed under a strum — fan/room at -30dB below string level
    const buf = renderStrum(specsFromFrets(C_F), SR, 1.6, mulberry32(45),
      { noiseDb: -30 });
    const v = pollWindows(buf, 'C');
    ok(wins(v) >= 3, 'C over -30dB noise still hears C', wbits(v));
  }
  { // relative-chord negatives: the hard confusion pairs (share most pcs)
    const am = renderStrum(specsFromFrets(AM_F), SR, 1.6, mulberry32(46));
    ok(wins(pollWindows(am, 'C')) === 0, 'Am audio rejects C target');
    const em = renderStrum(specsFromFrets(EM_F), SR, 1.6, mulberry32(47));
    ok(wins(pollWindows(em, 'G')) === 0, 'Em audio rejects G target');
  }
  { // a superset ring CAN complete a subset target spectrally — Em7's pcs
    // cover Em entirely, so spectrum alone can't tell "still ringing" from
    // "just played". The app's real defense is the onset gate: votes only
    // count within ~1.8 s of a pick attack. Model the whole timeline — an
    // Em7 strummed at -15 dB with its attack at t=0 (the residual layer is
    // exactly this buffer's tail). The raw spectrum keeps passing Em long
    // after, but once the attack is >1.8 s stale every vote is gated out.
    const late = [88000, 93000, 98000, 103000, 108000];      // ~2.0–2.45 s
    const buf = renderStrum(specsFromFrets([0, 2, 0, 0, 0, 0]),
      SR, 4.5, mulberry32(48), { mixGain: 0.4 * db2lin(-15) });
    const raw = wins(pollWindows(buf, 'Em', late));
    ok(raw >= 3 && gatedWins(buf, 'Em', late) === 0,
      'Em7 ring alone does not pass Em (onset gate)',
      `raw=${raw} gated=${gatedWins(buf, 'Em', late)}`);
  }
  { // sympathetic open strings only (no strum) must not verify chords made
    // entirely of open-string pcs — the classic false-accept path
    const buf = renderStrum([null, null, null, null, null, null],
      SR, 1.6, mulberry32(49), { sympatheticDb: -20 });
    ok(wins(pollWindows(buf, 'Em')) === 0, 'open-string ring rejects Em');
    ok(wins(pollWindows(buf, 'G')) === 0, 'open-string ring rejects G');
  }

  // -- onset detector: HF spectral flux, driven hop-by-hop like the worklet --
  report('onset detector (HF flux)');
  const NULL6 = [null, null, null, null, null, null];
  { // silence must never self-trigger
    ok(onsetHops(new Float32Array(SR)).length === 0, 'silence → no onset');
  }
  { // first loud hop after silence: a strum fires right at the pick
    const buf = renderStrum(specsFromFrets(G_F), SR, 1.6, mulberry32(50));
    const h = onsetHops(buf);
    ok(h.length >= 1 && h[0] <= 5, 'strum from silence fires at the pick',
      `hits=${h.slice(0, 8)}`);
  }
  { // residual ring never re-fires. The faithful model includes the ring's
    // own attack at t=0 (a fresh detector fed a mid-ring buffer sees the
    // buffer edge as a step — in the app the detector was already running
    // when the chord was struck). Only the attack may report; the next
    // ~4 s of pure ring must produce nothing.
    const buf = renderStrum(specsFromFrets([0, 2, 0, 0, 0, 0]),
      SR, 4.5, mulberry32(48), { mixGain: 0.4 * db2lin(-15) });
    const h = onsetHops(buf);
    ok(h.length >= 1 && h.every(x => x <= 8),
      'Em7 ring → onset only at its own attack', `hits=${h}`);
  }
  { // the key scenario: a fresh strum over a still-ringing chord. The ring's
    // attack fired at t=0; a C strum lands at 1.5 s — the detector must fire
    // there too even though LF energy never dropped (the old RMS baseline
    // swallowed exactly this jump).
    const buf = renderStrum(specsFromFrets([0, 2, 0, 0, 0, 0]),
      SR, 3.0, mulberry32(51), { mixGain: 0.4 * db2lin(-12) });
    const strumAt = Math.round(1.5 * SR);
    const strum = renderStrum(specsFromFrets(C_F), SR, 1.4, mulberry32(52));
    for (let i = 0; i < strum.length && strumAt + i < buf.length; i++)
      buf[strumAt + i] += strum[i];
    const h = onsetHops(buf);
    const want = Math.floor(strumAt / HOP);
    ok(h.length >= 2 && h[0] <= 8 &&
      h.some(x => x >= want && x - want <= 6),
      'restrum over loud ring fires at the strum',
      `hits=${h} want≈${want}`);
  }
  { // steady noise bed alone: HF flux sits at its baseline → no onset
    const buf = renderStrum(NULL6, SR, 1.6, mulberry32(53), { noiseDb: -30 });
    ok(onsetHops(buf).length === 0, 'noise bed alone → no onset');
  }

  // -- voicings: full library coverage --
  report('voicings (all roots × qualities)');
  const t0 = Date.now();
  let total = 0, empty = 0, bad = [];
  for (let root = 0; root < 12; root++) {
    for (const q of Object.keys(QUALITIES)) {
      const chord = { root, quality: q, bass: null };
      const vs = voicingsFor(chord);
      total++;
      if (!vs.length) { empty++; bad.push(`${root}|${q}`); continue; }
      const v = vs[0];
      const need = chordPcs(root, q);
      const got = voicingPcs(v);
      const fifth = (root + 7) % 12;
      const missing = [...need].filter(pc => !got.has(pc));
      const okCoverage = missing.every(pc => pcs5ok(pc, need, fifth));
      if (!okCoverage) bad.push(`${root}|${q} miss ${missing}`);
      const fingers = new Set(v.fingers.filter(x => x > 0));
      if (fingers.size > 4) bad.push(`${root}|${q} ${fingers.size} fingers`);
    }
  }
  ok(empty === 0 && bad.length === 0,
    `${total} chords all voiced (${Date.now() - t0}ms)`,
    empty || bad.length ? `empty=${empty} ${bad.slice(0, 6).join('; ')}` : '');

  // -- voice leading: progression-aware voicing picks should keep the hand
  //    from jumping — never more position movement than the naive "always
  //    take voicingsFor()[0]" baseline, and every pick must still play its
  //    own chord --
  report('voice leading');
  const PROG = [[0, ''], [7, ''], [9, 'm'], [5, '']];   // I–V–vi–IV
  const progChords = key => PROG.map(([off, q]) =>
    ({ root: (key + off) % 12, quality: q, bass: null }));
  const posMove = vs => vs.reduce((sum, v, i) =>
    (i && v && vs[i - 1]) ? sum + Math.abs(v.base - vs[i - 1].base) : sum, 0);

  for (const [keyName, keyRoot] of [['C', 0], ['G', 7]]) {
    const led = voiceLead(progChords(keyRoot));
    ok(led.length === PROG.length && led.every(v => v && Array.isArray(v.frets)),
      `voiceLead I–V–vi–IV in ${keyName} voices every chord`);
  }
  for (const keyRoot of [0, 7, 5, 2]) {                 // C G F D
    const chords = progChords(keyRoot);
    const led = voiceLead(chords);
    const naive = chords.map(c => voicingsFor(c)[0] || null);
    ok(led.every(Boolean) && posMove(led) <= posMove(naive),
      `voiceLead key ${keyRoot} moves ≤ naive`,
      `led=${posMove(led)} naive=${posMove(naive)}`);
  }
  { // coverage: each voiceLed pick still sounds its own chord's pcs
    const chords = progChords(0);
    const led = voiceLead(chords);
    const covered = chords.every((c, i) => {
      if (!led[i]) return false;
      const need = chordPcs(c.root, c.quality);
      const got = voicingPcs(led[i]);
      const fifth = (c.root + 7) % 12;
      return [...need].filter(pc => !got.has(pc))
        .every(pc => pcs5ok(pc, need, fifth));
    });
    ok(covered, 'voiceLed voicings cover their chords');
  }

  // -- symbols round-trip --
  report('symbols');
  for (const s of ['C', 'Am', 'F#m7', 'Bbmaj7', 'C/G', 'Dm7', 'E7sus4', 'G13', 'Cadd9']) {
    const ch = parseSymbol(s);
    ok(!!ch, `parse ${s}`);
    if (ch) {
      const back = chordSymbol(ch, { flat: /b/.test(s) });
      ok(back.replace('♭', 'b') === s || chordEquiv(ch, s), `round-trip ${s}→${back}`);
    }
  }

  // -- standards data: contract checks for the Real Book progressions --
  report('standards data');
  ok(STANDARDS.length >= 10, `≥10 standards (got ${STANDARDS.length})`);
  ok(new Set(STANDARDS.map(s => s.id)).size === STANDARDS.length,
    'standard ids unique');
  for (const s of STANDARDS) {
    ok(s.bars.length >= 12, `${s.id}: ≥12 bar slots (got ${s.bars.length})`);
    const badQ = s.bars.filter(b => !(b.q in QUALITIES)).map(b => b.q);
    ok(badQ.length === 0, `${s.id}: qualities all in QUALITIES`, badQ.join(','));
    const badOff = !Number.isInteger(s.key) || s.key < 0 || s.key > 11 ||
      s.bars.some(b => !Number.isInteger(b.off) || b.off < 0 || b.off > 11);
    ok(!badOff, `${s.id}: key + offsets in 0–11`);
    // half:true marks a two-chords-in-one-bar slot — they must arrive in
    // consecutive pairs, never a lone half or an odd run
    let run = 0, halvesOk = true;
    for (const b of s.bars) {
      if (b.half) run++;
      else { if (run % 2) halvesOk = false; run = 0; }
    }
    if (run % 2) halvesOk = false;
    ok(halvesOk, `${s.id}: half-bars in consecutive pairs`);
    let threw = '';
    try {
      for (const b of s.bars) makeChord(s.key + b.off, b.q);
    } catch (e) { threw = e.message; }
    ok(!threw, `${s.id}: makeChord resolves every bar`, threw);
  }

  // -- ear-trainer drill math (pure helpers, no DOM needed) --
  report('ear drills');
  ok(typeof playNote === 'function', 'playNote exported from pluck.js');
  const ear = await import('../js/screens/ear.js');
  ok(ear.clampMidi(30) === 40 && ear.clampMidi(90) === 76 &&
    ear.clampMidi(52) === 52, 'clampMidi bounds to 40–76');
  ok(ear.hlAnswerId(50, 52) === 'higher' && ear.hlAnswerId(50, 48) === 'lower' &&
    ear.hlAnswerId(50, 50) === 'same', 'high-low pair → answer id');
  ok(ear.intervalSecond(60, 7, 'desc') === 53 &&
    ear.intervalSecond(60, 7, 'asc') === 67 &&
    ear.intervalSecond(60, 7, 'harm') === 67,
    'interval direction resolves second note');
  { // degree resolution matches the strum.js recipe: I–V–vi–IV in C = C G Am F
    const cs = ear.progChords(0, PROGRESSIONS.find(p => p.id === 'I-V-vi-IV'));
    ok(cs.length === 4 && cs[0].root === 0 && cs[0].quality === '' &&
      cs[1].root === 7 && cs[1].quality === '' &&
      cs[2].root === 9 && cs[2].quality === 'm' && cs[3].root === 5,
      'progChords resolves I–V–vi–IV in C');
  }
  { // every preset progression must voice-lead cleanly — a null slot would
    // deal a silent bar into the prog drill
    const allOk = PROGRESSIONS.every(p =>
      [0, 7, 5].every(key => voiceLead(ear.progChords(key, p)).every(Boolean)));
    ok(allOk, 'all preset progressions voice-lead (keys C/G/F)');
  }

  // -- song mode: chart bar layout (pure helper, no DOM needed) --
  report('song mode');
  const songs = await import('../js/screens/songs.js');
  { // Autumn Leaves: 34 slots → 32 cells; the C section's two half pairs
    // (| Gm7 Gb7 | Fm7 E7 |) are the only split cells
    const al = STANDARDS.find(x => x.id === 'autumn-leaves');
    const cells = songs.barCells(al);
    ok(cells.length === 32 &&
      cells.flatMap(c => c.slots).length === al.bars.length &&
      cells.filter(c => c.slots.length === 2).length === 2,
      'barCells: Autumn Leaves → 32 cells, 2 split',
      `cells=${cells.length} split=${cells.filter(c => c.slots.length === 2).length}`);
  }
  { // every standard: cells partition the slot list in order, ≤2 per cell —
    // total beats (slots×4 minus halves) must equal cells×4
    const allOk = STANDARDS.every(sd => {
      const cells = songs.barCells(sd);
      const flat = cells.flatMap(c => c.slots);
      const beats = sd.bars.reduce((a, b) => a + (b.half ? 2 : 4), 0);
      return cells.every(c => c.slots.length <= 2) &&
        flat.length === sd.bars.length && flat.every((v, i) => v === i) &&
        beats === cells.length * 4;
    });
    ok(allOk, 'every standard: cells partition slots in order');
  }

  report(`\n${pass} passed, ${fail} failed` +
    (known ? `, ${known} known-limitation${known === 1 ? '' : 's'}` : ''));
  return { pass, fail };
}

function pcs5ok(pc, need, fifth) { return need.size > 3 && pc === fifth; }
function chordEquiv(ch, sym) {
  // loose check: same root/quality even if spelling differs
  const again = parseSymbol(sym);
  return again && again.root === ch.root && again.quality === ch.quality;
}

// Node entry: node test/selftest.js
if (typeof window === 'undefined') {
  runAll().then(r => process.exit(r.fail ? 1 : 0));
}

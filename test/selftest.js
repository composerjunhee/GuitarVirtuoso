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
import { profileFromSpectrum, matchChord, charPcs } from '../js/audio/chordDetect.js';
import { voicingsFor, voicingPcs, voiceLead } from '../js/theory/voicings.js';
import { parseSymbol, chordSymbol, chordPcs, QUALITIES, makeChord } from '../js/theory/chords.js';
import { STRINGS, midiToFreq, freqToMidi, midiToPc } from '../js/theory/notes.js';
import { STANDARDS, GENRES } from '../js/data/standards.js';
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

  // -- strict extension: a bare triad must NOT pass an extended target --
  // The tones beyond the base triad (7th/6th/9th…) are "characteristic":
  // they need a real fundamental (fund ≥ FUND_STRONG ≈ 0.03), because a
  // triad strum already rings them as overtones — B off the G string's
  // 5th partial passes for Cmaj7's 7th, Bb near C's 7th partial for C7's
  // ♭7. Those leaks carry fund ≈ 0–0.028; a really-played string carries
  // ~1/6 of total weight, so it clears the gate by a wide margin.
  report('strict extension (triad audio vs extended target)');
  const DM_F = [-1, -1, 0, 2, 3, 1];
  { // the reported bug: C audio must not verify as Cmaj7 or C7 — before
    // the strict gate the leaked 7ths emptied `missing` and the ~0.85
    // score carried it through
    const cBuf = renderStrum(specsFromFrets(C_F), SR, 1.6, mulberry32(60));
    ok(wins(pollWindows(cBuf, 'Cmaj7')) === 0, 'C audio rejects Cmaj7 target');
    ok(wins(pollWindows(cBuf, 'C7')) === 0, 'C audio rejects C7 target');
    ok(wins(pollWindows(cBuf, 'C6')) === 0, 'C audio rejects C6 target');
  }
  { // same cheat on the minor side: each triad vs its own m7
    const em = renderStrum(specsFromFrets(EM_F), SR, 1.6, mulberry32(63));
    ok(wins(pollWindows(em, 'Em7')) === 0, 'Em audio rejects Em7 target');
    const am = renderStrum(specsFromFrets(AM_F), SR, 1.6, mulberry32(64));
    ok(wins(pollWindows(am, 'Am7')) === 0, 'Am audio rejects Am7 target');
    const dm = renderStrum(specsFromFrets(DM_F), SR, 1.6, mulberry32(65));
    ok(wins(pollWindows(dm, 'Dm7')) === 0, 'Dm audio rejects Dm7 target');
  }
  { // positive controls: really-played extensions still verify
    const cm7 = pollWindows(
      renderStrum(specsFromFrets([-1, 3, 2, 0, 0, 0]), SR, 1.6, mulberry32(1234)),
      'Cmaj7');
    ok(wins(cm7) >= 3, 'Cmaj7 audio still hears Cmaj7', wbits(cm7));
    const g7 = pollWindows(
      renderStrum(specsFromFrets([3, 2, 0, 0, 0, 1]), SR, 1.6, mulberry32(1234)),
      'G7');
    ok(wins(g7) >= 3, 'G7 audio still hears G7', wbits(g7));
    const dm7 = pollWindows(
      renderStrum(specsFromFrets([-1, -1, 0, 2, 1, 1]), SR, 1.6, mulberry32(1234)),
      'Dm7');
    ok(wins(dm7) >= 3, 'Dm7 audio still hears Dm7', wbits(dm7));
  }
  { // charPcs picks the extension tones, not just the tail of the interval
    // list: add9 interleaves its 9th inside the triad span; '11' stacks
    // ♭7/9/11 over a bare fifth and every one of them is characteristic
    const add9 = charPcs(parseSymbol('Cadd9'));
    const dom11 = charPcs(parseSymbol('C11'));
    const triad = charPcs(parseSymbol('C'));
    ok(add9.size === 1 && add9.has(2) &&
      dom11.has(10) && dom11.has(2) && dom11.has(5) && !dom11.has(7) &&
      triad.size === 0, 'charPcs = tones beyond the base triad');
  }
  { // critical strings may not spend the one-dead-string allowance: a C
    // fingering under a Cmaj7 template (x32000) differs in exactly the B
    // string — the one carrying the maj7. (The synth's coincidental
    // partials can mark that slot "ringing", so force the entry dead and
    // exercise the allowance math directly on the real profile.)
    const chord = parseSymbol('Cmaj7');
    const need = chordPcs(chord.root, chord.quality);
    const buf = renderStrum(specsFromFrets(C_F), SR, 1.6, mulberry32(69));
    const prof = profileFromSpectrum(fftMagDb(buf, 8192, 3000).db, SR / 8192,
      need, { frets: [-1, 3, 2, 0, 0, 0] });
    const bStr = prof.strings.find(x => x.s === 4);
    ok(bStr && bStr.exp === 11, 'voicing template tags expected pc per string');
    const kill = s => prof.strings.map(x => x.s === s ? { ...x, ok: false } : x);
    const deadCrit = matchChord({ ...prof, strings: kill(4) }, chord);
    const deadFifth = matchChord({ ...prof, strings: kill(3) }, chord);
    const deadBoth = matchChord({
      ...prof, strings: prof.strings.map(x => (x.s === 2 || x.s === 3) ? { ...x, ok: false } : x),
    }, chord);
    ok(deadCrit.stringsOk === false, 'dead characteristic string → stringsOk false');
    ok(deadFifth.stringsOk === true, 'one dead non-critical string still forgiven');
    ok(deadBoth.stringsOk === false, 'two dead non-critical strings still fail');
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
    // consecutive pairs, never a lone half or an odd run. (Custom songs
    // saved from the in-chart editor may legitimately split one of a
    // pair — the pairing rule only binds the curated catalog.)
    let run = 0, halvesOk = true;
    for (const b of s.bars) {
      if (b.half) run++;
      else { if (run % 2) halvesOk = false; run = 0; }
    }
    if (run % 2) halvesOk = false;
    ok(halvesOk || s.genre === 'custom',
      `${s.id}: half-bars in consecutive pairs`);
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

  // -- stats screen: stat-key classifier (pure, no DOM needed) --
  report('stats types');
  const st = await import('../js/screens/stats.js');
  ok(st.typeOf('Cmaj7') === 'chord' && st.typeOf('F#m7b5') === 'chord' &&
    st.typeOf('Am/G') === 'chord' && st.typeOf('E') === 'chord',
    'typeOf: bare chord symbols');
  ok(st.typeOf('note:C') === 'note' && st.typeOf('note:F#') === 'note',
    'typeOf: note: prefix');
  ok(st.typeOf('iv:M3') === 'interval' && st.typeOf('iv:P8') === 'interval' &&
    st.typeOf('M3') === 'interval' && st.typeOf('TT') === 'interval',
    'typeOf: iv: prefix + legacy bare labels');
  ok(st.typeOf('prog:I–V–vi–IV') === 'prog' &&
    st.typeOf('I–V–vi–IV') === 'prog' && st.typeOf('12-bar blues') === 'prog',
    'typeOf: prog: prefix + legacy labels');
  ok(st.typeOf('E → G') === 'junk' && st.typeOf('A → B') === 'junk',
    'typeOf: highlow pair keys are junk');
  ok(st.typeOf('???') === 'other', 'typeOf: unknown → other');

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
  { // every standard: cells partition the slot list in order, ≤4 per cell
    // (edited charts can hold four 1-beat slots) — total beats must equal
    // cells×4. `beats` (custom songs) and `half` both feed the width.
    const allOk = STANDARDS.every(sd => {
      const cells = songs.barCells(sd);
      const flat = cells.flatMap(c => c.slots);
      const beats = sd.bars.reduce((a, b) => a + (b.beats || (b.half ? 2 : 4)), 0);
      return cells.every(c => c.slots.length <= 4) &&
        flat.length === sd.bars.length && flat.every((v, i) => v === i) &&
        beats === cells.length * 4;
    });
    ok(allOk, 'every standard: cells partition slots in order');
  }
  { // the in-chart editor's working model: explicit `beats` (1/3) packs
    // greedily into 4-beat cells alongside classic half/full slots
    const cells = songs.barCells({ bars: [
      { off: 0, q: '', beats: 1 }, { off: 7, q: '7', beats: 3 },
      { off: 0, q: '' },
      { off: 5, q: 'maj7', half: true }, { off: 7, q: '7', half: true },
    ]});
    ok(cells.length === 3 &&
      cells[0].slots.length === 2 && cells[2].slots.length === 2,
      'barCells: 1+3 beat split + classic slots group greedily');
    ok(!!GENRES.custom && Object.keys(GENRES).at(-1) === 'custom',
      'GENRES.custom exists as the last group');
  }

  // -- fretboard game: position math (pure helpers, no DOM needed) --
  report('fretboard game');
  const fg = await import('../js/screens/fretboardGame.js');
  { // C (pc 0) inside frets 0–4: A-string 3 + B-string 1, nothing else —
    // low/hi E strings need fret 8, D wants 10, G wants 5
    const pos = fg.positionsOfPc(0, 0, 4).map(p => `${p.string},${p.fret}`);
    ok(pos.length === 2 && pos.includes('1,3') && pos.includes('4,1'),
      'positionsOfPc C in 0–4 → A3 + B1', pos.join(' '));
  }
  { // E (pc 4) in the same window: both open strings + D-string 2
    const pos = fg.positionsOfPc(4, 0, 4).map(p => `${p.string},${p.fret}`);
    ok(pos.length === 3 && pos.includes('0,0') && pos.includes('2,2') &&
      pos.includes('5,0'), 'positionsOfPc E in 0–4 → open E/D2/open e',
      pos.join(' '));
  }
  { // octave duplication: B (pc 11) on the A string lands at f=2 and 14 —
    // range 0–12 keeps only the first, 0–15 keeps both
    const a12 = fg.positionsOfPc(11, 0, 12).filter(p => p.string === 1);
    const a15 = fg.positionsOfPc(11, 0, 15).filter(p => p.string === 1);
    ok(a12.length === 1 && a12[0].fret === 2 &&
      a15.length === 2 && a15[1].fret === 14,
      'positionsOfPc respects the range ceiling');
  }
  { // every pc has ≥1 position in every offered range — no dead questions
    const ranges = Object.values(fg.FRET_RANGES);
    const cover = ranges.every(([lo, hi]) =>
      [...Array(12).keys()].every(pc => fg.positionsOfPc(pc, lo, hi).length > 0));
    ok(cover, 'every pc reachable in every fret range');
  }
  { // name mode: the answer is the pc of the highlighted cell
    ok(fg.nameAnswer(1, 3) === midiToPc(STRINGS[1] + 3) &&   // C on A3
      fg.nameAnswer(5, 0) === 4,                            // open high E
      'nameAnswer = midiToPc(fretToMidi)');
  }
  { // all mode: completes only when every in-range position is found
    const pc = 0, [lo, hi] = [0, 4];
    const all = fg.positionsOfPc(pc, lo, hi);
    const partial = new Set([`${all[0].string},${all[0].fret}`]);
    const full = new Set(all.map(p => `${p.string},${p.fret}`));
    ok(!fg.allFound(pc, partial, lo, hi) && fg.allFound(pc, full, lo, hi),
      'allFound needs every position, not just one');
    // stray keys in the set don't matter — allFound only checks coverage
    ok(fg.allFound(pc, new Set([...full, '9,9']), lo, hi),
      'allFound ignores extra keys');
  }

  // -- song catalog: the whole STANDARDS list across all genres --
  // (per-song quality/offset/half-pair/makeChord checks already ran in the
  // 'standards data' block above — it loops every catalog entry)
  report('song catalog');
  ok(STANDARDS.length >= 95, `≥95 songs in catalog (got ${STANDARDS.length})`);
  ok(STANDARDS.every(sd => sd.bars.length > 0),
    'every song has non-empty bars');
  ok(Object.keys(GENRES).every(g => GENRES[g].ko && GENRES[g].en),
    'GENRES labels all bilingual (ko+en)');
  ok(STANDARDS.every(sd => sd.genre && sd.genre in GENRES),
    'every song has a genre in GENRES',
    STANDARDS.filter(sd => !(sd.genre in GENRES)).map(sd => sd.id).join(','));
  ok(STANDARDS.filter(sd => sd.genre === 'jazz').length >= 20,
    'jazz group non-empty (≥20)',
    `jazz=${STANDARDS.filter(sd => sd.genre === 'jazz').length}`);
  ok(['classical', 'kpop'].every(g => g in GENRES &&
    STANDARDS.some(sd => sd.genre === g)),
    'new classical + kpop genres exist and non-empty');
  ok(Object.keys(GENRES).filter(g => g !== 'custom').every(g =>
    STANDARDS.filter(sd => sd.genre === g).length >= 3),
    'every preset genre has ≥3 songs (custom starts empty)',
    Object.keys(GENRES).map(g =>
      `${g}=${STANDARDS.filter(sd => sd.genre === g).length}`).join(' '));
  { // every bar resolves to a symbol that parseSymbol reads back — the
    // same chordSymbol → parseSymbol round-trip the symbols block checks
    const bad = [];
    for (const sd of STANDARDS) {
      sd.bars.forEach((b, i) => {
        const ch = makeChord(sd.key + b.off, b.q);
        const parsed = parseSymbol(chordSymbol(ch));
        if (!parsed || parsed.root !== ch.root || parsed.quality !== ch.quality) {
          bad.push(`${sd.id}[${i}]`);
        }
      });
    }
    ok(bad.length === 0, 'every bar round-trips chordSymbol → parseSymbol',
      bad.slice(0, 8).join(','));
  }
  for (const sd of STANDARDS) {
    // cells must partition slots in order and beats must equal 4×cells —
    // the same barCells contract the song-mode chart relies on
    const cells = songs.barCells(sd);
    const flat = cells.flatMap(c => c.slots);
    const beats = sd.bars.reduce((a, b) => a + (b.beats || (b.half ? 2 : 4)), 0);
    ok(cells.every(c => c.slots.length <= 4) &&
      flat.length === sd.bars.length && flat.every((v, i) => v === i) &&
      beats === cells.length * 4,
      `${sd.id}: barCells partitions slots, beats = 4×cells`,
      `cells=${cells.length} slots=${flat.length} beats=${beats}`);
  }
  { // spot-check: All of Me opens on Cmaj7 (pcs 0,4,7,11), bar 11 is Am7
    const aom = STANDARDS.find(x => x.id === 'all-of-me');
    ok(!!aom && aom.genre === 'jazz' &&
      aom.bars[0].off === 0 && aom.bars[0].q === 'maj7' &&
      aom.bars[10].off === 9 && aom.bars[10].q === 'm7',
      'All of Me starts Cmaj7 … Am7 (slot 10)');
  }
  { // spot-check: Hotel California opens on Bm (i of B minor)
    const hc = STANDARDS.find(x => x.id === 'hotel-california');
    ok(!!hc && hc.key === 11 && hc.minor === true &&
      hc.bars[0].off === 0 && hc.bars[0].q === 'm',
      'Hotel California bar 0 = Bm');
  }
  { // spot-check: Freddie Freeloader is NOT a generic blues — no quick IV
    // in bar 2 (Bb7 all four bars), and the tag is the backdoor bVII7
    // (Ab7) in bars 11–12, not V–I
    const ff = STANDARDS.find(x => x.id === 'freddie-freeloader');
    ok(!!ff && ff.bars[1].off === 0 && ff.bars[1].q === '7' &&
      ff.bars[10].off === 10 && ff.bars[10].q === '7' &&
      ff.bars[11].off === 10 && ff.bars[11].q === '7',
      'Freddie Freeloader: no quick IV, backdoor Ab7 tag');
  }
  { // spot-check: Summertime bar 12 is the II7–V7 (D7 G7) into C —
    // slots 14/15 of the chart (line 3's last bar, a half pair)
    const st = STANDARDS.find(x => x.id === 'summertime');
    ok(!!st && st.bars[14].half === true && st.bars[14].off === 5 &&
      st.bars[14].q === '7' && st.bars[15].half === true &&
      st.bars[15].off === 10 && st.bars[15].q === '7',
      'Summertime bar 12 = D7 G7');
  }
  { // spot-check: Night and Day opens Abmaj7→G7 — the maj7 a half-step
    // above the dominant. Bar 0 pcs should be Ab C Eb G (8,0,3,7).
    const nd = STANDARDS.find(x => x.id === 'night-and-day');
    const ch = nd && makeChord(nd.key + nd.bars[0].off, nd.bars[0].q);
    const pcs = ch && chordPcs(ch.root, ch.quality);
    ok(!!nd && nd.key === 0 && nd.bars[0].off === 8 &&
      pcs.has(8) && pcs.has(0) && pcs.has(3) && pcs.has(7),
      'Night and Day bar 0 = Abmaj7 (pcs 8,0,3,7)');
  }
  { // spot-check: Canon in D — classical entry opens on the I–V of the
    // ground bass (D then A), one chord per bar
    const cd = STANDARDS.find(x => x.id === 'canon-in-d');
    ok(!!cd && cd.genre === 'classical' && cd.key === 2 &&
      cd.bars[0].off === 0 && cd.bars[0].q === '' &&
      cd.bars[1].off === 7 && cd.bars[1].q === '',
      'Canon in D opens D → A');
  }
  { // spot-check: 밤편지 keeps the signature G→Gm minor-tonic switch and
    // opens on a G/A half pair
    const tt = STANDARDS.find(x => x.id === 'through-the-night');
    ok(!!tt && tt.genre === 'kpop' && tt.key === 7 &&
      tt.bars[0].half === true && tt.bars[0].off === 0 &&
      tt.bars[1].off === 2 && tt.bars.some(b => b.off === 0 && b.q === 'm'),
      'Through the Night: G/A opening + Gm switch');
  }
  { // section markers: `bar` indexes display cells (stock charts: cell ==
    // bar — verified by the barCells contract above), `name` comes from
    // the fixed key set songs.js localizes (letters A–D stay as-is), and
    // the list is strictly ascending so buildChart streams markers in
    // order. Stock songs all carry a map; saved 'custom' charts may not.
    const SEC_NAMES = new Set(['intro', 'verse', 'pre', 'chorus', 'bridge',
      'interlude', 'solo', 'outro', 'tag', 'refrain', 'head', 'vamp',
      'A', 'B', 'C', 'D']);
    for (const sd of STANDARDS) {
      const n = songs.barCells(sd).length;
      const secs = sd.sections || [];
      const inRange = secs.every(x => Number.isInteger(x.bar) &&
        x.bar >= 0 && x.bar < n && SEC_NAMES.has(x.name));
      const sorted = secs.every((x, i) => !i || x.bar > secs[i - 1].bar);
      ok(inRange && sorted && (sd.genre === 'custom' || secs.length > 0),
        `${sd.id}: sections sorted, in-range, known names`,
        secs.map(x => `${x.name}@${x.bar}`).join(' '));
    }
  }

  // -- strum patterns: preset grid contract + custom-pattern validation --
  // (pure data checks — the session only ever reads beats/slots)
  report('strum patterns');
  const strum = await import('../js/screens/strum.js');
  { // every preset lives on the 8th-note grid: 2 slots per metronome beat
    ok(strum.PATTERNS.every(p => p.beats === 3 || p.beats === 4),
      'every preset: beats ∈ {3,4}');
    ok(strum.PATTERNS.every(p => p.slots.length === p.beats * 2),
      'every preset: slots.length === beats*2');
    ok(strum.PATTERNS.every(p => /^[DU.]+$/.test(p.slots)),
      'every preset: slot chars ∈ {D,U,.}');
    ok(new Set(strum.PATTERNS.map(p => p.id)).size === strum.PATTERNS.length,
      'preset ids unique');
    ok(strum.PATTERNS.every(p => p.name && p.name.ko && p.name.en),
      'preset names bilingual (ko+en)');
    ok(strum.PATTERNS.length >= 12,
      `≥12 presets after the pattern pack (got ${strum.PATTERNS.length})`);
  }
  { // the gt.patterns validator: accepts a well-formed entry, rejects each
    // broken field individually (bad loads are dropped, not repaired)
    const good = { id: 'pat-1', beats: 4, slots: 'D.U.D.U.',
      name: { ko: 'x', en: 'x' } };
    ok(strum.validPattern(good), 'validator accepts well-formed pattern');
    ok(strum.validPattern({ ...good, beats: 3, slots: 'D.U.U.' }),
      'validator accepts 3/4 pattern');
    ok(!strum.validPattern({ ...good, beats: 6 }), 'validator rejects beats=6');
    ok(!strum.validPattern({ ...good, slots: 'D.U' }),
      'validator rejects short slots');
    ok(!strum.validPattern({ ...good, slots: 'D.U.D.UX' }),
      'validator rejects bad slot char');
    ok(!strum.validPattern({ ...good, name: 'x' }),
      'validator rejects non-bilingual name');
    ok(!strum.validPattern(null) && !strum.validPattern('DUDU'),
      'validator rejects non-objects');
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

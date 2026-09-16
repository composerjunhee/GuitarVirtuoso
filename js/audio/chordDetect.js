// Chord verification from a magnitude spectrum.
// Not open-set recognition: we know the expected chord, so we build a
// harmonic-aware pitch-class profile and score how well it covers the
// chord's pitch classes (+ bass note), sustained over time by the caller.

import { freqToPc, freqToMidi, midiToPc, midiToFreq, STRINGS } from '../theory/notes.js';
import { requiredPcs, bassPc } from '../theory/chords.js';

const F_MIN = 65;          // below low E there is nothing useful
const F_MAX = 1200;        // covers high-position voicing fundamentals; the
                           // harmonic-fold logic discounts the extra overtones
const PEAK_KEEP = 32;      // real guitars produce more peaks than synth;
                           // truncation hits quiet bass fundamentals first
const PEAK_RANGE_DB = 42;  // drop peaks this far below the strongest
const FLOOR_MARGIN = 10;   // noise floor = median + this many dB

// freqDb: Float32Array of dB magnitudes; binHz = sampleRate/fftSize.
// `need` (optional Set of expected pitch classes) tunes harmonic handling:
// a harmonic-like peak on a chord tone stays full weight (it may be a real
// note — a played G is indistinguishable from C's 3rd harmonic), while one
// on a foreign pc is mostly overtones and gets suppressed hard.
// `voicing` (optional {frets:[6]} or bare fret array) adds per-string
// verification against the displayed shape — see checkStrings below.
export function profileFromSpectrum(freqDb, binHz, need = null, voicing = null) {
  const lo = Math.max(1, Math.floor(F_MIN / binHz));
  const hi = Math.min(freqDb.length - 1, Math.floor(F_MAX / binHz));

  // Adaptive noise floor: absolute dB floors assume a controlled input gain
  // (we disable AGC), so a quiet player would see a crushed dynamic range.
  // Median of the band ≈ noise level; peaks must clear it by FLOOR_MARGIN.
  let median;
  {
    // numeric sort — default sort() is lexicographic and lands the median
    // on a mid-band value, which can sit ABOVE the real peaks → null profile
    const band = Array.from(freqDb.subarray(lo, hi)).sort((a, b) => a - b);
    median = band[band.length >> 1];
  }
  const floor = median + FLOOR_MARGIN;

  // local maxima with parabolic freq interpolation (in dB domain)
  const peaks = [];
  for (let i = lo; i < hi; i++) {
    const m = freqDb[i];
    if (m > floor && m >= freqDb[i - 1] && m >= freqDb[i + 1]) {
      const a = freqDb[i - 1], b = m, c = freqDb[i + 1];
      const den = a - 2 * b + c;
      const shift = den !== 0 ? 0.5 * (a - c) / den : 0;   // ±0.5 bin
      peaks.push({ f: (i + shift) * binHz, db: b });
    }
  }
  if (!peaks.length) return null;
  peaks.sort((x, y) => y.db - x.db);
  const cut = Math.max(peaks[0].db - PEAK_RANGE_DB, floor);
  const kept = peaks.filter(p => p.db >= cut).slice(0, PEAK_KEEP);

  // mark harmonic-likeness: ≈k× a stronger-or-comparable lower peak.
  // k≤8 because the 7th harmonic is the classic foreign-pc offender; the
  // tolerance is wide because string partials (and our synth) run sharp.
  for (const p of kept) {
    p.harm = kept.some(q =>
      // partials often exceed their fundamental (wound strings, decay) —
      // allow the parent to sit up to 14dB under the partial
      q !== p && q.db > p.db - 14 &&
      (() => {
        const k = Math.round(p.f / q.f);
        // tolerance scales with k: stiff-string partials run sharp by an
        // amount that grows with harmonic number, so a fixed absolute band
        // (0.045) is generous at k=2 but misses the 7th partial entirely
        return k >= 2 && k <= 8 && Math.abs(p.f / q.f - k) < 0.05 * k;
      })());
    p.pc = freqToPc(p.f);
  }

  const prof = new Float64Array(12);
  const fund = new Float64Array(12);   // weight from NON-harmonic peaks only —
  // a pc whose evidence is all overtones (e.g. A string's 7th partial lands
  // near G) is residue, not a played note
  for (const p of kept) {
    let w = Math.pow(10, (p.db - floor) / 20);           // linear-ish weight
    // Soft binning: real strings run ±cents off (detune + inharmonicity),
    // so a peak near a semitone boundary splits weight between neighbours
    // instead of flipping pc and becoming both "missing" and "foreign".
    const midi = freqToMidi(p.f);
    const lo = Math.floor(midi), frac = midi - lo;
    const pcA = ((lo % 12) + 12) % 12, pcB = (pcA + 1) % 12;
    const foreign = need && !need.has(pcA) && !need.has(pcB);
    if (p.harm && foreign) w *= 0.08;                    // foreign overtone
    else if (p.harm) w *= 0.3;                           // unknown context
    prof[pcA] += w * (1 - frac);
    prof[pcB] += w * frac;
    if (!p.harm) {
      fund[pcA] += w * (1 - frac);
      fund[pcB] += w * frac;
    }
  }
  // bass: lowest strong, non-harmonic peak <400Hz with a confirming harmonic
  // above it — a played fundamental sprouts harmonics; rumble and
  // subharmonic artifacts don't.
  let bass = null;
  for (const p of kept) {
    if (p.harm || p.f >= 400 || p.db <= kept[0].db - 30) continue;
    const confirmed = kept.some(q => {
      if (q === p) return false;
      const r = q.f / p.f;
      const k = Math.round(r);
      return k >= 2 && k <= 4 && Math.abs(r - k) < 0.04;
    });
    if (confirmed && (bass === null || p.f < bass.f)) bass = { f: p.f, pc: p.pc };
  }
  const total = prof.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  for (let i = 0; i < 12; i++) { prof[i] /= total; fund[i] /= total; }
  const out = { prof, fund, bassPc: bass ? bass.pc : null };
  if (voicing) out.strings = checkStrings(kept, voicing);
  return out;
}

const STR_TOL = Math.pow(2, 0.7 / 12);   // ±0.7 semitone ≈ ±4% around target

// Per-string check against the displayed voicing: each unmuted string's
// expected fundamental must have a kept peak within ±0.7 st — or ≥2 of its
// first harmonics present (a faint wound-string fundamental is still a
// ringing string if the partials confirm it). Returns [{s, ok, heard}] for
// unmuted strings only; `heard` is the pc actually found near the slot, so
// the UI can name the dead/detuned string.
function checkStrings(kept, voicing) {
  const frets = Array.isArray(voicing) ? voicing : voicing && voicing.frets;
  const out = [];
  if (!frets) return out;
  for (let s = 0; s < 6; s++) {
    const f = frets[s];
    if (f === undefined || f < 0) continue;          // muted — nothing to hear
    const fund = midiToFreq(STRINGS[s] + f);
    let best = null, bestCents = Infinity;
    for (const p of kept) {
      const c = Math.abs(1200 * Math.log2(p.f / fund));
      if (c < bestCents) { bestCents = c; best = p; }
    }
    let ok = bestCents <= 70;
    let heard = ok ? best.pc : null;
    if (!ok) {
      let parts = 0;
      for (let k = 2; k <= 4; k++) {
        const lo = fund * k / STR_TOL, hi = fund * k * STR_TOL;
        if (kept.some(p => p.f > lo && p.f < hi)) parts++;
      }
      if (parts >= 2) { ok = true; heard = midiToPc(STRINGS[s] + f); }
      else if (bestCents <= 150) heard = best.pc;    // near miss ≈ wrong note
    }
    out.push({ s, ok, heard });
  }
  return out;
}

// Score the profile against an expected chord.
// Returns {ok, score, heard:Set, missing:[], bassOk}
export function matchChord(profile, chord) {
  if (!profile) return { ok: false, score: 0, heard: new Set(), missing: [], bassOk: false };
  const need = requiredPcs(chord);
  const want = bassPc(chord);
  let covered = 0;
  const heard = new Set();
  const missing = [];
  for (const pc of need) {
    // a chord tone "sounds" if it holds ≥2% of profile energy AND has real
    // fundamental support — overtone-only pcs (the classic Am→C confusion:
    // A's 7th partial sits near G) aren't evidence anyone played the note
    const sounded = profile.prof[pc] >= 0.02 &&
      (!profile.fund || profile.fund[pc] >= 0.01);
    if (sounded) { covered += profile.prof[pc]; heard.add(pc); }
    else missing.push(pc);
  }
  // voicings.js treats the fifth as omittable in chords with >3 pcs — the
  // checker must accept what the voicing engine itself produces.
  if (need.size > 3) {
    const fifth = (chord.root + 7) % 12;
    for (let i = missing.length - 1; i >= 0; i--)
      if (missing[i] === fifth) missing.splice(i, 1);
  }
  // energy landing on non-chord pcs counts against us (down-weighted: some
  // of it is always unflagged overtones)
  let foreign = 0;
  for (let pc = 0; pc < 12; pc++) if (!need.has(pc)) foreign += profile.prof[pc];

  const score = covered / (covered + foreign * 0.75 + 1e-9);
  // Bass: an explicitly-requested slash bass must match; otherwise any chord
  // tone in the bass is a legitimate inversion.
  const strict = chord.bass !== null && chord.bass !== undefined && chord.bass !== chord.root;
  const bassOk = profile.bassPc === null ||
    (strict ? profile.bassPc === want : need.has(profile.bassPc));
  // all required pcs heard, mostly-clean spectrum, right bass
  const ok = missing.length === 0 && score >= 0.68 && bassOk;
  const res = { ok, score, heard, missing, bassOk, foreign, bassPc: profile.bassPc };
  // voicing template was provided → per-string verdicts + a lenient gate:
  // one dead string still counts (a real strum often leaves one faint)
  if (profile.strings) {
    res.strings = profile.strings;
    res.stringsOk = profile.strings.reduce((n, x) => n + (x.ok ? 0 : 1), 0) <= 1;
  }
  return res;
}

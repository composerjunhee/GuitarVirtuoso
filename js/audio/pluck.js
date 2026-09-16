// Karplus-Strong plucked-string synthesis — no sample assets, works offline.
// Noise burst of period N = sr/freq fed through y[n] = d·(y[n-N]+y[n-N-1])/2.

import { audioCtx } from './engine.js';
import { STRINGS, midiToFreq } from '../theory/notes.js';

const DAMP = 0.996;

const db2lin = db => Math.pow(10, db / 20);

// Render a pluck into a Float32Array (also used by the selftest harness to
// feed synthetic signals into the detectors). `rng` lets tests be
// deterministic — the default Math.random makes every render different.
// opts.cents detunes the string (± cents), opts.gain scales its level;
// both default to no-ops so existing calls render identical audio.
export function renderPluck(freq, sr, dur = 1.4, rng = Math.random, opts = {}) {
  const { cents = 0, gain = 1 } = opts;
  const f = cents ? freq * Math.pow(2, cents / 1200) : freq;
  const len = Math.floor(sr * dur);
  const out = new Float32Array(len);
  const N = Math.max(2, Math.round(sr / f));
  for (let i = 0; i < N && i < len; i++) out[i] = rng() * 2 - 1;
  // a raw white burst is what makes the synth glassy — real picks put most
  // energy in the low/mids, so low-pass the excitation hard (two passes ≈
  // ~4 kHz rolloff) before it ever enters the feedback loop
  for (let pass = 0; pass < 2; pass++) {
    let lp = 0;
    for (let i = 0; i < N && i < len; i++) { lp += 0.35 * (out[i] - lp); out[i] = lp; }
  }
  for (let n = N; n < len; n++) {
    out[n] = DAMP * 0.5 * (out[n - N] + out[n - N + 1]);
  }
  // low-pass the body of the note for warmth + normalize
  let peak = 0;
  for (let n = 1; n < len; n++) {
    out[n] = 0.55 * out[n] + 0.45 * out[n - 1];
    const a = Math.abs(out[n]);
    if (a > peak) peak = a;
  }
  if (peak > 0) for (let n = 0; n < len; n++) out[n] *= (0.5 * gain) / peak;
  return out;
}

// out[i] += sig[i - destOff + srcOff] * g — srcOff lets the caller start the
// source mid-pluck (a previous chord's residual ring: its attack happened
// before buffer t=0, so the buffer only holds the decaying tail).
function mixInto(out, sig, destOff, srcOff, g) {
  for (let i = Math.max(0, destOff - srcOff); i < out.length; i++) {
    const j = i - destOff + srcOff;
    if (j >= sig.length) break;
    out[i] += sig[j] * g;
  }
}

// Paul Kellett's pink-noise approximation — cheap 1/f-ish filtered noise,
// fully deterministic under the injected rng.
function pinkNoise(len, rng) {
  const out = new Float32Array(len);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = rng() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    out[i] = b0 + b1 + b2 + w * 0.1848;
  }
  return out;
}

// One buffer of "what the mic hears": a strummed chord plus the realism
// layers the selftest uses to approximate a real guitar take. All randomness
// flows through `rng` (seeded mulberry32 in the harness) → deterministic.
//
//   specs:                  [{freq, cents?, gain?} | freq | null] per string,
//                           low→high; null = muted (still takes a strum slot)
//   opts.strumMs:           per-string stagger (24ms ≈ a hand strum)
//   opts.mixGain:           per-string mix level (0.4 matches the old harness)
//   opts.noiseDb:           pink-ish noise bed, peak this many dB under a
//                           full-level string
//   opts.residual:          {specs, levelDb=-15, agoSec=1, strumMs} — a
//                           previous chord still ringing; its strings were
//                           plucked `agoSec` before t=0
//   opts.sympatheticDb:     all six open strings resonating at this level
//   opts.sympatheticAgeSec: how long ago they were excited (default 0.6s,
//                           so the buffer holds ring, not attack)
//
// Every *Db level is relative to a full-level string (peak 0.5·mixGain).
export function renderStrum(specs, sr, dur = 1.6, rng = Math.random, opts = {}) {
  const {
    strumMs = 24,
    mixGain = 0.4,
    noiseDb = null,
    residual = null,
    sympatheticDb = null,
    sympatheticAgeSec = 0.6,
  } = opts;
  const len = Math.floor(sr * dur);
  const out = new Float32Array(len);
  const norm = s => (typeof s === 'number' ? { freq: s } : s);

  // Mix a set of strings whose plucks started `ageSec` before buffer t=0,
  // staggered `gapMs` apart. ageSec=0 → the strum happens inside the buffer.
  const layer = (list, layerGain, ageSec, gapMs) => {
    list.forEach((raw, k) => {
      const s = norm(raw);
      if (!s || s.freq == null) return;
      const sig = renderPluck(s.freq, sr, dur + ageSec, rng, { cents: s.cents || 0 });
      const pluckAt = k * gapMs / 1000 - ageSec;        // seconds rel. t=0
      const g = layerGain * (s.gain ?? 1);
      if (pluckAt >= 0) mixInto(out, sig, Math.round(pluckAt * sr), 0, g);
      else mixInto(out, sig, 0, Math.round(-pluckAt * sr), g);
    });
  };

  layer(specs, mixGain, 0, strumMs);

  if (residual) {
    layer(residual.specs,
      mixGain * db2lin(residual.levelDb ?? -15),
      residual.agoSec ?? 1,
      residual.strumMs ?? strumMs);
  }

  if (sympatheticDb != null) {
    layer(STRINGS.map(midiToFreq),
      mixGain * db2lin(sympatheticDb), sympatheticAgeSec, 0);
  }

  if (noiseDb != null) {
    const nz = pinkNoise(len, rng);
    let pk = 0;
    for (let i = 0; i < len; i++) {
      const a = Math.abs(nz[i]);
      if (a > pk) pk = a;
    }
    if (pk > 0) {
      const g = 0.5 * mixGain * db2lin(noiseDb) / pk;
      for (let i = 0; i < len; i++) out[i] += nz[i] * g;
    }
  }
  return out;
}

function playBuffer(samples, when, gain = 0.45) {
  const ctx = audioCtx();
  const buf = ctx.createBuffer(1, samples.length, ctx.sampleRate);
  buf.copyToChannel(samples, 0);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g).connect(ctx.destination);
  src.start(when);
}

// Strum a voicing low→high with a small per-string stagger. `at` offsets
// the start in seconds so a caller can schedule a whole sequence inside
// one gesture (ear trainer's progression drill).
export function playVoicing(voicing, { strumMs = 24, dur = 1.6, at = 0 } = {}) {
  const ctx = audioCtx();
  const t0 = ctx.currentTime + 0.03 + at;
  let i = 0;
  for (let s = 0; s < 6; s++) {
    const f = voicing.frets[s];
    if (f < 0) continue;
    const freq = midiToFreq(STRINGS[s] + f);
    playBuffer(renderPluck(freq, ctx.sampleRate, dur), t0 + i * strumMs / 1000);
    i++;
  }
}

// One plucked note by midi number — the ear trainer's two-note drills.
export function playNote(midi, { at = 0, dur = 1.2, gain = 0.45 } = {}) {
  const ctx = audioCtx();
  const sig = renderPluck(midiToFreq(midi), ctx.sampleRate, dur);
  playBuffer(sig, ctx.currentTime + 0.03 + at, gain);
}

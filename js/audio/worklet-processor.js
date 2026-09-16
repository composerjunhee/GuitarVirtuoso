// AudioWorklet: sliding 4096-sample window (~5 periods of E2 — 2048 was
// marginal for noisy real low strings), posts a frame every 512 samples
// (~86 fps @44.1k). A one-pole DC blocker (~30 Hz HPF) keeps desk rumble
// and handling noise from tilting the difference function at large τ.
// Each message is {win, onset}: `onset` marks a pick attack so vote loops
// can ignore residual ring and only trust frames right after a strum.
//
// The onset algorithm lives in makeOnsetDetector() — a pure factory that
// node tests can import directly. This file must therefore stay loadable
// BOTH as a worklet module (no `import` allowed there) and as an ES module
// (AudioWorkletProcessor/registerProcessor undefined → guarded below).
//
// Why spectral flux instead of hop RMS: a pick attack injects broadband
// high-frequency energy in a single hop, while a ringing chord's HF content
// only decays. An RMS-over-baseline gate misses restrums over loud ring
// (the baseline swallows the jump) and can't tell attack from ring at all;
// the HF band's jump over its own baseline can.

const WIN = 4096;
const HOP = 512;
const DC_R = 0.995;

// ---- pick-attack detector tunables ----
const HP_FC = 2000;        // band split: above ~2 kHz is pick transient,
                           // not ringing-chord body (fundamentals ≤330 Hz,
                           // ring harmonics decay fast up here)
const EMA_A = 0.03;        // HF baseline adapts over ~1/3 s at ~86 hops/s
const HF_RATIO = 4;        // attack HF vs its own baseline — fires even
                           // while LF ring is still loud
const HF_JUMP = 2;         // hop-to-hop HF multiplication — a real attack
                           // is instant; sympathetic buildup is gradual
const HF_MIN = 0.0008;     // ~-62 dBFS HF floor: noise/room never qualifies
const ONSET_MIN = 0.006;   // ~-44 dBFS total-RMS floor (quiet-room guard)
const REFRACT_S = 0.3;     // one strum = one onset, not six

// RBJ highpass biquad — 12 dB/oct, enough to bury the ringing body under
// the transient band. Returns closed-over state, not a class: one per
// detector, allocated once at makeOnsetDetector time.
function makeHighpass(sr, fc) {
  const w = 2 * Math.PI * fc / sr;
  const cos = Math.cos(w), a = Math.sin(w) / (2 * 0.7071);
  const a0 = 1 + a;
  const b0 = (1 + cos) / 2 / a0, b1 = -(1 + cos) / a0, b2 = b0;
  const a1 = -2 * cos / a0, a2 = (1 - a) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return x => {
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

// Pure, testable pick-attack detector: feed it one DC-blocked hop at a
// time, get back whether this hop is a fresh attack. All state is closed
// over; identical math runs in the worklet and in test/selftest.js.
export function makeOnsetDetector(sr, hop = HOP) {
  const hp = makeHighpass(sr, HP_FC);
  const refractHops = Math.ceil(sr * REFRACT_S / hop);
  let hfBase = 0;          // slow EMA of HF-band RMS (0 ⇒ first sound fires)
  let hfPrev = 0;          // previous hop's HF RMS — the flux reference
  let sinceOnset = 1e9;    // hops since last onset (starts "long ago")
  return function detect(hopBuf) {
    let e = 0, he = 0;
    for (let i = 0; i < hop; i++) {
      const x = hopBuf[i];
      e += x * x;
      const y = hp(x);
      he += y * y;
    }
    const rms = Math.sqrt(e / hop);
    const hf = Math.sqrt(he / hop);
    sinceOnset++;
    // attack = loud enough overall AND a sharp HF jump over both the slow
    // baseline and the immediately previous hop. Ring, noise and rumble
    // all fail at least one leg; only a pick clears all of them at once.
    const onset = rms > ONSET_MIN && hf > HF_MIN &&
      hf > hfBase * HF_RATIO && hf > hfPrev * HF_JUMP &&
      sinceOnset > refractHops;
    if (onset) sinceOnset = 0;
    // feed every hop into the baseline — a sustained chord's HF raises it,
    // so ring alone stops re-firing while the next strum still spikes over
    hfBase += (hf - hfBase) * EMA_A;
    hfPrev = hf;
    return onset;
  };
}

// Guarded: AudioWorkletProcessor/registerProcessor exist only inside an
// AudioWorkletGlobalScope. In node, the class is never defined and only
// makeOnsetDetector (above) is imported.
if (typeof AudioWorkletProcessor === 'function' &&
    typeof registerProcessor === 'function') {
  class FrameProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.win = new Float32Array(WIN);
      this.pending = new Float32Array(HOP);
      this.pi = 0;
      this.x1 = 0; this.y1 = 0;                    // DC blocker state
      this.detect = makeOnsetDetector(sampleRate, HOP);
    }
    process(inputs) {
      const ch = inputs[0] && inputs[0][0];
      if (!ch || !ch.length) return true;
      for (let i = 0; i < ch.length; i++) {
        const x = ch[i];
        const y = x - this.x1 + DC_R * this.y1;
        this.x1 = x; this.y1 = y;
        this.pending[this.pi++] = y;
        if (this.pi === HOP) {
          // attack detect on the DC-blocked hop, before the window slides
          const onset = this.detect(this.pending);
          this.win.copyWithin(0, HOP);
          this.win.set(this.pending, WIN - HOP);
          this.pi = 0;
          this.port.postMessage({ win: this.win, onset });
        }
      }
      return true;
    }
  }
  registerProcessor('gt-frames', FrameProcessor);
}

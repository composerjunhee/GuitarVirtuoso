// AudioWorklet: sliding 4096-sample window (~5 periods of E2 — 2048 was
// marginal for noisy real low strings), posts a frame every 512 samples
// (~86 fps @44.1k). A one-pole DC blocker (~30 Hz HPF) keeps desk rumble
// and handling noise from tilting the difference function at large τ.
// Each message is {win, onset}: `onset` marks a pick attack — hop RMS
// jumping well above a slow baseline — so vote loops can ignore residual
// ring and only trust frames right after a strum.

const WIN = 4096;
const HOP = 512;
const DC_R = 0.995;
const EMA_A = 0.03;        // baseline adapts over ~1/3 s at ~86 hops/s
const ONSET_RATIO = 4;     // attack RMS vs baseline — strums spike hard
const ONSET_MIN = 0.006;   // ~-44 dBFS: a quiet room must never self-trigger
const REFRACT_S = 0.3;     // one strum = one onset, not six

class FrameProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.win = new Float32Array(WIN);
    this.pending = new Float32Array(HOP);
    this.pi = 0;
    this.x1 = 0; this.y1 = 0;      // DC blocker state
    this.base = 0;                 // slow EMA of hop RMS (0 ⇒ first sound fires)
    this.sinceOnset = 1e9;         // hops since last onset (starts "long ago")
    this.refractHops = Math.ceil(sampleRate * REFRACT_S / HOP);
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
        let e = 0;
        for (let j = 0; j < HOP; j++) e += this.pending[j] * this.pending[j];
        const rms = Math.sqrt(e / HOP);
        let onset = false;
        this.sinceOnset++;
        if (rms > ONSET_MIN && rms > this.base * ONSET_RATIO &&
            this.sinceOnset > this.refractHops) {
          onset = true;
          this.sinceOnset = 0;
        }
        // feed every hop into the baseline — a sustained chord raises it,
        // so ring alone stops re-firing; the next strum still spikes over
        this.base += (rms - this.base) * EMA_A;
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

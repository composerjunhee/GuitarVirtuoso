// Microphone input, shared by tuner and practice screens.
// Time-domain frames (worklet) for pitch, spectrum (AnalyserNode) for chords.

import { audioCtx } from './engine.js';

export class MicInput {
  constructor() {
    this.onFrame = null;          // (Float32Array(4096)) per hop
    this._lastOnset = 0;          // performance.now() of the last pick attack
    this._specBuf = null;
    this._started = false;
  }

  async start() {
    if (this._started) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // processing smears harmonics — we want the raw-ish signal
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    const ctx = audioCtx();
    this.stream = stream;
    this.src = ctx.createMediaStreamSource(stream);
    await ctx.audioWorklet.addModule('js/audio/worklet-processor.js');
    this.node = new AudioWorkletNode(ctx, 'gt-frames');
    // worklet posts {win, onset}; consumers of onFrame (tuner) still want
    // the bare window, so unwrap here and keep the onset timestamp on `mic`
    this.node.port.onmessage = e => {
      const { win, onset } = e.data;
      if (onset) this._lastOnset = performance.now();
      this.onFrame?.(win);
    };
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 8192;   // ~5.4 Hz/bin — enough to split B2/D3
    // 0.55 made consecutive polls too correlated for the 4-of-6 vote ring
    this.analyser.smoothingTimeConstant = 0.3;
    this._specBuf = new Float32Array(this.analyser.frequencyBinCount);
    this.src.connect(this.node);
    this.src.connect(this.analyser);
    this._started = true;
  }

  // latest magnitude spectrum (dB) + resolution in Hz/bin
  spectrum() {
    if (!this.analyser) return null;
    this.analyser.getFloatFrequencyData(this._specBuf);
    return { db: this._specBuf, binHz: this.src.context.sampleRate / this.analyser.fftSize };
  }

  get running() { return this._started; }

  // ms timestamp (performance.now domain) of the most recent attack; 0 if
  // none since start — poll loops gate "residual ring" votes on its age
  get lastOnset() { return this._lastOnset; }

  stop() {
    this._started = false;
    this._lastOnset = 0;
    this.stream?.getTracks().forEach(t => t.stop());
    this.node?.disconnect();
    this.src?.disconnect();
    this.analyser?.disconnect();
    this.stream = this.node = this.src = this.analyser = null;
  }
}

export const mic = new MicInput();

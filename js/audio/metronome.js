// Lookahead metronome: schedule clicks ~120ms ahead on the audio clock.
// onBeat(beatIndex, audioTime) fires ahead of time too — callers that need
// visual sync should setTimeout(audioTime - currentTime).

import { audioCtx } from './engine.js';

export class Metronome {
  constructor(onBeat) {
    this.onBeat = onBeat;
    this.bpm = 72;
    this.beatsPerBar = 4;
    this._timer = null;
    this._next = 0;
    this._beat = 0;
  }

  start(bpm = this.bpm, beatsPerBar = this.beatsPerBar) {
    this.bpm = bpm;
    this.beatsPerBar = beatsPerBar;
    const ctx = audioCtx();
    this._beat = 0;
    this._next = ctx.currentTime + 0.1;
    this._timer = setInterval(() => this._schedule(), 25);
  }

  setBpm(bpm) { this.bpm = bpm; }

  _schedule() {
    const ctx = audioCtx();
    const spb = 60 / this.bpm;
    while (this._next < ctx.currentTime + 0.12) {
      this._click(this._next, this._beat % this.beatsPerBar === 0);
      this.onBeat?.(this._beat, this._next);
      this._next += spb;
      this._beat++;
    }
  }

  _click(t, accent) {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = accent ? 1500 : 1000;
    g.gain.setValueAtTime(accent ? 0.5 : 0.32, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  get running() { return !!this._timer; }

  stop() {
    clearInterval(this._timer);
    this._timer = null;
  }
}

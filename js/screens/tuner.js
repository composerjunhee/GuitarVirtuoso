// Tuner screen: chromatic needle. Optional string-target mode — tap a string
// chip to show cents against that string instead of the nearest note.

import { createGauge } from '../ui/needle.js';
import { mic } from '../audio/input.js';
import { detectPitch } from '../audio/pitch.js';
import { audioCtx } from '../audio/engine.js';
import { STRINGS, STRING_NAMES, midiToFreq, freqToMidi, pcName, midiToPc } from '../theory/notes.js';
import { chipRow, showBanner } from '../ui/components.js';
import { t, getLang } from '../i18n.js';
import { settings } from '../state.js';

let gauge;
let targetMidi = null;      // null = chromatic
let rafId = null;
let smoothed = null;
let lastMidi = null;        // stability gate state
let pendingMidi = null;
let pendingHits = 0;

function renderStrings() {
  chipRow(document.getElementById('stringBtns'),
    // guitar convention: string 6 = low E (STRINGS[0]), string 1 = high E
    STRINGS.map((m, i) => ({ id: m, label: `${6 - i} ${STRING_NAMES[i]}` })),
    targetMidi, id => {
      targetMidi = targetMidi === id ? null : id;
      renderStrings();
    });
}

async function toggleMic() {
  if (mic.running) {
    mic.stop();
    mic.onFrame = null;
    document.getElementById('tunerMicBtn').textContent = t('tu.start');
    document.getElementById('tunerLevel').style.width = '0';
    gauge.set(null);
    return;
  }
  try {
    await mic.start();
  } catch (e) {
    showBanner(e && e.name === 'NotAllowedError' ? t('mic.denied') : t('mic.failed'));
    return;
  }
  document.getElementById('tunerMicBtn').textContent = t('tu.stop');
  lastMidi = pendingMidi = null; pendingHits = 0; smoothed = null;
  const sr = audioCtx().sampleRate;
  const levelEl = document.getElementById('tunerLevel');
  mic.onFrame = frame => {
    // input-level bar: raw frame RMS so a dead mic / too-quiet input is
    // visible instead of silently looking like "tuner broken"
    let e = 0;
    for (let i = 0; i < frame.length; i++) e += frame[i] * frame[i];
    const rms = Math.sqrt(e / frame.length);
    // dB-scaled: -70dB→0%, -20dB→100% so soft plucks still register visibly
    const pct = Math.max(0, Math.min(100, (20 * Math.log10(rms + 1e-9) + 70) * 2));
    levelEl.style.width = `${pct.toFixed(1)}%`;
    const p = detectPitch(frame, sr);
    if (!p) { return; }                    // hold last reading on silence
    let midi, cents;
    if (targetMidi !== null) {
      cents = 1200 * Math.log2(p.freq / midiToFreq(targetMidi));
      midi = targetMidi;
    } else {
      midi = Math.round(freqToMidi(p.freq));
      cents = 1200 * Math.log2(p.freq / midiToFreq(midi));
      // Stability gate on PITCH CLASS: guitar partials make the estimate
      // flicker across octaves (E2↔E3 = 12 st), which under a raw-midi gate
      // resets the pending counter every frame and nothing ever displays.
      // Same-pc octave jumps show the same note name — let them through.
      const pc = ((midi % 12) + 12) % 12;
      const lastPc = lastMidi === null ? null : ((lastMidi % 12) + 12) % 12;
      const pcJump = lastPc === null ? 0
        : Math.min(Math.abs(pc - lastPc), 12 - Math.abs(pc - lastPc));
      if (lastMidi !== null && pcJump > 2) {
        pendingHits = pc === pendingMidi ? pendingHits + 1 : 1;
        pendingMidi = pc;
        if (pendingHits < 2) return;
      }
      lastMidi = midi; pendingMidi = null; pendingHits = 0;
    }
    // smooth the needle a touch
    smoothed = smoothed === null ? cents : smoothed * 0.6 + cents * 0.4;
    update(smoothed, midi, p.freq);
  };
}

function update(cents, midi, freq) {
  gauge.set(cents);
  const nameEl = document.getElementById('tunerNote');
  nameEl.textContent = pcName(midiToPc(midi), { flat: settings.flat, lang: getLang() });
  nameEl.classList.toggle('in-tune', Math.abs(cents) <= 5);
  document.getElementById('tunerCents').textContent =
    `${cents >= 0 ? '+' : ''}${cents.toFixed(1)}c`;
  document.getElementById('tunerFreq').textContent = `${freq.toFixed(1)} Hz`;
}

export function initTuner() {
  gauge = createGauge(document.getElementById('tunerGauge'));
  renderStrings();
  document.getElementById('tunerMicBtn').addEventListener('click', toggleMic);
}

// app.js calls this when leaving the tab so the mic doesn't stay hot.
export function suspendTuner() {
  if (mic.running) toggleMic();
}

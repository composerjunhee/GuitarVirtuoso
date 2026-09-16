// Pitch-class math. PCs: 0=C … 11=B. Midi 69 = A4 = 440 Hz.

export const PC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const PC_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const PC_KO = ['도', '도♯', '레', '레♯', '미', '파', '파♯', '솔', '솔♯', '라', '라♯', '시'];

// Standard tuning, low string first: E2 A2 D3 G3 B3 E4.
export const STRINGS = [40, 45, 50, 55, 59, 64];
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'E'];

export const A4 = 440;
export const A4_MIDI = 69;

export function pcName(pc, { flat = false, lang = 'en' } = {}) {
  pc = ((pc % 12) + 12) % 12;
  if (lang === 'ko') return PC_KO[pc];
  return (flat ? PC_FLAT : PC_SHARP)[pc];
}

// Which spelling fits a key: flat keys use flats, sharp keys sharps.
export const FLAT_KEYS = new Set([1, 3, 5, 6, 8, 10]); // Db Eb F Gb Ab Bb roughly
export function preferFlat(rootPc) { return FLAT_KEYS.has(((rootPc % 12) + 12) % 12); }

export function parseNote(name) {
  const m = /^([A-Ga-g])([#♯b♭]?)/.exec(name.trim());
  if (!m) return null;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1].toUpperCase()];
  const acc = m[2];
  return (base + (acc === '#' || acc === '♯' ? 1 : acc === 'b' || acc === '♭' ? -1 : 0) + 12) % 12;
}

export function midiToFreq(m) { return A4 * Math.pow(2, (m - A4_MIDI) / 12); }
export function freqToMidi(f) { return A4_MIDI + 12 * Math.log2(f / A4); }
export function midiToPc(m) { return ((m % 12) + 12) % 12; }
export function freqToPc(f) { return midiToPc(Math.round(freqToMidi(f))); }

// Signed cents from note freq to target freq.
export function centsOff(freq, target) { return 1200 * Math.log2(freq / target); }

export function fretToMidi(stringIdx, fret, tuning = STRINGS) {
  return tuning[stringIdx] + fret;
}

// Note spelling for a midi number on the fretboard display.
export function midiName(m, opts) { return pcName(midiToPc(m), opts); }

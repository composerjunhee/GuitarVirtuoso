// Chord qualities and symbol parsing.
// A chord = { root: pc, quality: key into QUALITIES, bass: pc|null (slash chords) }.

import { parseNote, pcName, preferFlat } from './notes.js';

// interval lists are semitones above root; values ≥12 are upper extensions.
export const QUALITIES = {
  '':      { label: 'maj',   intervals: [0, 4, 7] },
  'm':     { label: 'min',   intervals: [0, 3, 7] },
  '5':     { label: '5',     intervals: [0, 7] },
  'dim':   { label: 'dim',   intervals: [0, 3, 6] },
  'aug':   { label: 'aug',   intervals: [0, 4, 8] },
  'sus2':  { label: 'sus2',  intervals: [0, 2, 7] },
  'sus4':  { label: 'sus4',  intervals: [0, 5, 7] },
  '6':     { label: '6',     intervals: [0, 4, 7, 9] },
  'm6':    { label: 'm6',    intervals: [0, 3, 7, 9] },
  '7':     { label: '7',     intervals: [0, 4, 7, 10] },
  'maj7':  { label: 'maj7',  intervals: [0, 4, 7, 11] },
  'm7':    { label: 'm7',    intervals: [0, 3, 7, 10] },
  'm7b5':  { label: 'm7♭5', intervals: [0, 3, 6, 10] },
  'dim7':  { label: 'dim7',  intervals: [0, 3, 6, 9] },
  '7sus4': { label: '7sus4', intervals: [0, 5, 7, 10] },
  'add9':  { label: 'add9',  intervals: [0, 2, 4, 7] },
  '9':     { label: '9',     intervals: [0, 4, 7, 10, 14] },
  'm9':    { label: 'm9',    intervals: [0, 3, 7, 10, 14] },
  'maj9':  { label: 'maj9',  intervals: [0, 4, 7, 11, 14] },
  '11':    { label: '11',    intervals: [0, 7, 10, 14, 17] },
  '13':    { label: '13',    intervals: [0, 4, 7, 10, 14, 21] },
};

// Display order for the quality chips, grouped simple → extended.
export const QUALITY_ORDER = [
  '', 'm', '5', 'sus2', 'sus4', 'dim', 'aug',
  '6', 'm6', '7', 'maj7', 'm7', 'm7b5', 'dim7', '7sus4',
  'add9', '9', 'm9', 'maj9', '11', '13',
];

export function chordPcs(rootPc, quality) {
  const q = QUALITIES[quality];
  if (!q) throw new Error(`unknown quality ${quality}`);
  return new Set(q.intervals.map(i => (rootPc + i) % 12));
}

// 'F#m7/B' → { root:6, quality:'m7', bass:11 }; bare 'Am' → bass:null (=root).
export function parseSymbol(sym) {
  const [head, bassName] = sym.split('/');
  const m = /^([A-Ga-g][#♯b♭]?)(.*)$/.exec(head.trim());
  if (!m) return null;
  const root = parseNote(m[1]);
  const quality = m[2].replace('♭5', 'b5').trim();
  if (!(quality in QUALITIES)) return null;
  const bass = bassName ? parseNote(bassName) : null;
  return { root, quality, bass };
}

export function chordSymbol(chord, { flat, lang } = {}) {
  if (flat === undefined) flat = preferFlat(chord.root);
  // quality keys are already symbol-like; only b5 needs the ♭ glyph
  const suffix = chord.quality.replace('b5', '♭5');
  let s = pcName(chord.root, { flat, lang }) + suffix;
  if (chord.bass !== null && chord.bass !== undefined && chord.bass !== chord.root) {
    s += '/' + pcName(chord.bass, { flat, lang });
  }
  return s;
}

export function makeChord(root, quality = '', bass = null) {
  return { root: ((root % 12) + 12) % 12, quality, bass };
}

// pcs the checker must hear: chord tones; bass enforced separately.
export function requiredPcs(chord) {
  return chordPcs(chord.root, chord.quality);
}

export function bassPc(chord) {
  return chord.bass ?? chord.root;
}

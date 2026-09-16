// Canonical voicings. Two sources:
//  1. OPEN — hand-picked open-position shapes for common chords.
//  2. BARRE — E-shape / A-shape barre templates applied to every root.
// Keys are "rootPc|quality|bass" (bass empty = root position).

import { STRINGS, midiToPc } from '../theory/notes.js';

const OPEN = {
  // open majors / minors
  '0|':    [[-1, 3, 2, 0, 1, 0]],            // C
  '2|':    [[-1, -1, 0, 2, 3, 2]],           // D
  '4|':    [[0, 2, 2, 1, 0, 0]],             // E
  '5|':    [[1, 3, 3, 2, 1, 1]],             // F  (barre 1)
  '7|':    [[3, 2, 0, 0, 0, 3]],             // G
  '9|':    [[-1, 0, 2, 2, 2, 0]],            // A
  '9|m':   [[-1, 0, 2, 2, 1, 0]],            // Am
  '2|m':   [[-1, -1, 0, 2, 3, 1]],           // Dm
  '4|m':   [[0, 2, 2, 0, 0, 0]],             // Em
  '0|m':   [[-1, 3, 5, 5, 4, 3]],            // Cm (barre 3)
  '5|m':   [[1, 3, 3, 1, 1, 1]],             // Fm (barre 1)
  '7|m':   [[3, 5, 5, 3, 3, 3]],             // Gm (barre 3)
  '11|m':  [[-1, 2, 4, 4, 3, 2]],            // Bm (barre 2)
  // sevenths
  '0|7':   [[-1, 3, 2, 3, 1, 0]],            // C7
  '2|7':   [[-1, -1, 0, 2, 1, 2]],           // D7
  '4|7':   [[0, 2, 0, 1, 0, 0]],             // E7
  '7|7':   [[3, 2, 0, 0, 0, 1]],             // G7
  '9|7':   [[-1, 0, 2, 0, 2, 0]],            // A7
  '11|7':  [[-1, 2, 1, 2, 0, 2]],            // B7
  '0|maj7': [[-1, 3, 2, 0, 0, 0]],           // Cmaj7
  '2|maj7': [[-1, -1, 0, 2, 2, 2]],          // Dmaj7
  '5|maj7': [[-1, -1, 3, 2, 1, 0]],          // Fmaj7 (easy)
  '7|maj7': [[3, -1, 0, 0, 0, 2]],           // Gmaj7
  '9|maj7': [[-1, 0, 2, 1, 2, 0]],           // Amaj7
  '9|m7':  [[-1, 0, 2, 0, 1, 0]],            // Am7
  '2|m7':  [[-1, -1, 0, 2, 1, 1]],           // Dm7
  '4|m7':  [[0, 2, 0, 0, 0, 0], [0, 2, 2, 0, 3, 0]], // Em7
  '11|m7': [[-1, 2, 4, 2, 3, 2]],            // Bm7 (barre 2)
  // sus / others
  '9|sus2': [[-1, 0, 2, 2, 0, 0]],           // Asus2
  '9|sus4': [[-1, 0, 2, 2, 3, 0]],           // Asus4
  '2|sus2': [[-1, -1, 0, 2, 3, 0]],          // Dsus2
  '2|sus4': [[-1, -1, 0, 2, 3, 3]],          // Dsus4
  '4|sus4': [[0, 2, 2, 2, 0, 0]],            // Esus4
  '0|add9': [[-1, 3, 2, 0, 3, 0]],           // Cadd9
  '9|5':   [[-1, 0, 2, 2, -1, -1]],          // A5
  '4|5':   [[0, 2, 2, -1, -1, -1]],          // E5
  '7|5':   [[3, 5, 5, -1, -1, -1]],          // G5
  '2|5':   [[-1, -1, 0, 2, -1, -1]],         // D5
};

// Barre templates: offsets from the barre fret n (root on the named string).
// eShape: root on low E string; aShape: root on A string.
const BARRE = {
  '':     { e: [0, 2, 2, 1, 0, 0], a: [-1, 0, 2, 2, 2, 0] },
  'm':    { e: [0, 2, 2, 0, 0, 0], a: [-1, 0, 2, 2, 1, 0] },
  '7':    { e: [0, 2, 0, 1, 0, 0], a: [-1, 0, 2, 0, 2, 0] },
  'm7':   { e: [0, 2, 0, 0, 0, 0], a: [-1, 0, 2, 0, 1, 0] },
  'maj7': { e: [0, 2, 1, 1, 0, 0], a: [-1, 0, 2, 1, 2, 0] },
  '5':    { e: [0, 2, 2, -1, -1, -1], a: [-1, 0, 2, 2, -1, -1] },
  'sus4': { e: [0, 2, 2, 2, 0, 0], a: [-1, 0, 2, 2, 3, 0] },
  'm7b5': { a: [-1, 0, 1, 0, 1, -1] },        // Bm7b5 = x2323x → offsets 0,1,0,1
};

export const CURATED = build();

function build() {
  const map = {};
  for (const [key, shapes] of Object.entries(OPEN)) {
    map[key] = shapes.map(frets => ({ frets }));
  }
  // apply barre templates to all roots
  for (let root = 0; root < 12; root++) {
    for (const [q, tpl] of Object.entries(BARRE)) {
      const key = `${root}|${q}|`;
      map[key] = map[key] || [];
      for (const [shape, baseString] of [[tpl.e, 0], [tpl.a, 1]]) {
        if (!shape) continue;
        const rootFret = ((root - midiToPc(STRINGS[baseString])) % 12 + 12) % 12;
        if (rootFret === 0 || rootFret > 12) continue;   // 0 = open shape, >12 too high
        map[key].push({ frets: shape.map(d => (d < 0 ? -1 : d + rootFret)) });
      }
    }
  }
  return map;
}

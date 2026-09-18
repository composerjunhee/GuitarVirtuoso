// Canonical voicings. Two sources:
//  1. OPEN — hand-picked open-position shapes for common chords.
//  2. MOVABLE — root-position shapes slid to every root. Each entry is
//     [baseString, offsets]: the root's fret on that string becomes the
//     shape's fret 0; offsets are SIGNED ints (negative = a note below the
//     root fret), null = muted string. Instantiations needing a fret <0 or
//     >15 (MAX_FRET in voicings.js) are skipped for that root.
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
  '4|7sus4': [[0, 2, 0, 2, 0, 0]],           // E7sus4
  '9|7sus4': [[-1, 0, 2, 0, 3, 0]],          // A7sus4
  '0|maj7': [[-1, 3, 2, 0, 0, 0]],           // Cmaj7
  '2|maj7': [[-1, -1, 0, 2, 2, 2]],          // Dmaj7
  '5|maj7': [[-1, -1, 3, 2, 1, 0]],          // Fmaj7 (easy)
  '7|maj7': [[3, -1, 0, 0, 0, 2]],           // Gmaj7
  '9|maj7': [[-1, 0, 2, 1, 2, 0]],           // Amaj7
  '9|m7':  [[-1, 0, 2, 0, 1, 0]],            // Am7
  '2|m7':  [[-1, -1, 0, 2, 1, 1]],           // Dm7
  '4|m7':  [[0, 2, 0, 0, 0, 0], [0, 2, 2, 0, 3, 0]], // Em7
  '11|m7': [[-1, 2, 4, 2, 3, 2]],            // Bm7 (barre 2)
  '9|m7b5': [[-1, 0, 1, 0, 1, -1]],          // Am7b5
  '4|m7b5': [[0, 1, 0, 0, 3, 0]],            // Em7b5
  '9|dim7': [[-1, 0, 1, 2, 1, 2]],           // Adim7
  // sus / others
  '9|sus2': [[-1, 0, 2, 2, 0, 0]],           // Asus2
  '9|sus4': [[-1, 0, 2, 2, 3, 0]],           // Asus4
  '2|sus2': [[-1, -1, 0, 2, 3, 0]],          // Dsus2
  '2|sus4': [[-1, -1, 0, 2, 3, 3]],          // Dsus4
  '4|sus2': [[0, 2, 4, 4, 0, 0]],            // Esus2
  '4|sus4': [[0, 2, 2, 2, 0, 0]],            // Esus4
  '7|sus2': [[3, 0, 0, 0, 3, 3]],            // Gsus2
  '7|sus4': [[3, 3, 0, 0, 1, 3]],            // Gsus4
  '0|add9': [[-1, 3, 2, 0, 3, 0]],           // Cadd9
  '9|5':   [[-1, 0, 2, 2, -1, -1]],          // A5
  '4|5':   [[0, 2, 2, -1, -1, -1]],          // E5
  '7|5':   [[3, 5, 5, -1, -1, -1]],          // G5
  '2|5':   [[-1, -1, 0, 2, -1, -1]],         // D5
  // diminished / augmented triads
  '9|dim':  [[-1, 0, 1, 2, 1, -1]],          // Adim
  '4|dim':  [[0, 1, 2, 0, -1, -1]],          // Edim
  '2|dim':  [[-1, -1, 0, 1, 3, 1]],          // Ddim
  '4|aug':  [[0, 3, 2, 1, 1, 0]],            // Eaug
  '9|aug':  [[-1, 0, 3, 2, 2, 1]],           // Aaug
  // sixths
  '7|6':   [[3, 2, 0, 0, 0, 0]],             // G6
  '0|6':   [[-1, 3, 2, 2, 1, 0]],            // C6
  '2|6':   [[-1, -1, 0, 2, 0, 2]],           // D6
  '9|6':   [[-1, 0, 2, 2, 2, 2]],            // A6
  '4|6':   [[0, 2, 2, 1, 2, 0]],             // E6
  '4|m6':  [[0, 2, 2, 0, 2, 0]],             // Em6
  '2|m6':  [[-1, -1, 0, 2, 0, 1]],           // Dm6
  '9|m6':  [[-1, 0, 2, 2, 1, 2]],            // Am6
  // extensions
  '4|9':   [[0, 2, 0, 1, 0, 2]],             // E9
  '9|9':   [[-1, 0, 2, 4, 2, 3]],            // A9
  '4|maj9': [[0, 2, 1, 1, 0, 2]],            // Emaj9
  '9|maj9': [[-1, 0, 2, 4, 2, 4]],           // Amaj9
  '4|m9':  [[0, 2, 0, 0, 0, 2]],             // Em9
  '9|m9':  [[-1, 0, 2, 4, 1, 3]],            // Am9
  '9|add9': [[-1, 0, 2, 4, 2, 0]],           // Aadd9
  '4|add9': [[0, 2, 2, 1, 0, 2]],            // Eadd9
  '9|11':  [[-1, 0, 0, 0, 0, 0]],            // A11
  '4|13':  [[0, 2, 0, 1, 2, 2]],             // E13
};

// Movable templates: [baseString, offsets] per quality, canonical first —
// full shapes before 3-note shells. baseString 0/1/2 = low E / A / D;
// the root sits on that string at `rootFret` and every offset slides with
// it (e.g. the A-string C9 grip x-3-2-3-3-x is [1, [null,0,-1,0,0,null]]).
const MOVABLE = {
  '':     [[0, [0, 2, 2, 1, 0, 0]],           // E-shape barre
           [1, [null, 0, 2, 2, 2, 0]],        // A-shape barre
           [2, [null, null, 0, 2, 3, 2]]],    // D-shape (G = x-x-5-7-8-7)
  'm':    [[0, [0, 2, 2, 0, 0, 0]],
           [1, [null, 0, 2, 2, 1, 0]],
           [2, [null, null, 0, 2, 3, 1]]],    // Dm-shape
  '5':    [[0, [0, 2, 2, null, null, null]],
           [1, [null, 0, 2, 2, null, null]],
           [2, [null, null, 0, 2, null, null]]],
  'dim':  [[1, [null, 0, 1, 2, 1, null]],
           [2, [null, null, 0, 1, 3, 1]],
           [0, [0, 1, 2, 0, null, null]]],
  'aug':  [[1, [null, 0, 3, 2, 2, 1]]],
  'sus2': [[1, [null, 0, 2, 2, 0, 0]],
           [2, [null, null, 0, 2, 3, 0]]],
  'sus4': [[0, [0, 2, 2, 2, 0, 0]],
           [1, [null, 0, 2, 2, 3, 0]],
           [2, [null, null, 0, 2, 3, 3]]],    // Dsus4-shape
  '6':    [[1, [null, 0, 2, 2, 2, 2]],        // canonical 6-barre
           [0, [0, null, -1, 1, 0, null]]],   // swing grip (G6 = 3-x-2-4-3-x)
  'm6':   [[1, [null, 0, 2, 2, 1, 2]],        // canonical m6 barre
           [0, [0, 2, 2, 0, 2, 0]]],
  '7':    [[0, [0, 2, 0, 1, 0, 0]],
           [1, [null, 0, 2, 0, 2, 0]],
           [0, [0, null, 0, 1, 0, null]],     // jazz grip (3-x-3-4-3-x)
           [2, [null, null, 0, 2, 1, 2]],     // D7-shape
           [1, [null, 0, -1, 0, null, null]]],// R+3+b7 shell (x-3-2-3-x-x)
  'maj7': [[0, [0, 2, 1, 1, 0, 0]],
           [1, [null, 0, 2, 1, 2, 0]],
           [0, [0, null, 1, 1, 0, null]],     // jazz grip (3-x-4-4-3-x)
           [2, [null, null, 0, 2, 2, 2]],
           [0, [0, null, 1, 1, null, null]],  // R+3+7 shell
           [1, [null, 0, -1, 1, null, null]]],// R+3+7 shell (x-3-2-4-x-x)
  'm7':   [[0, [0, 2, 0, 0, 0, 0]],
           [1, [null, 0, 2, 0, 1, 0]],
           [0, [0, null, 0, 0, 0, null]],     // mini-barre (3-x-3-3-3-x)
           [2, [null, null, 0, 2, 1, 1]],
           [0, [0, null, 0, 0, null, null]],  // R+b3+b7 shell
           [1, [null, 0, -2, 0, null, null]]],// R+b3+b7 shell
  'm7b5': [[1, [null, 0, 1, 0, 1, null]],     // Bm7b5 = x2323x
           [0, [0, null, 0, 0, -1, null]]],   // 3-x-3-3-2-x
  'dim7': [[2, [null, null, 0, 1, 0, 1]],     // sliding dim7
           [1, [null, 0, 1, -1, 1, null]]],
  '7sus4': [[1, [null, 0, 2, 0, 3, 0]],
            [0, [0, 2, 0, 2, 0, 0]]],
  'add9': [[0, [0, 2, 2, 1, 0, 2]]],
  '9':    [[1, [null, 0, -1, 0, 0, null]],    // canonical (C9 = x-3-2-3-3-x)
           [0, [0, null, 0, 1, 0, 2]]],
  'm9':   [[1, [null, 0, -2, 0, 0, null]],    // canonical (Cm9 = x-3-1-3-3-x)
           [0, [0, 2, 0, 0, 0, 2]]],
  'maj9': [[1, [null, 0, -1, 1, 0, null]],    // canonical (Cmaj9 = x-3-2-4-3-x)
           [0, [0, null, 1, 1, 0, 2]]],
  '11':   [[1, [null, 0, 0, 0, 0, 0]],        // one-finger barre x-n-n-n-n-n
           [0, [0, null, 0, -1, -2, -2]]],
  '13':   [[1, [null, 0, -1, 0, 0, 2]],       // (C13 = x-3-2-3-3-5)
           [0, [0, null, 0, 1, 2, 2]]],
};

export const CURATED = build();

function build() {
  const map = {};
  for (const [key, shapes] of Object.entries(OPEN)) {
    // OPEN keys are written "root|quality" — normalize to the full
    // "root|quality|bass" form (empty bass) the lookups use
    map[key + '|'] = shapes.map(frets => ({ frets }));
  }
  // slide every movable template to all 12 roots
  for (let root = 0; root < 12; root++) {
    for (const [q, shapes] of Object.entries(MOVABLE)) {
      const key = `${root}|${q}|`;
      map[key] = map[key] || [];
      for (const [baseString, offsets] of shapes) {
        const rootFret = ((root - midiToPc(STRINGS[baseString])) % 12 + 12) % 12;
        if (rootFret === 0 || rootFret > 12) continue;   // 0 = open shape, >12 too high
        // negative offsets can push a note off the neck for low rootFrets,
        // and frets >15 (MAX_FRET in voicings.js) are unreachable — those
        // roots just don't get this template
        if (offsets.some(d => d !== null && (rootFret + d < 0 || rootFret + d > 15))) {
          continue;
        }
        map[key].push({ frets: offsets.map(d => (d === null ? -1 : rootFret + d)) });
      }
    }
  }
  return map;
}

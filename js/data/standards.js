// Full-song chord progressions for jazz standards (Real Book repertoire).
// Same shape as progressions.js: each entry resolves against `key`
// (canonical tonic pc; for minor tunes the MINOR tonic pc, flagged
// `minor: true`). One entry per chord slot in play order; a bar with two
// chords is two consecutive entries each marked `half: true`.
// Comments show the actual chord symbols for the canonical key.

export const STANDARDS = [
  {
    // AABC, 32 bars — ii–V–I–IV in Bb, ii–V–i in Gm; bridge reverses it.
    id: 'autumn-leaves', label: 'Autumn Leaves', key: 7, minor: true,
    bars: [
      // A: | Cm7 | F7 | Bbmaj7 | Ebmaj7 | Am7b5 | D7 | Gm7 | Gm7 |
      { off: 5, q: 'm7' }, { off: 10, q: '7' }, { off: 3, q: 'maj7' }, { off: 8, q: 'maj7' },
      { off: 2, q: 'm7b5' }, { off: 7, q: '7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      // A: same again
      { off: 5, q: 'm7' }, { off: 10, q: '7' }, { off: 3, q: 'maj7' }, { off: 8, q: 'maj7' },
      { off: 2, q: 'm7b5' }, { off: 7, q: '7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      // B: | Am7b5 | D7 | Gm7 | Gm7 | Cm7 | F7 | Bbmaj7 | Bbmaj7 |
      { off: 2, q: 'm7b5' }, { off: 7, q: '7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 5, q: 'm7' }, { off: 10, q: '7' }, { off: 3, q: 'maj7' }, { off: 3, q: 'maj7' },
      // C: | Am7b5 | D7 | Gm7 Gb7 | Fm7 E7 | Ebmaj7 | D7 | Gm7 | Gm7 |
      { off: 2, q: 'm7b5' }, { off: 7, q: '7' },
      { off: 0, q: 'm7', half: true }, { off: 11, q: '7', half: true },
      { off: 10, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 8, q: 'maj7' }, { off: 7, q: '7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
    ],
  },
  {
    // 16 bars — Cm vamp, ii–V–i, then ii–V–I to Db and back.
    id: 'blue-bossa', label: 'Blue Bossa', key: 0, minor: true,
    bars: [
      // | Cm7 | Cm7 | Fm7 | Fm7 |
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 5, q: 'm7' }, { off: 5, q: 'm7' },
      // | Dm7b5 | G7 | Cm7 | Cm7 |
      { off: 2, q: 'm7b5' }, { off: 7, q: '7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      // | Ebm7 | Ab7 | Dbmaj7 | Dbmaj7 |
      { off: 3, q: 'm7' }, { off: 8, q: '7' }, { off: 1, q: 'maj7' }, { off: 1, q: 'maj7' },
      // | Dm7b5 | G7 | Cm7 | Dm7b5 G7 |
      { off: 2, q: 'm7b5' }, { off: 7, q: '7' }, { off: 0, q: 'm7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
    ],
  },
  {
    // AABA' + tag, 36 bars — modulates Ab → C → Eb → G, bridge through
    // G and E major, last A has the famous Dbmaj7 → Dbm7 (iv minor) move.
    id: 'all-the-things-you-are', label: 'All the Things You Are', key: 8,
    bars: [
      // A: | Fm7 | Bbm7 | Eb7 | Abmaj7 | Dbmaj7 | G7 | Cmaj7 | Cmaj7 |
      { off: 9, q: 'm7' }, { off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' },
      { off: 5, q: 'maj7' }, { off: 11, q: '7' }, { off: 4, q: 'maj7' }, { off: 4, q: 'maj7' },
      // A: | Cm7 | Fm7 | Bb7 | Ebmaj7 | Abmaj7 | D7 | Gmaj7 | Gmaj7 |
      { off: 4, q: 'm7' }, { off: 9, q: 'm7' }, { off: 2, q: '7' }, { off: 7, q: 'maj7' },
      { off: 0, q: 'maj7' }, { off: 6, q: '7' }, { off: 11, q: 'maj7' }, { off: 11, q: 'maj7' },
      // B: | Am7 | D7 | Gmaj7 | Gmaj7 | F#m7b5 | B7 | Emaj7 | C7 |
      { off: 1, q: 'm7' }, { off: 6, q: '7' }, { off: 11, q: 'maj7' }, { off: 11, q: 'maj7' },
      { off: 10, q: 'm7b5' }, { off: 3, q: '7' }, { off: 8, q: 'maj7' }, { off: 4, q: '7' },
      // A': | Fm7 | Bbm7 | Eb7 | Abmaj7 | Dbmaj7 | Dbm7 | Cm7 | Bdim7 |
      //      | Bbm7 | Eb7 | Abmaj7 | Abmaj7 |
      { off: 9, q: 'm7' }, { off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' },
      { off: 5, q: 'maj7' }, { off: 5, q: 'm7' }, { off: 4, q: 'm7' }, { off: 3, q: 'dim7' },
      { off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
    ],
  },
  {
    // AABA, 32 bars — ii–V chains, two chords most bars; the Abm7–Db7
    // tritone-sub bar is the signature move.
    id: 'satin-doll', label: 'Satin Doll', key: 0,
    bars: [
      // A: | Dm7 G7 | Dm7 G7 | Em7 A7 | Em7 A7 | Am7 D7 | Abm7 Db7 | Cmaj7 | Dm7 G7 |
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 9, q: 'm7', half: true }, { off: 2, q: '7', half: true },
      { off: 8, q: 'm7', half: true }, { off: 1, q: '7', half: true },
      { off: 0, q: 'maj7' },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      // A: same again
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 9, q: 'm7', half: true }, { off: 2, q: '7', half: true },
      { off: 8, q: 'm7', half: true }, { off: 1, q: '7', half: true },
      { off: 0, q: 'maj7' },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      // B: | Gm7 C7 | Gm7 C7 | Fmaj7 | Fmaj7 | Am7 D7 | Am7 D7 | Gmaj7 | Dm7 G7 |
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' },
      { off: 9, q: 'm7', half: true }, { off: 2, q: '7', half: true },
      { off: 9, q: 'm7', half: true }, { off: 2, q: '7', half: true },
      { off: 7, q: 'maj7' },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      // A: final
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 9, q: 'm7', half: true }, { off: 2, q: '7', half: true },
      { off: 8, q: 'm7', half: true }, { off: 1, q: '7', half: true },
      { off: 0, q: 'maj7' },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
    ],
  },
  {
    // AABA, 32 bars — the D7 (II7) in bars 3–4 and the Fmaj7 bridge.
    id: 'take-the-a-train', label: 'Take the A Train', key: 0,
    bars: [
      // A: | Cmaj7 | Cmaj7 | D7 | D7 | Dm7 | G7 | Cmaj7 | Cmaj7 |
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' }, { off: 2, q: '7' }, { off: 2, q: '7' },
      { off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
      // A: same again
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' }, { off: 2, q: '7' }, { off: 2, q: '7' },
      { off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
      // B: | Fmaj7 | Fmaj7 | Fmaj7 | Fmaj7 | D7 | D7 | Dm7 | G7 |
      { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' },
      { off: 2, q: '7' }, { off: 2, q: '7' }, { off: 2, q: 'm7' }, { off: 7, q: '7' },
      // A: final
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' }, { off: 2, q: '7' }, { off: 2, q: '7' },
      { off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
    ],
  },
  {
    // 12-bar blues in Bb — quick IV in bar 2, E°7 in bar 6, ii–V in 9–10.
    id: 'blue-monk', label: 'Blue Monk', key: 10,
    bars: [
      // | Bb7 | Eb7 | Bb7 | Bb7 | Eb7 | Edim7 | Bb7 | Bb7 | Cm7 | F7 | Bb7 | Bb7 |
      { off: 0, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 5, q: '7' }, { off: 6, q: 'dim7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
    ],
  },
  {
    // 12-bar blues in Bb — quick IV in bar 2, ii–V in bars 9–10.
    id: 'tenor-madness', label: 'Tenor Madness', key: 10,
    bars: [
      // | Bb7 | Eb7 | Bb7 | Bb7 | Eb7 | Eb7 | Bb7 | Bb7 | Cm7 | F7 | Bb7 | Bb7 |
      { off: 0, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 5, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
    ],
  },
  {
    // 16-bar modal vamp: Fm7 ×4 | Db7 ×4 | Dm7 ×4 | Fm7 ×4.
    id: 'cantaloupe-island', label: 'Cantaloupe Island', key: 5, minor: true,
    bars: [
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 8, q: '7' }, { off: 8, q: '7' }, { off: 8, q: '7' }, { off: 8, q: '7' },
      { off: 9, q: 'm7' }, { off: 9, q: 'm7' }, { off: 9, q: 'm7' }, { off: 9, q: 'm7' },
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
    ],
  },
  {
    // 16 bars — minor-blues-flavoured: iiø–V, iv, bVI7, brief trip to Cmaj7.
    id: 'summertime', label: 'Summertime', key: 9, minor: true,
    bars: [
      // | Am7 | Bm7b5 E7 | Am7 | Am7 A7 |
      { off: 0, q: 'm7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm7' },
      { off: 0, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      // | Dm7 | F7 | Bm7b5 | E7 |
      { off: 5, q: 'm7' }, { off: 8, q: '7' }, { off: 2, q: 'm7b5' }, { off: 7, q: '7' },
      // | Am7 | Bm7b5 E7 | Am7 | G7 |
      { off: 0, q: 'm7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm7' }, { off: 10, q: '7' },
      // | Cmaj7 | Bm7b5 E7 | Am7 | Bm7b5 E7 |
      { off: 3, q: 'maj7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
    ],
  },
  {
    // 32 bars — the cycle-of-fourths workout; "in other words" section
    // turns through Em7–A7 back to Cmaj7.
    id: 'fly-me-to-the-moon', label: 'Fly Me to the Moon', key: 9, minor: true,
    bars: [
      // A: | Am7 | Dm7 | G7 | Cmaj7 | Fmaj7 | Bm7b5 | E7 | Am7 |
      { off: 0, q: 'm7' }, { off: 5, q: 'm7' }, { off: 10, q: '7' }, { off: 3, q: 'maj7' },
      { off: 8, q: 'maj7' }, { off: 2, q: 'm7b5' }, { off: 7, q: '7' }, { off: 0, q: 'm7' },
      // A: same, last bar | Am7 A7 |
      { off: 0, q: 'm7' }, { off: 5, q: 'm7' }, { off: 10, q: '7' }, { off: 3, q: 'maj7' },
      { off: 8, q: 'maj7' }, { off: 2, q: 'm7b5' }, { off: 7, q: '7' },
      { off: 0, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      // B: | Dm7 | G7 | Em7 | A7 | Dm7 | G7 | Cmaj7 | Bm7b5 E7 |
      { off: 5, q: 'm7' }, { off: 10, q: '7' }, { off: 7, q: 'm7' }, { off: 0, q: '7' },
      { off: 5, q: 'm7' }, { off: 10, q: '7' }, { off: 3, q: 'maj7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      // A: final
      { off: 0, q: 'm7' }, { off: 5, q: 'm7' }, { off: 10, q: '7' }, { off: 3, q: 'maj7' },
      { off: 8, q: 'maj7' }, { off: 2, q: 'm7b5' }, { off: 7, q: '7' }, { off: 0, q: 'm7' },
    ],
  },
  {
    // AABA 32 bars — pure modal: Dm7 ×16, Ebm7 ×8, Dm7 ×8.
    id: 'so-what', label: 'So What', key: 2, minor: true,
    bars: [
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 1, q: 'm7' }, { off: 1, q: 'm7' }, { off: 1, q: 'm7' }, { off: 1, q: 'm7' },
      { off: 1, q: 'm7' }, { off: 1, q: 'm7' }, { off: 1, q: 'm7' }, { off: 1, q: 'm7' },
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
    ],
  },
  {
    // 12-bar minor blues in Cm — bVI7 (Ab7) to V7 (G7) in bars 9–10.
    id: 'mr-pc', label: 'Mr. PC', key: 0, minor: true,
    bars: [
      // | Cm7 | Cm7 | Cm7 | Cm7 | Fm7 | Fm7 | Cm7 | Cm7 | Ab7 | G7 | Cm7 | Cm7 |
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 5, q: 'm7' }, { off: 5, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 8, q: '7' }, { off: 7, q: '7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
    ],
  },
];

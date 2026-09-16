// Full-song chord progressions — jazz standards (Real Book repertoire)
// plus pop/rock/blues/latin/folk songs. Same shape as progressions.js:
// each entry resolves against `key` (canonical tonic pc; for minor tunes
// the MINOR tonic pc, flagged `minor: true`). One entry per chord slot in
// play order; a bar with two chords is two consecutive entries each marked
// `half: true`. Comments show the actual chord symbols for the canonical
// key. `genre` keys into GENRES below — the screens group the song/prog
// dropdowns by it, in GENRES key order.

export const GENRES = {
  jazz:  { ko: '재즈',      en: 'Jazz' },
  pop:   { ko: '팝',        en: 'Pop' },
  rock:  { ko: '록',        en: 'Rock' },
  blues: { ko: '블루스',    en: 'Blues' },
  latin: { ko: '라틴/보사', en: 'Latin/Bossa' },
  folk:  { ko: '포크',      en: 'Folk' },
};

export const STANDARDS = [
  {
    // AABC, 32 bars — ii–V–I–IV in Bb, ii–V–i in Gm; bridge reverses it.
    id: 'autumn-leaves', label: 'Autumn Leaves', genre: 'jazz', key: 7, minor: true,
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
    id: 'blue-bossa', label: 'Blue Bossa', genre: 'latin', key: 0, minor: true,
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
    id: 'all-the-things-you-are', label: 'All the Things You Are', genre: 'jazz', key: 8,
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
    id: 'satin-doll', label: 'Satin Doll', genre: 'jazz', key: 0,
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
    id: 'take-the-a-train', label: 'Take the A Train', genre: 'jazz', key: 0,
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
    id: 'blue-monk', label: 'Blue Monk', genre: 'jazz', key: 10,
    bars: [
      // | Bb7 | Eb7 | Bb7 | Bb7 | Eb7 | Edim7 | Bb7 | Bb7 | Cm7 | F7 | Bb7 | Bb7 |
      { off: 0, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 5, q: '7' }, { off: 6, q: 'dim7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
    ],
  },
  {
    // 12-bar blues in Bb — quick IV in bar 2, ii–V in bars 9–10.
    id: 'tenor-madness', label: 'Tenor Madness', genre: 'jazz', key: 10,
    bars: [
      // | Bb7 | Eb7 | Bb7 | Bb7 | Eb7 | Eb7 | Bb7 | Bb7 | Cm7 | F7 | Bb7 | Bb7 |
      { off: 0, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 5, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
    ],
  },
  {
    // 16-bar modal vamp: Fm7 ×4 | Db7 ×4 | Dm7 ×4 | Fm7 ×4.
    id: 'cantaloupe-island', label: 'Cantaloupe Island', genre: 'jazz', key: 5, minor: true,
    bars: [
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 8, q: '7' }, { off: 8, q: '7' }, { off: 8, q: '7' }, { off: 8, q: '7' },
      { off: 9, q: 'm7' }, { off: 9, q: 'm7' }, { off: 9, q: 'm7' }, { off: 9, q: 'm7' },
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
    ],
  },
  {
    // 16 bars — minor-blues-flavoured: iiø–V, iv, bVI7, brief trip to Cmaj7.
    id: 'summertime', label: 'Summertime', genre: 'jazz', key: 9, minor: true,
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
    id: 'fly-me-to-the-moon', label: 'Fly Me to the Moon', genre: 'jazz', key: 9, minor: true,
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
    id: 'so-what', label: 'So What', genre: 'jazz', key: 2, minor: true,
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
    id: 'mr-pc', label: 'Mr. PC', genre: 'jazz', key: 0, minor: true,
    bars: [
      // | Cm7 | Cm7 | Cm7 | Cm7 | Fm7 | Fm7 | Cm7 | Cm7 | Ab7 | G7 | Cm7 | Cm7 |
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 5, q: 'm7' }, { off: 5, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 8, q: '7' }, { off: 7, q: '7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
    ],
  },

  // ---------- more jazz (Real Book changes, extensions flattened) ----------

  {
    // ABAC, 32 bars — mostly one chord per bar; the C section's F→Fm move
    // and the C6→Ebdim7→Dm7–G7 ending are the signature. Extensions
    // flattened (E7b9→E7, D7b9→D7; F#dim7→Fm6 per the RB alternate chord).
    id: 'all-of-me', label: 'All of Me', genre: 'jazz', key: 0,
    bars: [
      // A: | Cmaj7 | % | E7 | % | A7 | % | Dm7 | % |
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' }, { off: 4, q: '7' }, { off: 4, q: '7' },
      { off: 9, q: '7' }, { off: 9, q: '7' }, { off: 2, q: 'm7' }, { off: 2, q: 'm7' },
      // B: | E7 | % | Am7 | % | D7 | % | Dm7 | G7 |
      { off: 4, q: '7' }, { off: 4, q: '7' }, { off: 9, q: 'm7' }, { off: 9, q: 'm7' },
      { off: 2, q: '7' }, { off: 2, q: '7' }, { off: 2, q: 'm7' }, { off: 7, q: '7' },
      // A: same as the first A
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' }, { off: 4, q: '7' }, { off: 4, q: '7' },
      { off: 9, q: '7' }, { off: 9, q: '7' }, { off: 2, q: 'm7' }, { off: 2, q: 'm7' },
      // C: | Fmaj7 | Fm6 | Em7 | A7 | Dm7 | G7 | C6 Ebdim7 | Dm7 G7 |
      { off: 5, q: 'maj7' }, { off: 5, q: 'm6' }, { off: 4, q: 'm7' }, { off: 9, q: '7' },
      { off: 2, q: 'm7' }, { off: 7, q: '7' },
      { off: 0, q: '6', half: true }, { off: 3, q: 'dim7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
    ],
  },
  {
    // AABA, 32 bars — ii–V chains plus the backdoor Abm7–Db7. Written with
    // the endings flattened: A1 takes the Gm7–C7 / Fm7–Bb7 turnaround,
    // A2/A3 take the 2nd ending (two plain Ebmaj7 bars).
    id: 'misty', label: 'Misty', genre: 'jazz', key: 3,
    bars: [
      // A: | Ebmaj7 | Bbm7 Eb7 | Abmaj7 | Abm7 Db7 | Ebmaj7 Cm7 | Fm7 Bb7 | Gm7 C7 | Fm7 Bb7 |
      { off: 0, q: 'maj7' },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'maj7' },
      { off: 5, q: 'm7', half: true }, { off: 10, q: '7', half: true },
      { off: 0, q: 'maj7', half: true }, { off: 9, q: 'm7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      // A: same six bars, then the 2nd ending | Ebmaj7 | % |
      { off: 0, q: 'maj7' },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'maj7' },
      { off: 5, q: 'm7', half: true }, { off: 10, q: '7', half: true },
      { off: 0, q: 'maj7', half: true }, { off: 9, q: 'm7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
      // B: | Bbm7 | Eb7 | Abmaj7 | % | Am7 | D7 F7 | Gm7 C7 | Fm7 Bb7 |
      { off: 7, q: 'm7' }, { off: 0, q: '7' }, { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' },
      { off: 6, q: 'm7' },
      { off: 11, q: '7', half: true }, { off: 2, q: '7', half: true },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      // A: final (2nd-ending shape)
      { off: 0, q: 'maj7' },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'maj7' },
      { off: 5, q: 'm7', half: true }, { off: 10, q: '7', half: true },
      { off: 0, q: 'maj7', half: true }, { off: 9, q: 'm7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
    ],
  },
  {
    // 12 bars — cycles Cm → F → Eb → Db and home. Cm(maj7)→Cm7 and
    // G7b9→G7 are the only simplifications.
    id: 'solar', label: 'Solar', genre: 'jazz', key: 0, minor: true,
    bars: [
      // | Cm7 | % | Gm7 | C7 | Fmaj7 | % | Fm7 | Bb7 |
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 7, q: 'm7' }, { off: 0, q: '7' },
      { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' }, { off: 5, q: 'm7' }, { off: 10, q: '7' },
      // | Ebmaj7 | Ebm7 Ab7 | Dbmaj7 | Dm7b5 G7 |
      { off: 3, q: 'maj7' },
      { off: 3, q: 'm7', half: true }, { off: 8, q: '7', half: true },
      { off: 1, q: 'maj7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
    ],
  },
  {
    // ABC, 32 bars — a chain of unresolved ii–Vs. Altered extensions
    // flattened (A7b9→A7, G7b13→G7, Ebmaj7#11→Ebmaj7, D7b9→D7).
    id: 'stella-by-starlight', label: 'Stella by Starlight', genre: 'jazz', key: 10,
    bars: [
      // A: | Em7b5 | A7 | Cm7 | F7 | Fm7 | Bb7 | Ebmaj7 | Ab7 |
      { off: 6, q: 'm7b5' }, { off: 11, q: '7' }, { off: 2, q: 'm7' }, { off: 7, q: '7' },
      { off: 7, q: 'm7' }, { off: 0, q: '7' }, { off: 5, q: 'maj7' }, { off: 10, q: '7' },
      //   | Bbmaj7 | Em7b5 A7 | Dm7 | Bbm7 Eb7 | Fmaj7 | Em7b5 A7 | Ebmaj7 | D7 |
      { off: 0, q: 'maj7' },
      { off: 6, q: 'm7b5', half: true }, { off: 11, q: '7', half: true },
      { off: 4, q: 'm7' },
      { off: 0, q: 'm7', half: true }, { off: 5, q: '7', half: true },
      { off: 7, q: 'maj7' },
      { off: 6, q: 'm7b5', half: true }, { off: 11, q: '7', half: true },
      { off: 5, q: 'maj7' }, { off: 4, q: '7' },
      // B: | G7 | % | Cm7 | % | Ab7 | % | Bbmaj7 | % |
      { off: 9, q: '7' }, { off: 9, q: '7' }, { off: 2, q: 'm7' }, { off: 2, q: 'm7' },
      { off: 10, q: '7' }, { off: 10, q: '7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
      // C: | Em7b5 | A7 | Dm7b5 | G7 | Cm7b5 | F7 | Bbmaj7 | % |
      { off: 6, q: 'm7b5' }, { off: 11, q: '7' }, { off: 4, q: 'm7b5' }, { off: 9, q: '7' },
      { off: 2, q: 'm7b5' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
    ],
  },
  {
    // ABAC, 32 bars — the Abmaj7→Db7 move into the IV area and four quick
    // ii–V cells in the last 8. Extensions flattened (G7b9→G7, Db7#11→Db7).
    id: 'there-will-never-be-another-you', label: 'There Will Never Be Another You',
    genre: 'jazz', key: 3,
    bars: [
      // A: | Ebmaj7 | % | Dm7b5 | G7 | Cm7 | % | Bbm7 | Eb7 |
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' }, { off: 11, q: 'm7b5' }, { off: 4, q: '7' },
      { off: 9, q: 'm7' }, { off: 9, q: 'm7' }, { off: 7, q: 'm7' }, { off: 0, q: '7' },
      // B: | Abmaj7 | Db7 | Ebmaj7 | Cm7 | F7 | % | Fm7 | Bb7 |
      { off: 5, q: 'maj7' }, { off: 10, q: '7' }, { off: 0, q: 'maj7' }, { off: 9, q: 'm7' },
      { off: 2, q: '7' }, { off: 2, q: '7' }, { off: 2, q: 'm7' }, { off: 7, q: '7' },
      // A: repeat
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' }, { off: 11, q: 'm7b5' }, { off: 4, q: '7' },
      { off: 9, q: 'm7' }, { off: 9, q: 'm7' }, { off: 7, q: 'm7' }, { off: 0, q: '7' },
      // C: | Abmaj7 | Db7 | Ebmaj7 | Am7b5 D7 | Ebmaj7 Ab7 | Gm7 C7 | Fm7 Bb7 | Eb6 Bb7 |
      { off: 5, q: 'maj7' }, { off: 10, q: '7' }, { off: 0, q: 'maj7' },
      { off: 6, q: 'm7b5', half: true }, { off: 11, q: '7', half: true },
      { off: 0, q: 'maj7', half: true }, { off: 5, q: '7', half: true },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: '6', half: true }, { off: 7, q: '7', half: true },
    ],
  },
  {
    // 10-bar form — often called "in Bb" but the Real Book keys it Dm and
    // it resolves to Dm. Altered dominants flattened (A7#9→A7, E7b13→E7).
    id: 'blue-in-green', label: 'Blue in Green', genre: 'jazz', key: 2, minor: true,
    bars: [
      // | Gm6 | A7 | Dm7 Db7 | Cm7 F7 | Bbmaj7 | A7 | Dm6 | E7 | Am7 | Dm7 |
      { off: 5, q: 'm6' }, { off: 7, q: '7' },
      { off: 0, q: 'm7', half: true }, { off: 11, q: '7', half: true },
      { off: 10, q: 'm7', half: true }, { off: 3, q: '7', half: true },
      { off: 8, q: 'maj7' }, { off: 7, q: '7' }, { off: 0, q: 'm6' }, { off: 2, q: '7' },
      { off: 7, q: 'm7' }, { off: 0, q: 'm7' },
    ],
  },
  {
    // 32 bars, four 8-bar sections — the bVII7 (Ab7) in bar 3 and the
    // Am7b5–D7 → Gm6 bridge are the markers. D7b9→D7.
    id: 'there-is-no-greater-love', label: 'There Is No Greater Love',
    genre: 'jazz', key: 10,
    bars: [
      // A: | Bbmaj7 | Eb7 | Ab7 | G7 | C7 | % | Cm7 | F7 |
      { off: 0, q: 'maj7' }, { off: 5, q: '7' }, { off: 10, q: '7' }, { off: 9, q: '7' },
      { off: 2, q: '7' }, { off: 2, q: '7' }, { off: 2, q: 'm7' }, { off: 7, q: '7' },
      // A': | Bbmaj7 | Eb7 | Ab7 | G7 | C7 | Cm7 F7 | Bb6 | % |
      { off: 0, q: 'maj7' }, { off: 5, q: '7' }, { off: 10, q: '7' }, { off: 9, q: '7' },
      { off: 2, q: '7' },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: '6' }, { off: 0, q: '6' },
      // B: | Am7b5 D7 | Gm6 | Am7b5 D7 | Gm6 | Am7b5 D7 | Gm7 | C7 | F7 |
      { off: 11, q: 'm7b5', half: true }, { off: 4, q: '7', half: true },
      { off: 9, q: 'm6' },
      { off: 11, q: 'm7b5', half: true }, { off: 4, q: '7', half: true },
      { off: 9, q: 'm6' },
      { off: 11, q: 'm7b5', half: true }, { off: 4, q: '7', half: true },
      { off: 9, q: 'm7' }, { off: 2, q: '7' }, { off: 7, q: '7' },
      // A'': | Bbmaj7 | Eb7 | Ab7 | G7 | C7 | Cm7 F7 | Bb6 | Cm7 F7 |
      { off: 0, q: 'maj7' }, { off: 5, q: '7' }, { off: 10, q: '7' }, { off: 9, q: '7' },
      { off: 2, q: '7' },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: '6' },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
    ],
  },
  {
    // 12-bar blues in Bb — no ii–V; the tag is plain V–IV–I–V.
    id: 'freddie-freeloader', label: 'Freddie Freeloader', genre: 'jazz', key: 10,
    bars: [
      // | Bb7 | Eb7 | Bb7 | Bb7 | Eb7 | Eb7 | Bb7 | Bb7 | F7 | Eb7 | Bb7 | F7 |
      { off: 0, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 5, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 7, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 7, q: '7' },
    ],
  },

  // ---------- pop ----------

  {
    // Verse + chorus, 16 bars — I–V–vi–IV in C.
    id: 'let-it-be', label: 'Let It Be', genre: 'pop', key: 0,
    bars: [
      // verse: | C | G | Am | F | C | G | F | C |
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 5, q: '' }, { off: 0, q: '' },
      // chorus: | Am | G | F | C | C | G | F | C |
      { off: 9, q: 'm' }, { off: 7, q: '' }, { off: 5, q: '' }, { off: 0, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 5, q: '' }, { off: 0, q: '' },
    ],
  },
  {
    // I–vi–IV–V loop in A, 16 bars — the whole song is the 4-bar
    // progression; four passes shown (verse + chorus).
    id: 'stand-by-me', label: 'Stand By Me', genre: 'pop', key: 9,
    bars: [
      // | A | F#m | D | E | ×4
      { off: 0, q: '' }, { off: 11, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 11, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 11, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 11, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
    ],
  },
  {
    // Verse + "na-na" outro, 16 bars in F. Verse: F–C–C7–F / Bb–F–C–F.
    id: 'hey-jude', label: 'Hey Jude', genre: 'pop', key: 5,
    bars: [
      // verse: | F | C | C7 | F | Bb | F | C | F |
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 7, q: '7' }, { off: 0, q: '' },
      { off: 5, q: '' }, { off: 0, q: '' }, { off: 7, q: '' }, { off: 0, q: '' },
      // outro: | F | Eb | Bb | F | ×2
      { off: 0, q: '' }, { off: 10, q: '' }, { off: 5, q: '' }, { off: 0, q: '' },
      { off: 0, q: '' }, { off: 10, q: '' }, { off: 5, q: '' }, { off: 0, q: '' },
    ],
  },
  {
    // I–V–vi–IV loop in C, 16 bars — G/B simplified to G.
    id: 'no-woman-no-cry', label: 'No Woman, No Cry', genre: 'pop', key: 0,
    bars: [
      // | C | G | Am | F | ×4
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
    ],
  },

  // ---------- rock ----------

  {
    // The 8-bar cycle (i–V–III–VII–IV–VI–ii–V over Bm) played twice.
    // F#7 → 7, A/E/G/D as majors.
    id: 'hotel-california', label: 'Hotel California', genre: 'rock', key: 11, minor: true,
    bars: [
      // | Bm | F#7 | A | E | G | D | Em | F#7 | ×2
      { off: 0, q: 'm' }, { off: 7, q: '7' }, { off: 10, q: '' }, { off: 5, q: '' },
      { off: 8, q: '' }, { off: 3, q: '' }, { off: 5, q: 'm' }, { off: 7, q: '7' },
      { off: 0, q: 'm' }, { off: 7, q: '7' }, { off: 10, q: '' }, { off: 5, q: '' },
      { off: 8, q: '' }, { off: 3, q: '' }, { off: 5, q: 'm' }, { off: 7, q: '7' },
    ],
  },
  {
    // The Animals' 8-bar verse in Am, played twice.
    id: 'house-of-the-rising-sun', label: 'House of the Rising Sun', genre: 'rock',
    key: 9, minor: true,
    bars: [
      // | Am | C | D | F | Am | E | Am | E | ×2
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 5, q: '' }, { off: 8, q: '' },
      { off: 0, q: 'm' }, { off: 7, q: '' }, { off: 0, q: 'm' }, { off: 7, q: '' },
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 5, q: '' }, { off: 8, q: '' },
      { off: 0, q: 'm' }, { off: 7, q: '' }, { off: 0, q: 'm' }, { off: 7, q: '' },
    ],
  },
  {
    // The 8-bar loop in G, played twice (Dylan uses Am; Am7 also common).
    id: 'knockin-on-heavens-door', label: "Knockin' on Heaven's Door", genre: 'rock', key: 7,
    bars: [
      // | G | D | Am | Am | G | D | C | C | ×2
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 2, q: 'm' }, { off: 2, q: 'm' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 5, q: '' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 2, q: 'm' }, { off: 2, q: 'm' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 5, q: '' }, { off: 5, q: '' },
    ],
  },

  // ---------- blues ----------

  {
    // 12-bar in E — quick IV in bar 2, V–IV–I–V tag.
    id: 'sweet-home-chicago', label: 'Sweet Home Chicago', genre: 'blues', key: 4,
    bars: [
      // | E7 | A7 | E7 | E7 | A7 | A7 | E7 | E7 | B7 | A7 | E7 | B7 |
      { off: 0, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 5, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 7, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 7, q: '7' },
    ],
  },
  {
    // 12-bar in A (originally Bb — A is the common guitar key). Four bars
    // of I up top, V–IV–I–V tag.
    id: 'johnny-b-goode', label: 'Johnny B. Goode', genre: 'blues', key: 9,
    bars: [
      // | A7 | A7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7 |
      { off: 0, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 5, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 7, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 7, q: '7' },
    ],
  },

  // ---------- latin / bossa ----------

  {
    // AABA, 40 bars — the bridge is 16 bars through Gb/E/F centres.
    // The second A takes the 2nd ending (two Fmaj7 bars). Extensions
    // flattened (D7b9→D7, C7b9→C7).
    id: 'girl-from-ipanema', label: 'The Girl from Ipanema', genre: 'latin', key: 5,
    bars: [
      // A: | Fmaj7 | % | G7 | % | Gm7 | Gb7 | Fmaj7 | Gb7 |
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' }, { off: 2, q: '7' }, { off: 2, q: '7' },
      { off: 2, q: 'm7' }, { off: 1, q: '7' }, { off: 0, q: 'maj7' }, { off: 1, q: '7' },
      // A: same, 2nd ending | Fmaj7 | % |
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' }, { off: 2, q: '7' }, { off: 2, q: '7' },
      { off: 2, q: 'm7' }, { off: 1, q: '7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
      // B: | Gbmaj7 | % | B7 | % | F#m7 | % | D7 | % |
      { off: 1, q: 'maj7' }, { off: 1, q: 'maj7' }, { off: 6, q: '7' }, { off: 6, q: '7' },
      { off: 1, q: 'm7' }, { off: 1, q: 'm7' }, { off: 9, q: '7' }, { off: 9, q: '7' },
      //   | Gm7 | % | Eb7 | % | Am7 | D7 | Gm7 | C7 |
      { off: 2, q: 'm7' }, { off: 2, q: 'm7' }, { off: 10, q: '7' }, { off: 10, q: '7' },
      { off: 4, q: 'm7' }, { off: 9, q: '7' }, { off: 2, q: 'm7' }, { off: 7, q: '7' },
      // A: final (1st-ending shape)
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' }, { off: 2, q: '7' }, { off: 2, q: '7' },
      { off: 2, q: 'm7' }, { off: 1, q: '7' }, { off: 0, q: 'maj7' }, { off: 1, q: '7' },
    ],
  },
  {
    // AABA, 44 bars (12/12/8/12) — Bbdim7 passing chord, backdoor Bb7 in
    // the A tail, and the B section's slash-bass descent (basses dropped:
    // Gm7/Bb→Gm7, C7/Bb→C7, Fmaj7/A→Fmaj7, Fm7/Ab→Fm7, Bb7/Ab→Bb7,
    // Ebmaj7/G→Ebmaj7). Alterations flattened (D7b9→D7, F#7b13→F#7,
    // B7b9→B7, A7b9→A7).
    id: 'wave', label: 'Wave', genre: 'latin', key: 2,
    bars: [
      // A: | Dmaj7 | Bbdim7 | Am7 | D7 | Gmaj7 | Gm6 | F#13 F#7 | B9 B7 |
      //    | E9 | Bb7 A7 | Dm7 G7 | Dm7 G7 |
      { off: 0, q: 'maj7' }, { off: 8, q: 'dim7' }, { off: 7, q: 'm7' }, { off: 0, q: '7' },
      { off: 5, q: 'maj7' }, { off: 5, q: 'm6' },
      { off: 4, q: '13', half: true }, { off: 4, q: '7', half: true },
      { off: 9, q: '9', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: '9' },
      { off: 8, q: '7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm7', half: true }, { off: 5, q: '7', half: true },
      { off: 0, q: 'm7', half: true }, { off: 5, q: '7', half: true },
      // A: repeat
      { off: 0, q: 'maj7' }, { off: 8, q: 'dim7' }, { off: 7, q: 'm7' }, { off: 0, q: '7' },
      { off: 5, q: 'maj7' }, { off: 5, q: 'm6' },
      { off: 4, q: '13', half: true }, { off: 4, q: '7', half: true },
      { off: 9, q: '9', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: '9' },
      { off: 8, q: '7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm7', half: true }, { off: 5, q: '7', half: true },
      { off: 0, q: 'm7', half: true }, { off: 5, q: '7', half: true },
      // B: | Gm7 | C7 | Fmaj7 | % | Fm7 | Bb7 | Ebmaj7 | A7 |
      { off: 5, q: 'm7' }, { off: 10, q: '7' }, { off: 3, q: 'maj7' }, { off: 3, q: 'maj7' },
      { off: 3, q: 'm7' }, { off: 8, q: '7' }, { off: 1, q: 'maj7' }, { off: 7, q: '7' },
      // A: final
      { off: 0, q: 'maj7' }, { off: 8, q: 'dim7' }, { off: 7, q: 'm7' }, { off: 0, q: '7' },
      { off: 5, q: 'maj7' }, { off: 5, q: 'm6' },
      { off: 4, q: '13', half: true }, { off: 4, q: '7', half: true },
      { off: 9, q: '9', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: '9' },
      { off: 8, q: '7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm7', half: true }, { off: 5, q: '7', half: true },
      { off: 0, q: 'm7', half: true }, { off: 5, q: '7', half: true },
    ],
  },

  // ---------- folk ----------

  {
    // Verse + refrain in C, charted in 4/4 (the original is 12/8 — one
    // chord per bar here, the common guitar-chart approach). The solitary
    // E7 is the "baffled king" chord.
    id: 'hallelujah', label: 'Hallelujah', genre: 'folk', key: 0,
    bars: [
      // verse: | C | Am | C | Am | F | G | C | C |
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 0, q: '' }, { off: 9, q: 'm' },
      { off: 5, q: '' }, { off: 7, q: '' }, { off: 0, q: '' }, { off: 0, q: '' },
      // "it goes like this…": | C | F | G | Am | F | G | E7 | Am |
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' },
      { off: 5, q: '' }, { off: 7, q: '' }, { off: 4, q: '7' }, { off: 9, q: 'm' },
      // refrain: | F | Am | F | C G | C |
      { off: 5, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '', half: true }, { off: 7, q: '', half: true },
      { off: 0, q: '' },
    ],
  },
  {
    // Strophic folk in C — three question pairs then the answer. Folk
    // phrasing floats between recordings; this follows the common
    // one-chord-per-bar chart (32 bars).
    id: 'blowin-in-the-wind', label: "Blowin' in the Wind", genre: 'folk', key: 0,
    bars: [
      // | C | F | G | C | C | F | C | G |  (×2, first two question pairs)
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' }, { off: 0, q: '' },
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' }, { off: 0, q: '' },
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 7, q: '' },
      // | C | F | G | C | C | F | C | C |  (third pair, ends on C)
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' }, { off: 0, q: '' },
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 0, q: '' },
      // "the answer, my friend…": | F | G | C | F | F | G | C | C |
      { off: 5, q: '' }, { off: 7, q: '' }, { off: 0, q: '' }, { off: 5, q: '' },
      { off: 5, q: '' }, { off: 7, q: '' }, { off: 0, q: '' }, { off: 0, q: '' },
    ],
  },
];

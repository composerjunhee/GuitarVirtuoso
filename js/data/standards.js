// Full-song chord progressions — jazz standards (Real Book repertoire)
// plus classical/pop/k-pop/rock/blues/latin/folk songs. Same shape as
// progressions.js:
// each entry resolves against `key` (canonical tonic pc; for minor tunes
// the MINOR tonic pc, flagged `minor: true`). One entry per chord slot in
// play order; a bar with two chords is two consecutive entries each marked
// `half: true`. Comments show the actual chord symbols for the canonical
// key. `genre` keys into GENRES below — the screens group the song/prog
// dropdowns by it, in GENRES key order.

export const GENRES = {
  jazz:      { ko: '재즈',      en: 'Jazz' },
  classical: { ko: '클래식',    en: 'Classical' },
  pop:       { ko: '팝',        en: 'Pop' },
  kpop:      { ko: '가요',      en: 'K-Pop' },
  rock:      { ko: '록',        en: 'Rock' },
  blues:     { ko: '블루스',    en: 'Blues' },
  latin:     { ko: '라틴/보사', en: 'Latin/Bossa' },
  folk:      { ko: '포크',      en: 'Folk' },
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
      // | Am7 | Bm7b5 E7 | Am7 | D7 G7 |
      { off: 0, q: 'm7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm7' },
      { off: 5, q: '7', half: true }, { off: 10, q: '7', half: true },
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
      // B: | Bbm7 | Eb7 | Abmaj7 | % | Am7 | D7 F7 | Gm7b5 C7 | Fm7 Bb7 |
      { off: 7, q: 'm7' }, { off: 0, q: '7' }, { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' },
      { off: 6, q: 'm7' },
      { off: 11, q: '7', half: true }, { off: 2, q: '7', half: true },
      { off: 4, q: 'm7b5', half: true }, { off: 9, q: '7', half: true },
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
    // 12-bar blues in Bb — famously NO quick IV (Bb7 all four bars) and no
    // ii–V; the tag is the signature backdoor bVII7 (Ab7), not V–I.
    id: 'freddie-freeloader', label: 'Freddie Freeloader', genre: 'jazz', key: 10,
    bars: [
      // | Bb7 | Bb7 | Bb7 | Bb7 | Eb7 | Eb7 | Bb7 | Bb7 | F7 | Eb7 | Ab7 | Ab7 |
      { off: 0, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 5, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 7, q: '7' }, { off: 5, q: '7' }, { off: 10, q: '7' }, { off: 10, q: '7' },
    ],
  },

  // ---------- jazz additions (public lead sheets / Real Book charts) ----------

  {
    // AABA' in Ebm — the famous bar 4 holds four chords (Bm7 E7 Bbm7 Eb7,
    // one beat each); here it's spread over two bars of half pairs. Bar 2
    // takes the common Fm7b5–Bb7 (the RB alternate is Cdim7 Abm9 Db7);
    // bar 1's Ebm/D→Ebm/Db bass descent is flattened. Bridge 3-chord bars
    // drop the passing chords (Abm7–Fm7–Bb7 → Abm7 Bb7 / Fm7 Bb7);
    // Cb9 written enharmonically as B9's root (Cb=B). Alterations
    // flattened (B7#11→B7, Bb7sus→Bb7, Db9 kept as '9').
    id: 'round-midnight', label: "'Round Midnight", genre: 'jazz', key: 3, minor: true,
    bars: [
      // A1: | Ebm7 | Fm7b5 Bb7 | Ebm7 Ab7 | Bm7 E7 | Bbm7 Eb7 | Abm7 Db7 | Ebm7 Ab7 | B7 | Bb7 |
      { off: 0, q: 'm7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm7', half: true }, { off: 5, q: '7', half: true },
      { off: 8, q: 'm7', half: true }, { off: 1, q: '7', half: true },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'm7', half: true }, { off: 10, q: '7', half: true },
      { off: 0, q: 'm7', half: true }, { off: 5, q: '7', half: true },
      { off: 8, q: '7' }, { off: 7, q: '7' },
      // A2: same, 2nd ending | B7 Bb7 | Ebm7 |
      { off: 0, q: 'm7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm7', half: true }, { off: 5, q: '7', half: true },
      { off: 8, q: 'm7', half: true }, { off: 1, q: '7', half: true },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'm7', half: true }, { off: 10, q: '7', half: true },
      { off: 0, q: 'm7', half: true }, { off: 5, q: '7', half: true },
      { off: 8, q: '7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm7' },
      // B: | Cm7b5 B7 | Bb7 | Cm7b5 B7 | Bb7 | Abm7 Bb7 | Cm7b5 F7 | Db9 Cb9 | Fm7 Bb7 |
      { off: 9, q: 'm7b5', half: true }, { off: 8, q: '7', half: true },
      { off: 7, q: '7' },
      { off: 9, q: 'm7b5', half: true }, { off: 8, q: '7', half: true },
      { off: 7, q: '7' },
      { off: 5, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 9, q: 'm7b5', half: true }, { off: 2, q: '7', half: true },
      { off: 10, q: '9', half: true }, { off: 8, q: '9', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      // A3 (= A2): | Ebm7 | Fm7b5 Bb7 | Ebm7 Ab7 | Bm7 E7 | Bbm7 Eb7 | Abm7 Db7 | Ebm7 Ab7 | B7 Bb7 | Ebm7 |
      { off: 0, q: 'm7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm7', half: true }, { off: 5, q: '7', half: true },
      { off: 8, q: 'm7', half: true }, { off: 1, q: '7', half: true },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'm7', half: true }, { off: 10, q: '7', half: true },
      { off: 0, q: 'm7', half: true }, { off: 5, q: '7', half: true },
      { off: 8, q: '7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm7' },
    ],
  },
  {
    // AAB, 48 bars — Porter's original changes: the opening maj7 a
    // half-step above V7 (Abmaj7→G7; the RB alt is Dm7b5–G7), the famous
    // F#m7b5→Fm7→Em7→Ebdim7 descent, and the C section's Ebmaj7↔Cmaj7
    // shuttle. A2 ends on the backdoor Bb7 into the B section.
    id: 'night-and-day', label: 'Night and Day', genre: 'jazz', key: 0,
    bars: [
      // A: | Abmaj7 | G7 | Cmaj7 | % | Abmaj7 | G7 | Cmaj7 | % |
      //    | F#m7b5 | Fm7 | Em7 | Ebdim7 | Dm7 | G7 | Cmaj7 | % |
      { off: 8, q: 'maj7' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
      { off: 8, q: 'maj7' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
      { off: 6, q: 'm7b5' }, { off: 5, q: 'm7' }, { off: 4, q: 'm7' }, { off: 3, q: 'dim7' },
      { off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
      // A: same, 2nd ending | Cmaj7 | Bb7 |
      { off: 8, q: 'maj7' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
      { off: 8, q: 'maj7' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
      { off: 6, q: 'm7b5' }, { off: 5, q: 'm7' }, { off: 4, q: 'm7' }, { off: 3, q: 'dim7' },
      { off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' }, { off: 10, q: '7' },
      // B: | Ebmaj7 | % | Cmaj7 | % | Ebmaj7 | % | Cmaj7 | % |
      //    | F#m7b5 | Fm7 | Em7 | Ebdim7 | Dm7 | G7 | C6 | % |
      { off: 3, q: 'maj7' }, { off: 3, q: 'maj7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
      { off: 3, q: 'maj7' }, { off: 3, q: 'maj7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
      { off: 6, q: 'm7b5' }, { off: 5, q: 'm7' }, { off: 4, q: 'm7' }, { off: 3, q: 'dim7' },
      { off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: '6' }, { off: 0, q: '6' },
    ],
  },
  {
    // AABA, 32 bars — the jazz-circle chart: A detours through C major
    // (Dm7–G7–Cmaj7, bars 3–4) and the bridge chains ii–V–Is up in
    // half-steps (D → E → F#) before working back to Db. Older fakebooks
    // harmonise bar 4 with Fm7–E°7 instead — both are standard.
    id: 'body-and-soul', label: 'Body and Soul', genre: 'jazz', key: 1,
    bars: [
      // A1: | Ebm7 Ab7 | Dbmaj7 | Dm7 G7 | Cmaj7 | Cm7 F7 | Bbm7 Eb7 | Ebm7 Ab7 | Dbmaj7 Ab7 |
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7' },
      { off: 1, q: 'm7', half: true }, { off: 6, q: '7', half: true },
      { off: 11, q: 'maj7' },
      { off: 11, q: 'm7', half: true }, { off: 4, q: '7', half: true },
      { off: 9, q: 'm7', half: true }, { off: 2, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7', half: true }, { off: 7, q: '7', half: true },
      // A2: same, ending | Dbmaj7 | % |
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7' },
      { off: 1, q: 'm7', half: true }, { off: 6, q: '7', half: true },
      { off: 11, q: 'maj7' },
      { off: 11, q: 'm7', half: true }, { off: 4, q: '7', half: true },
      { off: 9, q: 'm7', half: true }, { off: 2, q: '7', half: true },
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
      // B: | Dmaj7 | F#m7 B7 | Emaj7 | G#m7 C#7 | F#maj7 | Cm7 F7 | Fm7 Bb7 | Ebm7 Ab7 |
      { off: 1, q: 'maj7' },
      { off: 5, q: 'm7', half: true }, { off: 10, q: '7', half: true },
      { off: 3, q: 'maj7' },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'maj7' },
      { off: 11, q: 'm7', half: true }, { off: 4, q: '7', half: true },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      // A3 = A2
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7' },
      { off: 1, q: 'm7', half: true }, { off: 6, q: '7', half: true },
      { off: 11, q: 'maj7' },
      { off: 11, q: 'm7', half: true }, { off: 4, q: '7', half: true },
      { off: 9, q: 'm7', half: true }, { off: 2, q: '7', half: true },
      { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' },
    ],
  },
  {
    // AABA, 32 bars in F — the double minor line-cliché (Dm then Gm;
    // Dm(maj7)→Dm and Gm(maj7)→Gm, the maj7s aren't in QUALITIES). Bridge
    // is the Db-major shuttle. Fmaj7 for the final F.
    id: 'in-a-sentimental-mood', label: 'In a Sentimental Mood', genre: 'jazz', key: 5,
    bars: [
      // A: | Dm Dm(maj7) | Dm7 Dm6 | Gm Gm(maj7) | Gm7 Gm6 | Dm | Dm D7 | Gm7 C7 | Fmaj7 |
      { off: 9, q: 'm', half: true }, { off: 9, q: 'm', half: true },
      { off: 9, q: 'm7', half: true }, { off: 9, q: 'm6', half: true },
      { off: 2, q: 'm', half: true }, { off: 2, q: 'm', half: true },
      { off: 2, q: 'm7', half: true }, { off: 2, q: 'm6', half: true },
      { off: 9, q: 'm' },
      { off: 9, q: 'm', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7' },
      // A: same again
      { off: 9, q: 'm', half: true }, { off: 9, q: 'm', half: true },
      { off: 9, q: 'm7', half: true }, { off: 9, q: 'm6', half: true },
      { off: 2, q: 'm', half: true }, { off: 2, q: 'm', half: true },
      { off: 2, q: 'm7', half: true }, { off: 2, q: 'm6', half: true },
      { off: 9, q: 'm' },
      { off: 9, q: 'm', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7' },
      // B: | Dbmaj7 Bbm7 | Ebm7 Ab7 | Dbmaj7 Bb7 | Ebm7 Ab7 |
      //    | Dbmaj7 Bbm7 | Ebm7 Ab7 | Gm7 | C7 |
      { off: 8, q: 'maj7', half: true }, { off: 5, q: 'm7', half: true },
      { off: 10, q: 'm7', half: true }, { off: 3, q: '7', half: true },
      { off: 8, q: 'maj7', half: true }, { off: 5, q: '7', half: true },
      { off: 10, q: 'm7', half: true }, { off: 3, q: '7', half: true },
      { off: 8, q: 'maj7', half: true }, { off: 5, q: 'm7', half: true },
      { off: 10, q: 'm7', half: true }, { off: 3, q: '7', half: true },
      { off: 2, q: 'm7' }, { off: 7, q: '7' },
      // A: final
      { off: 9, q: 'm', half: true }, { off: 9, q: 'm', half: true },
      { off: 9, q: 'm7', half: true }, { off: 9, q: 'm6', half: true },
      { off: 2, q: 'm', half: true }, { off: 2, q: 'm', half: true },
      { off: 2, q: 'm7', half: true }, { off: 2, q: 'm6', half: true },
      { off: 9, q: 'm' },
      { off: 9, q: 'm', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7' },
    ],
  },
  {
    // AABA, 32 bars in Cm — the jam-session minor ii–V–i workout. Bridge
    // climbs Ebmaj7 → C7 → Fm7 → F#dim7 and home (the diatonic-chords-
    // with-diminished-passes version; the common ii–V reharm is
    // Ebmaj7 Gm7b5 C7 | Fm7 Am7b5 D7 | G7).
    id: 'softly-as-in-a-morning-sunrise', label: 'Softly, as in a Morning Sunrise',
    genre: 'jazz', key: 0, minor: true,
    bars: [
      // A: | Cm7 | % | Dm7b5 | G7 | Cm7 | % | Dm7b5 | G7 |
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 2, q: 'm7b5' }, { off: 7, q: '7' },
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 2, q: 'm7b5' }, { off: 7, q: '7' },
      // A: repeat
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 2, q: 'm7b5' }, { off: 7, q: '7' },
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 2, q: 'm7b5' }, { off: 7, q: '7' },
      // B: | Ebmaj7 | % | C7 | % | Fm7 | F#dim7 | Dm7b5 | G7 |
      { off: 3, q: 'maj7' }, { off: 3, q: 'maj7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 5, q: 'm7' }, { off: 6, q: 'dim7' }, { off: 2, q: 'm7b5' }, { off: 7, q: '7' },
      // A: final — bar 6 takes the ii–V turnaround
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 2, q: 'm7b5' }, { off: 7, q: '7' },
      { off: 0, q: 'm7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
    ],
  },
  {
    // 16-bar form played twice (Dm). Bars 5–6 keep the Dm root while the
    // original Dm/C#→Dm/C bass descent is flattened. A7#5→A7; the first
    // pass ends on the signature bII7 (Eb7) tritone-sub turnaround, the
    // second takes the final ending | Eb7 | Dm6 |.
    id: 'yesterdays', label: 'Yesterdays', genre: 'jazz', key: 2, minor: true,
    bars: [
      // pass 1: | Dm6 | Em7b5 A7 | Dm6 | Em7b5 A7 | Dm | % | Bm7b5 | E7 |
      { off: 0, q: 'm6' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm6' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm' }, { off: 0, q: 'm' }, { off: 9, q: 'm7b5' }, { off: 2, q: '7' },
      // | A7 | D7 | G7 | C7 | Cm7 F7 | Bbmaj7 Ebmaj7 | Em7 | Eb7 |
      { off: 7, q: '7' }, { off: 0, q: '7' }, { off: 5, q: '7' }, { off: 10, q: '7' },
      { off: 10, q: 'm7', half: true }, { off: 3, q: '7', half: true },
      { off: 8, q: 'maj7', half: true }, { off: 1, q: 'maj7', half: true },
      { off: 2, q: 'm7' }, { off: 1, q: '7' },
      // pass 2: same, final ending | Eb7 | Dm6 |
      { off: 0, q: 'm6' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm6' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm' }, { off: 0, q: 'm' }, { off: 9, q: 'm7b5' }, { off: 2, q: '7' },
      { off: 7, q: '7' }, { off: 0, q: '7' }, { off: 5, q: '7' }, { off: 10, q: '7' },
      { off: 10, q: 'm7', half: true }, { off: 3, q: '7', half: true },
      { off: 8, q: 'maj7', half: true }, { off: 1, q: 'maj7', half: true },
      { off: 1, q: '7' }, { off: 0, q: 'm6' },
    ],
  },
  {
    // AABA, 64 bars in Bb — the bebop workout. The bridge cycles ii–V–Is
    // through major-thirds-related centres (B → Eb → G) then stacks
    // ii–Vs (Dm7–G7, then Cm7–F7 ×3) to get home. One chord per bar in
    // the A sections, two per bar in most of the bridge.
    id: 'cherokee', label: 'Cherokee', genre: 'jazz', key: 10,
    bars: [
      // A: | Bbmaj7 | Fm7 Bb7 | Ebmaj7 | % | Abmaj7 | % | Dm7 G7 | Cm7 F7 |
      { off: 0, q: 'maj7' },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' },
      { off: 10, q: 'maj7' }, { off: 10, q: 'maj7' },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      // | Bbmaj7 | Fm7 Bb7 | Ebmaj7 | % | Abmaj7 | Dm7 G7 | Cm7 F7 | Bbmaj7 |
      { off: 0, q: 'maj7' },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' },
      { off: 10, q: 'maj7' },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7' },
      // A: repeat (bars 17–32)
      { off: 0, q: 'maj7' },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' },
      { off: 10, q: 'maj7' }, { off: 10, q: 'maj7' },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7' },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' },
      { off: 10, q: 'maj7' },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7' },
      // B: | C#m7 F#7 | Bmaj7 | % | % | Fm7 Bb7 | Ebmaj7 | % | % |
      //    | Am7 D7 | Gmaj7 | % | % | Dm7 G7 | Cm7 F7 | Cm7 F7 | Cm7 F7 |
      { off: 3, q: 'm7', half: true }, { off: 8, q: '7', half: true },
      { off: 1, q: 'maj7' }, { off: 1, q: 'maj7' }, { off: 1, q: 'maj7' },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' },
      { off: 11, q: 'm7', half: true }, { off: 4, q: '7', half: true },
      { off: 9, q: 'maj7' }, { off: 9, q: 'maj7' }, { off: 9, q: 'maj7' },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      // A: final (bars 49–64)
      { off: 0, q: 'maj7' },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' },
      { off: 10, q: 'maj7' }, { off: 10, q: 'maj7' },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7' },
      { off: 7, q: 'm7', half: true }, { off: 0, q: '7', half: true },
      { off: 5, q: 'maj7' }, { off: 5, q: 'maj7' },
      { off: 10, q: 'maj7' },
      { off: 4, q: 'm7', half: true }, { off: 9, q: '7', half: true },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'maj7' },
    ],
  },

  {
    // The A-section line-cliché played twice — the original
    // Cm → Cm(maj7) → Cm7 → Cm6 descent is flattened to Cm7/Cm6 (no
    // m(maj7) quality), then bVImaj7, iv and the iiø–V7 home. Bridge
    // and C sections omitted.
    id: 'my-funny-valentine', label: 'My Funny Valentine', genre: 'jazz',
    key: 0, minor: true,
    bars: [
      // | Cm | Cm7 | Cm7 | Cm6 | Abmaj7 | Fm7 | Dm7b5 G7 | Cm |  ×2
      { off: 0, q: 'm' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 0, q: 'm6' }, { off: 8, q: 'maj7' }, { off: 5, q: 'm7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm' },
      { off: 0, q: 'm' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 0, q: 'm6' }, { off: 8, q: 'maj7' }, { off: 5, q: 'm7' },
      { off: 2, q: 'm7b5', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm' },
    ],
  },
  {
    // 16 bars in Am — the Peggy Lee torch-blues form: i → iv with the
    // V7 punch in bar 7 of each 8-bar phrase. Played twice.
    id: 'fever', label: 'Fever (Peggy Lee)', genre: 'jazz', key: 9, minor: true,
    bars: [
      // | Am | Am | Dm | Am | Dm | Am | E7 | Am |  ×2
      { off: 0, q: 'm' }, { off: 0, q: 'm' }, { off: 5, q: 'm' }, { off: 0, q: 'm' },
      { off: 5, q: 'm' }, { off: 0, q: 'm' }, { off: 7, q: '7' }, { off: 0, q: 'm' },
      { off: 0, q: 'm' }, { off: 0, q: 'm' }, { off: 5, q: 'm' }, { off: 0, q: 'm' },
      { off: 5, q: 'm' }, { off: 0, q: 'm' }, { off: 7, q: '7' }, { off: 0, q: 'm' },
    ],
  },
  {
    // The famous I–vi–ii–V in Eb (the doo-wop changes) — the whole tune
    // rides this loop; four 4-bar passes shown.
    id: 'blue-moon', label: 'Blue Moon', genre: 'jazz', key: 3,
    bars: [
      // | Ebmaj7 | Cm7 | Fm7 | Bb7 |  ×4
      { off: 0, q: 'maj7' }, { off: 9, q: 'm7' }, { off: 2, q: 'm7' }, { off: 7, q: '7' },
      { off: 0, q: 'maj7' }, { off: 9, q: 'm7' }, { off: 2, q: 'm7' }, { off: 7, q: '7' },
      { off: 0, q: 'maj7' }, { off: 9, q: 'm7' }, { off: 2, q: 'm7' }, { off: 7, q: '7' },
      { off: 0, q: 'maj7' }, { off: 9, q: 'm7' }, { off: 2, q: 'm7' }, { off: 7, q: '7' },
    ],
  },

  // ---------- classical ----------

  {
    // The 8-bar ground bass (I–V–vi–iii–IV–I–IV–V) played twice — the
    // piece loops this under every variation. In 4/4 here; the original
    // is a slow ground, one chord per bar.
    id: 'canon-in-d', label: 'Canon in D (Pachelbel)', genre: 'classical', key: 2,
    bars: [
      // | D | A | Bm | F#m | G | D | G | A | ×2
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 4, q: 'm' },
      { off: 5, q: '' }, { off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 4, q: 'm' },
      { off: 5, q: '' }, { off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' },
    ],
  },
  {
    // Harmonic skeleton of the main theme (WoO 59, A minor, 3/8 — one
    // chord per bar): theme A rides i–V, the B glance visits C major then
    // prolongs the dominant E. The record/most charts use E major (E7 is
    // the common variant — the b7 D is melodically inert here).
    id: 'fur-elise', label: 'Für Elise (theme skeleton)', genre: 'classical',
    key: 9, minor: true,
    bars: [
      // A: | Am | Am | E | Am | Am | Am | E | Am |
      { off: 0, q: 'm' }, { off: 0, q: 'm' }, { off: 7, q: '' }, { off: 0, q: 'm' },
      { off: 0, q: 'm' }, { off: 0, q: 'm' }, { off: 7, q: '' }, { off: 0, q: 'm' },
      // B: | C | G | Am | E | % | % |
      { off: 3, q: '' }, { off: 10, q: '' }, { off: 0, q: 'm' },
      { off: 7, q: '' }, { off: 7, q: '' }, { off: 7, q: '' },
      // A: repeat
      { off: 0, q: 'm' }, { off: 0, q: 'm' }, { off: 7, q: '' }, { off: 0, q: 'm' },
      { off: 0, q: 'm' }, { off: 0, q: 'm' }, { off: 7, q: '' }, { off: 0, q: 'm' },
    ],
  },
  {
    // Minuet in G, BWV Anh. 114 (C. Petzold, attr. Bach) — harmonic
    // reduction of the 32-bar binary minuet. In 3/4; one chord per bar,
    // the beat-3 dominant pickups on bars 1/3/9/11 are folded into G,
    // and bar 24's late D into Em. Unlabeled bars in the source ABC
    // harmonization (19, 23) are filled with the implied Em/B7.
    id: 'minuet-in-g', label: 'Minuet in G, BWV Anh. 114 (Petzold/Bach)',
    genre: 'classical', key: 7,
    bars: [
      // A: | G | % | % | % | C | G | Am | D |
      { off: 0, q: '' }, { off: 0, q: '' }, { off: 0, q: '' }, { off: 0, q: '' },
      { off: 5, q: '' }, { off: 0, q: '' }, { off: 2, q: 'm' }, { off: 7, q: '' },
      // A: repeat, ending | Am7 D7 | G |
      { off: 0, q: '' }, { off: 0, q: '' }, { off: 0, q: '' }, { off: 0, q: '' },
      { off: 5, q: '' }, { off: 0, q: '' },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: '' },
      // B: | B7 | Em | % | B7 | Em | B7 | % | Em |
      //    | G | C | Am | D | % | G | D7 | % |
      { off: 4, q: '7' }, { off: 9, q: 'm' }, { off: 9, q: 'm' }, { off: 4, q: '7' },
      { off: 9, q: 'm' }, { off: 4, q: '7' }, { off: 4, q: '7' }, { off: 9, q: 'm' },
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 2, q: 'm' }, { off: 7, q: '' },
      { off: 7, q: '' }, { off: 0, q: '' }, { off: 7, q: '7' }, { off: 7, q: '7' },
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
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
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
  {
    // F — the famous 7-bar verse (it "wants" an 8th bar) + the 5-bar
    // "why she had to go" middle played twice, then the verse again.
    // Slash-bass walkdowns flattened (F/E→F, Dm/C→Dm).
    id: 'yesterday', label: 'Yesterday', genre: 'pop', key: 5,
    bars: [
      // verse (7 bars): | F Em7 | A7 Dm | Dm Bb | C7 F | F Dm | G7 Bb | F |
      { off: 0, q: '', half: true }, { off: 11, q: 'm7', half: true },
      { off: 4, q: '7', half: true }, { off: 9, q: 'm', half: true },
      { off: 9, q: 'm', half: true }, { off: 5, q: '', half: true },
      { off: 7, q: '7', half: true }, { off: 0, q: '', half: true },
      { off: 0, q: '', half: true }, { off: 9, q: 'm', half: true },
      { off: 2, q: '7', half: true }, { off: 5, q: '', half: true },
      { off: 0, q: '' },
      // middle ×2: | Em7 A7 | Dm C | Bb | Gm7 C7 | F |
      { off: 11, q: 'm7', half: true }, { off: 4, q: '7', half: true },
      { off: 9, q: 'm', half: true }, { off: 7, q: '', half: true },
      { off: 5, q: '' },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: '' },
      { off: 11, q: 'm7', half: true }, { off: 4, q: '7', half: true },
      { off: 9, q: 'm', half: true }, { off: 7, q: '', half: true },
      { off: 5, q: '' },
      { off: 2, q: 'm7', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: '' },
      // verse: final
      { off: 0, q: '', half: true }, { off: 11, q: 'm7', half: true },
      { off: 4, q: '7', half: true }, { off: 9, q: 'm', half: true },
      { off: 9, q: 'm', half: true }, { off: 5, q: '', half: true },
      { off: 7, q: '7', half: true }, { off: 0, q: '', half: true },
      { off: 0, q: '', half: true }, { off: 9, q: 'm', half: true },
      { off: 2, q: '7', half: true }, { off: 5, q: '', half: true },
      { off: 0, q: '' },
    ],
  },
  {
    // A — the verse groove is one chord per bar on the | F#m | D | A | E |
    // loop; the last pass extends to | F#m | D | A | C#m | E | F#m E |
    // ("it's gonna take a lot..."). Record is a half-step up in B; the
    // common chart is written in A shapes (capo 2).
    id: 'africa', label: 'Africa', genre: 'pop', key: 9,
    bars: [
      { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 7, q: '' },
      { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 7, q: '' },
      { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 7, q: '' },
      { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 4, q: 'm' },
      { off: 7, q: '' },
      { off: 9, q: 'm', half: true }, { off: 7, q: '', half: true },
    ],
  },

  // ---------- more pop (well-attested charts) ----------

  {
    // A — the whole song rides the piano-arpeggio loop A–E–F#m–D
    // (the E/G# bass flattened to E). Four passes.
    id: 'someone-like-you', label: 'Someone Like You', genre: 'pop', key: 9,
    bars: [
      // | A | E | F#m | D |  ×4
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
    ],
  },
  {
    // Em (sounding pitch — the record plays capo-7 C/Am shapes). Verse
    // sits | Em | C | D | D |; the chorus turns C–G–D–Em then C–G–D–D.
    id: 'let-her-go', label: 'Let Her Go', genre: 'pop', key: 4, minor: true,
    bars: [
      // verse: | Em | C | D | D | ×2
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 10, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 10, q: '' }, { off: 10, q: '' },
      // chorus: | C | G | D | Em | C | G | D | D |
      { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 0, q: 'm' },
      { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 10, q: '' },
    ],
  },
  {
    // Am (capo-1 Am shapes; the record sounds Bbm). The whole song rides
    // the 3-bar loop Am–G–C; five passes.
    id: 'riptide', label: 'Riptide', genre: 'pop', key: 9, minor: true,
    bars: [
      // | Am | G | C |  ×5
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 3, q: '' },
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 3, q: '' },
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 3, q: '' },
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 3, q: '' },
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 3, q: '' },
    ],
  },
  {
    // G shapes (the record is Ab — capo 1). Verse and chorus both ride
    // | G | Em | C | D |; four passes.
    id: 'perfect', label: 'Perfect (Ed Sheeran)', genre: 'pop', key: 7,
    bars: [
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
    ],
  },
  {
    // D — the verse is | D | D/F# | G | A | (D/F# flattened to D); the
    // chorus ("take me into your loving arms") runs Bm–A–G–D then
    // Em–A–D.
    id: 'thinking-out-loud', label: 'Thinking Out Loud', genre: 'pop', key: 2,
    bars: [
      // verse ×2: | D | D | G | A |
      { off: 0, q: '' }, { off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' },
      // chorus: | Bm | A | G | D | Em | A | D | D |
      { off: 9, q: 'm' }, { off: 7, q: '' }, { off: 5, q: '' }, { off: 0, q: '' },
      { off: 2, q: 'm' }, { off: 7, q: '' }, { off: 0, q: '' }, { off: 0, q: '' },
    ],
  },
  {
    // Am shapes (the record is C#m — capo 4). The whole song rides
    // | Am | C | G | F |; four passes.
    id: 'counting-stars', label: 'Counting Stars', genre: 'pop', key: 9, minor: true,
    bars: [
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 8, q: '' },
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 8, q: '' },
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 8, q: '' },
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 8, q: '' },
    ],
  },
  {
    // C shapes (capo 1 — the record is a semitone up). The whole song
    // rides | C | D | G | Em |; four passes.
    id: 'viva-la-vida', label: 'Viva la Vida', genre: 'pop', key: 0,
    bars: [
      { off: 0, q: '' }, { off: 2, q: '' }, { off: 7, q: '' }, { off: 4, q: 'm' },
      { off: 0, q: '' }, { off: 2, q: '' }, { off: 7, q: '' }, { off: 4, q: 'm' },
      { off: 0, q: '' }, { off: 2, q: '' }, { off: 7, q: '' }, { off: 4, q: 'm' },
      { off: 0, q: '' }, { off: 2, q: '' }, { off: 7, q: '' }, { off: 4, q: 'm' },
    ],
  },
  {
    // A — the 3-bar loop A – E/G# – Dsus2 the whole song rides (slash
    // bass flattened; the sus2 kept). Five passes.
    id: 'chasing-cars', label: 'Chasing Cars', genre: 'pop', key: 9,
    bars: [
      // | A | E | Dsus2 |  ×5
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 5, q: 'sus2' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 5, q: 'sus2' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 5, q: 'sus2' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 5, q: 'sus2' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 5, q: 'sus2' },
    ],
  },
  {
    // G shapes (the record is B — capo 4). The whole song rides
    // | G | D | Em | C |; four passes.
    id: 'im-yours', label: "I'm Yours", genre: 'pop', key: 7,
    bars: [
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
    ],
  },
  {
    // C shapes (the record is E — capo 4). The I–V–vi–IV loop the whole
    // song rides; four passes.
    id: 'hey-soul-sister', label: 'Hey, Soul Sister', genre: 'pop', key: 0,
    bars: [
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
    ],
  },
  {
    // F — the whole song rides | F | Dm | Bb | F | (I–vi–IV–I); four
    // passes.
    id: 'just-the-way-you-are', label: 'Just the Way You Are', genre: 'pop', key: 5,
    bars: [
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' },
    ],
  },
  {
    // Cm — the verse sits on Cm (the Bb passing bass flattened); the
    // chorus loop is i–VII–VI–VII: | Cm | Bb | Ab | Bb |.
    id: 'rolling-in-the-deep', label: 'Rolling in the Deep', genre: 'pop',
    key: 0, minor: true,
    bars: [
      // verse: | Cm | Cm | Cm | Cm |
      { off: 0, q: 'm' }, { off: 0, q: 'm' }, { off: 0, q: 'm' }, { off: 0, q: 'm' },
      // chorus ×3: | Cm | Bb | Ab | Bb |
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 8, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 8, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 8, q: '' }, { off: 10, q: '' },
    ],
  },
  {
    // A — the famous chorus loop A–C#m–F#m–D (the record's A–G#–F#
    // bass descent flattened to root-position C#m). Four passes.
    id: 'take-on-me', label: 'Take On Me', genre: 'pop', key: 9,
    bars: [
      { off: 0, q: '' }, { off: 4, q: 'm' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 4, q: 'm' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 4, q: 'm' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 4, q: 'm' }, { off: 9, q: 'm' }, { off: 5, q: '' },
    ],
  },
  {
    // E — I–V–vi–IV; verse and chorus both ride it. Four passes.
    id: 'dont-stop-believin', label: "Don't Stop Believin'", genre: 'pop', key: 4,
    bars: [
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
    ],
  },
  {
    // D — the whole song rides | D | A | Bm | G |; four passes.
    id: 'with-or-without-you', label: 'With or Without You', genre: 'pop', key: 2,
    bars: [
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
    ],
  },
  {
    // C — verse and chorus ride | C | Em | F | (four passes), then the
    // "someone like you" tag lands Am–F–C.
    id: 'use-somebody', label: 'Use Somebody', genre: 'pop', key: 0,
    bars: [
      { off: 0, q: '' }, { off: 4, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 4, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 4, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 4, q: 'm' }, { off: 5, q: '' },
      // tag: | Am | F | C | C |
      { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 0, q: '' },
    ],
  },
  {
    // G — the vi–V–I–IV loop Em–D–G–C that the verse, refrain and the
    // "shallow" hook all ride (D/F# flattened). Four passes.
    id: 'shallow', label: 'Shallow (A Star Is Born)', genre: 'pop', key: 7,
    bars: [
      { off: 9, q: 'm' }, { off: 7, q: '' }, { off: 0, q: '' }, { off: 5, q: '' },
      { off: 9, q: 'm' }, { off: 7, q: '' }, { off: 0, q: '' }, { off: 5, q: '' },
      { off: 9, q: 'm' }, { off: 7, q: '' }, { off: 0, q: '' }, { off: 5, q: '' },
      { off: 9, q: 'm' }, { off: 7, q: '' }, { off: 0, q: '' }, { off: 5, q: '' },
    ],
  },
  {
    // Bb — verse | Bb | Gm | Eb | Bb |; the "guess you didn't mean" line
    // runs Gm–F–Bb–Dm–Eb with the Eb–F–Bb tag; then the "red lights"
    // bridge Gm–Eb–Bb.
    id: 'drivers-license', label: 'drivers license', genre: 'pop', key: 10,
    bars: [
      // verse ×2: | Bb | Gm | Eb | Bb |
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' },
      // chorus: | Gm F | Bb Dm | Eb | Eb F | Bb |
      { off: 9, q: 'm', half: true }, { off: 7, q: '', half: true },
      { off: 0, q: '', half: true }, { off: 4, q: 'm', half: true },
      { off: 5, q: '' },
      { off: 5, q: '', half: true }, { off: 7, q: '', half: true },
      { off: 0, q: '' },
      // bridge: | Gm | Eb | Bb |
      { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' },
    ],
  },
  {
    // Eb — I–V–vi–IV; the whole song rides | Eb | Bb | Cm | Ab |. Four
    // passes.
    id: 'titanium', label: 'Titanium', genre: 'pop', key: 3,
    bars: [
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
    ],
  },
  {
    // A — the famous I–ii–vi–IV loop | A | Bm | F#m | D |; four passes.
    id: 'halo', label: 'Halo (Beyoncé)', genre: 'pop', key: 9,
    bars: [
      { off: 0, q: '' }, { off: 2, q: 'm' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 2, q: 'm' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 2, q: 'm' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 2, q: 'm' }, { off: 9, q: 'm' }, { off: 5, q: '' },
    ],
  },
  {
    // C shapes (the record is Db — capo 1). The I–V–vi–IV loop the whole
    // song rides; four passes.
    id: 'someone-you-loved', label: 'Someone You Loved', genre: 'pop', key: 0,
    bars: [
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
    ],
  },
  {
    // D — the whole song rides D–F#m with the Bm–A turn; the 8-bar
    // phrase played twice.
    id: 'hey-there-delilah', label: 'Hey There Delilah', genre: 'pop', key: 2,
    bars: [
      // | D | F#m | D | F#m | Bm | A | Bm | A |  ×2
      { off: 0, q: '' }, { off: 4, q: 'm' }, { off: 0, q: '' }, { off: 4, q: 'm' },
      { off: 9, q: 'm' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 4, q: 'm' }, { off: 0, q: '' }, { off: 4, q: 'm' },
      { off: 9, q: 'm' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 7, q: '' },
    ],
  },

  // ---------- k-pop / 가요 ----------

  {
    // 밤편지 (IU) — record is Eb; the standard online chart is written in
    // G shapes. Verse runs | G A | F#m Bm | G A | F#m | B Em | Gm D |;
    // the Gm minor-tonic switch and the D–C outro walkdown are the
    // signature moves.
    id: 'through-the-night', label: 'Through the Night (밤편지)', genre: 'kpop', key: 7,
    bars: [
      // verse: | G A | F#m Bm | G A | F#m | B Em | Gm D | G | D |
      { off: 0, q: '', half: true }, { off: 2, q: '', half: true },
      { off: 11, q: 'm', half: true }, { off: 4, q: 'm', half: true },
      { off: 0, q: '', half: true }, { off: 2, q: '', half: true },
      { off: 11, q: 'm' },
      { off: 4, q: '', half: true }, { off: 9, q: 'm', half: true },
      { off: 0, q: 'm', half: true }, { off: 7, q: '', half: true },
      { off: 0, q: '' }, { off: 7, q: '' },
      // chorus: | G Gm | F#m Bm | Em F#7 | Bm A | D | G Gm | A B | Em Gm |
      { off: 0, q: '', half: true }, { off: 0, q: 'm', half: true },
      { off: 11, q: 'm', half: true }, { off: 4, q: 'm', half: true },
      { off: 9, q: 'm', half: true }, { off: 11, q: '7', half: true },
      { off: 4, q: 'm', half: true }, { off: 2, q: '', half: true },
      { off: 7, q: '' },
      { off: 0, q: '', half: true }, { off: 0, q: 'm', half: true },
      { off: 2, q: '', half: true }, { off: 4, q: '', half: true },
      { off: 9, q: 'm', half: true }, { off: 0, q: 'm', half: true },
      // outro tag: | G Gm | D C | G A |
      { off: 0, q: '', half: true }, { off: 0, q: 'm', half: true },
      { off: 7, q: '', half: true }, { off: 5, q: '', half: true },
      { off: 0, q: '', half: true }, { off: 2, q: '', half: true },
    ],
  },
  {
    // 봄날 (BTS) — record is Eb; charted in the standard D-shape version
    // (capo 1). The whole song cycles | D F#m | Bm G |; the chorus turns
    // through | Bm F#m | G Gm | — the borrowed iv Gm is the hook.
    id: 'spring-day', label: 'Spring Day (봄날)', genre: 'kpop', key: 2,
    bars: [
      // verse/rap: | D F#m | Bm G | ×4
      { off: 0, q: '', half: true }, { off: 4, q: 'm', half: true },
      { off: 9, q: 'm', half: true }, { off: 5, q: '', half: true },
      { off: 0, q: '', half: true }, { off: 4, q: 'm', half: true },
      { off: 9, q: 'm', half: true }, { off: 5, q: '', half: true },
      { off: 0, q: '', half: true }, { off: 4, q: 'm', half: true },
      { off: 9, q: 'm', half: true }, { off: 5, q: '', half: true },
      { off: 0, q: '', half: true }, { off: 4, q: 'm', half: true },
      { off: 9, q: 'm', half: true }, { off: 5, q: '', half: true },
      // pre-chorus: | D F#m | Bm G | ×2
      { off: 0, q: '', half: true }, { off: 4, q: 'm', half: true },
      { off: 9, q: 'm', half: true }, { off: 5, q: '', half: true },
      { off: 0, q: '', half: true }, { off: 4, q: 'm', half: true },
      { off: 9, q: 'm', half: true }, { off: 5, q: '', half: true },
      // chorus: | D F#m | Bm G | Bm F#m | G Gm | ×2
      { off: 0, q: '', half: true }, { off: 4, q: 'm', half: true },
      { off: 9, q: 'm', half: true }, { off: 5, q: '', half: true },
      { off: 9, q: 'm', half: true }, { off: 4, q: 'm', half: true },
      { off: 5, q: '', half: true }, { off: 5, q: 'm', half: true },
      { off: 0, q: '', half: true }, { off: 4, q: 'm', half: true },
      { off: 9, q: 'm', half: true }, { off: 5, q: '', half: true },
      { off: 9, q: 'm', half: true }, { off: 4, q: 'm', half: true },
      { off: 5, q: '', half: true }, { off: 5, q: 'm', half: true },
    ],
  },
  {
    // 사랑을 했다 (iKON) — in G the record rides Em–C–G–D (vi–IV–I–V).
    // The famous whistle hook is Cmaj7–D (IVmaj7–V) with the
    // Bm7→Em→Cmaj7→D tail on the second line.
    id: 'love-scenario', label: 'Love Scenario (사랑을 했다)', genre: 'kpop', key: 7,
    bars: [
      // verse: | Em | C | G | D | ×2
      { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 7, q: '' },
      { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 7, q: '' },
      // chorus: | Cmaj7 | D | Cmaj7 | D | Bm7 | Em | Cmaj7 | D |
      { off: 5, q: 'maj7' }, { off: 7, q: '' }, { off: 5, q: 'maj7' }, { off: 7, q: '' },
      { off: 4, q: 'm7' }, { off: 9, q: 'm' }, { off: 5, q: 'maj7' }, { off: 7, q: '' },
    ],
  },

  {
    // 걱정말아요 그대 (들국화; 이적 Reply-1988 cover) — in G the verse
    // rides I–vi–ii–V and the refrain turns through C–D home to G.
    id: 'dont-worry-my-dear', label: "Don't Worry, My Dear (걱정말아요 그대)",
    genre: 'kpop', key: 7,
    bars: [
      // verse ×2: | G | Em | Am | D |
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 2, q: 'm' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 2, q: 'm' }, { off: 7, q: '' },
      // refrain: | G | Em | C | D | G | G |
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 0, q: '' },
    ],
  },
  {
    // 눈의 꽃 (박효신) — the canon-style ballad progression in Bb:
    // I–V–vi–iii–IV–I–ii–V (F/A bass flattened). Two passes.
    id: 'snow-flower', label: 'Snow Flower (눈의 꽃)', genre: 'kpop', key: 10,
    bars: [
      // | Bb | F | Gm | Dm | Eb | Bb | Cm | F |  ×2
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 4, q: 'm' },
      { off: 5, q: '' }, { off: 0, q: '' }, { off: 2, q: 'm' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 4, q: 'm' },
      { off: 5, q: '' }, { off: 0, q: '' }, { off: 2, q: 'm' }, { off: 7, q: '' },
    ],
  },
  {
    // 하루하루 (BIGBANG) — the whole song rides the Em–C–G–D loop
    // (vi–IV–I–V of G); four passes.
    id: 'haru-haru', label: 'Haru Haru (하루하루)', genre: 'kpop', key: 4,
    minor: true,
    bars: [
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
    ],
  },
  {
    // 거짓말 (BIGBANG) — the whole song rides Dm–Bb–F–C (vi–IV–I–V of
    // F); four passes.
    id: 'lies', label: 'Lies (거짓말)', genre: 'kpop', key: 2, minor: true,
    bars: [
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
    ],
  },
  {
    // 너였다면 (정승환) — the canon-style ballad chart in C:
    // I–V–vi–iii–IV–I–IV–V (G/B and C/E basses flattened). Two passes.
    id: 'if-it-is-you', label: 'If It Is You (너였다면)', genre: 'kpop', key: 0,
    bars: [
      // | C | G | Am | Em | F | C | F | G |  ×2
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 4, q: 'm' },
      { off: 5, q: '' }, { off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 4, q: 'm' },
      { off: 5, q: '' }, { off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' },
    ],
  },
  {
    // 벚꽃 엔딩 (버스커 버스커) — the spring anthem in E: I–IV–V–I then
    // the iii–vi–ii–V turnaround (G#m–C#m–F#m–B). Two passes.
    id: 'cherry-blossom-ending', label: 'Cherry Blossom Ending (벚꽃 엔딩)',
    genre: 'kpop', key: 4,
    bars: [
      // | E | A | B | E | G#m | C#m | F#m | B |  ×2
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' }, { off: 0, q: '' },
      { off: 4, q: 'm' }, { off: 9, q: 'm' }, { off: 2, q: 'm' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' }, { off: 0, q: '' },
      { off: 4, q: 'm' }, { off: 9, q: 'm' }, { off: 2, q: 'm' }, { off: 7, q: '' },
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
  {
    // The 4-bar loop in Em, four passes — verse and chorus both ride it.
    id: 'zombie', label: 'Zombie', genre: 'rock', key: 4, minor: true,
    bars: [
      // | Em | C | G | D | ×4
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
    ],
  },
  {
    // The famous loop in the capo-2 Em shapes (the record sounds F#m):
    // Em7–G–Dsus4–A7sus4, four passes.
    id: 'wonderwall', label: 'Wonderwall', genre: 'rock', key: 4, minor: true,
    bars: [
      // | Em7 | G | Dsus4 | A7sus4 | ×4
      { off: 0, q: 'm7' }, { off: 3, q: '' }, { off: 10, q: 'sus4' }, { off: 5, q: '7sus4' },
      { off: 0, q: 'm7' }, { off: 3, q: '' }, { off: 10, q: 'sus4' }, { off: 5, q: '7sus4' },
      { off: 0, q: 'm7' }, { off: 3, q: '' }, { off: 10, q: 'sus4' }, { off: 5, q: '7sus4' },
      { off: 0, q: 'm7' }, { off: 3, q: '' }, { off: 10, q: 'sus4' }, { off: 5, q: '7sus4' },
    ],
  },
  {
    // G — the whole song is the 4-bar loop G–B–C–Cm (I–III–IV–iv); the
    // major B and borrowed Cm are the sound of the tune. Four passes
    // (verse ×2 + chorus ×2).
    id: 'creep', label: 'Creep', genre: 'rock', key: 7,
    bars: [
      { off: 0, q: '' }, { off: 4, q: '' }, { off: 5, q: '' }, { off: 5, q: 'm' },
      { off: 0, q: '' }, { off: 4, q: '' }, { off: 5, q: '' }, { off: 5, q: 'm' },
      { off: 0, q: '' }, { off: 4, q: '' }, { off: 5, q: '' }, { off: 5, q: 'm' },
      { off: 0, q: '' }, { off: 4, q: '' }, { off: 5, q: '' }, { off: 5, q: 'm' },
    ],
  },
  {
    // G — the intro arpeggio figure (Em7–G twice, then Em7–A7sus4 twice
    // into G) plus the 8-bar verse loop C–D–Am–G–D–C–Am–G, played twice.
    id: 'wish-you-were-here', label: 'Wish You Were Here', genre: 'rock', key: 7,
    bars: [
      // intro: | Em7 | G | Em7 | G | Em7 | A7sus4 | Em7 | A7sus4 | G | % |
      { off: 9, q: 'm7' }, { off: 0, q: '' }, { off: 9, q: 'm7' }, { off: 0, q: '' },
      { off: 9, q: 'm7' }, { off: 2, q: '7sus4' }, { off: 9, q: 'm7' }, { off: 2, q: '7sus4' },
      { off: 0, q: '' }, { off: 0, q: '' },
      // verse ×2: | C | D | Am | G | D | C | Am | G |
      { off: 5, q: '' }, { off: 7, q: '' }, { off: 2, q: 'm' }, { off: 0, q: '' },
      { off: 7, q: '' }, { off: 5, q: '' }, { off: 2, q: 'm' }, { off: 0, q: '' },
      { off: 5, q: '' }, { off: 7, q: '' }, { off: 2, q: 'm' }, { off: 0, q: '' },
      { off: 7, q: '' }, { off: 5, q: '' }, { off: 2, q: 'm' }, { off: 0, q: '' },
    ],
  },

  // ---------- more rock (well-attested charts) ----------

  {
    // Em shapes (capo 1 — the record is Fm). The whole song rides
    // | Em | G | D | A | (i–III–VII–IV); four passes.
    id: 'boulevard-of-broken-dreams', label: 'Boulevard of Broken Dreams',
    genre: 'rock', key: 4, minor: true,
    bars: [
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 5, q: '' },
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 5, q: '' },
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 5, q: '' },
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 5, q: '' },
    ],
  },
  {
    // G — the picked verse rides | G | G | Cadd9 | D |; the chorus turns
    // Em–D–C–G. Both phrases twice.
    id: 'good-riddance', label: 'Good Riddance (Time of Your Life)',
    genre: 'rock', key: 7,
    bars: [
      // verse ×2: | G | G | Cadd9 | D |
      { off: 0, q: '' }, { off: 0, q: '' }, { off: 5, q: 'add9' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 0, q: '' }, { off: 5, q: 'add9' }, { off: 7, q: '' },
      // chorus ×2: | Em | D | C | G |
      { off: 9, q: 'm' }, { off: 7, q: '' }, { off: 5, q: '' }, { off: 0, q: '' },
      { off: 9, q: 'm' }, { off: 7, q: '' }, { off: 5, q: '' }, { off: 0, q: '' },
    ],
  },
  {
    // Em shapes (capo 2 — the record is F#m). The whole song rides
    // | Em | C | G | D |; four passes.
    id: 'numb', label: 'Numb (Linkin Park)', genre: 'rock', key: 4, minor: true,
    bars: [
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
    ],
  },
  {
    // Ab — the famous I–vi–IV–V loop; the record's add9 voicings
    // flattened to triads. Four passes.
    id: 'every-breath-you-take', label: 'Every Breath You Take', genre: 'rock',
    key: 8,
    bars: [
      // | Ab | Fm | Db | Eb |  ×4
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' },
    ],
  },
  {
    // Em — the verse arpeggio loop Em–D–C (twice per phrase) with the
    // G–B7 turnaround back to Em ("forever trusting who we are").
    id: 'nothing-else-matters', label: 'Nothing Else Matters', genre: 'rock',
    key: 4, minor: true,
    bars: [
      // | Em | D | C | C | Em | D | C | C |
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 8, q: '' }, { off: 8, q: '' },
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 8, q: '' }, { off: 8, q: '' },
      // | G | B7 | Em | Em | G | B7 | Em | Em |
      { off: 3, q: '' }, { off: 7, q: '7' }, { off: 0, q: 'm' }, { off: 0, q: 'm' },
      { off: 3, q: '' }, { off: 7, q: '7' }, { off: 0, q: 'm' }, { off: 0, q: 'm' },
    ],
  },
  {
    // Em — the riff's chord skeleton E–G–E–C–B; four passes.
    id: 'seven-nation-army', label: 'Seven Nation Army', genre: 'rock',
    key: 4, minor: true,
    bars: [
      // | Em | G | Em | C B |  ×4
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 0, q: 'm' },
      { off: 8, q: '', half: true }, { off: 7, q: '', half: true },
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 0, q: 'm' },
      { off: 8, q: '', half: true }, { off: 7, q: '', half: true },
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 0, q: 'm' },
      { off: 8, q: '', half: true }, { off: 7, q: '', half: true },
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 0, q: 'm' },
      { off: 8, q: '', half: true }, { off: 7, q: '', half: true },
    ],
  },
  {
    // Em — the whole song rides the Em–D loop of the riff; eight passes.
    id: 'come-as-you-are', label: 'Come as You Are', genre: 'rock',
    key: 4, minor: true,
    bars: [
      // | Em | D |  ×8
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 0, q: 'm' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 0, q: 'm' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 0, q: 'm' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 0, q: 'm' }, { off: 10, q: '' },
    ],
  },
  {
    // Am — the verse alternates Am–F; the chorus ("dream of
    // Californication") turns C–G–Dm–Am.
    id: 'californication', label: 'Californication', genre: 'rock',
    key: 9, minor: true,
    bars: [
      // verse ×4: | Am | F |
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 0, q: 'm' }, { off: 8, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 0, q: 'm' }, { off: 8, q: '' },
      // chorus ×2: | C | G | Dm | Am |
      { off: 3, q: '' }, { off: 10, q: '' }, { off: 5, q: 'm' }, { off: 0, q: 'm' },
      { off: 3, q: '' }, { off: 10, q: '' }, { off: 5, q: 'm' }, { off: 0, q: 'm' },
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
  {
    // 12-bar minor blues in Bm — the signature bVImaj7 (Gmaj7) in bar 9
    // and a V7 turnaround. (The record sometimes ends on Em7 — V7 kept.)
    id: 'the-thrill-is-gone', label: 'The Thrill Is Gone', genre: 'blues',
    key: 11, minor: true,
    bars: [
      // | Bm7 | Em7 | Bm7 | Bm7 | Em7 | Em7 | Bm7 | Bm7 | Gmaj7 | F#7 | Bm7 | F#7 |
      { off: 0, q: 'm7' }, { off: 5, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 5, q: 'm7' }, { off: 5, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 8, q: 'maj7' }, { off: 7, q: '7' }, { off: 0, q: 'm7' }, { off: 7, q: '7' },
    ],
  },

  {
    // Am — the famous i–VII–VI–V loop (Am–G–F–E); four passes.
    id: 'hit-the-road-jack', label: 'Hit the Road Jack', genre: 'blues',
    key: 9, minor: true,
    bars: [
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 8, q: '' }, { off: 7, q: '' },
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 8, q: '' }, { off: 7, q: '' },
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 8, q: '' }, { off: 7, q: '' },
      { off: 0, q: 'm' }, { off: 10, q: '' }, { off: 8, q: '' }, { off: 7, q: '' },
    ],
  },
  {
    // Am — the verse rides | Am | Em | G | Am | (the Em/G bass
    // flattened); the "I know" vamp stays on the loop. Four passes.
    id: 'aint-no-sunshine', label: "Ain't No Sunshine", genre: 'blues',
    key: 9, minor: true,
    bars: [
      { off: 0, q: 'm' }, { off: 7, q: 'm' }, { off: 10, q: '' }, { off: 0, q: 'm' },
      { off: 0, q: 'm' }, { off: 7, q: 'm' }, { off: 10, q: '' }, { off: 0, q: 'm' },
      { off: 0, q: 'm' }, { off: 7, q: 'm' }, { off: 10, q: '' }, { off: 0, q: 'm' },
      { off: 0, q: 'm' }, { off: 7, q: 'm' }, { off: 10, q: '' }, { off: 0, q: 'm' },
    ],
  },
  {
    // 12-bar shuffle in E (the record is tuned down a half-step; charted
    // in E). Quick IV in bar 2, V–IV–I–V tag.
    id: 'pride-and-joy', label: 'Pride and Joy', genre: 'blues', key: 4,
    bars: [
      // | E7 | A7 | E7 | E7 | A7 | A7 | E7 | E7 | B7 | A7 | E7 | B7 |
      { off: 0, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
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
  {
    // 16-bar Latin/modal tune in Am — four bars each of Am7 and Cm7
    // (i→iii colour), then the ii–V–I descent through Ab and Gb major
    // resolving to Fmaj7; E7(#9→E7) takes it back to A minor.
    id: 'recordame', label: 'Recordame', genre: 'latin', key: 9, minor: true,
    bars: [
      // | Am7 | % | % | % | Cm7 | % | % | % |
      { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' }, { off: 0, q: 'm7' },
      { off: 3, q: 'm7' }, { off: 3, q: 'm7' }, { off: 3, q: 'm7' }, { off: 3, q: 'm7' },
      // | Bbmaj7 | Bbm7 Eb7 | Abmaj7 | Abm7 Db7 | Gbmaj7 | Gm7 C7 | Fmaj7 | E7 |
      { off: 1, q: 'maj7' },
      { off: 1, q: 'm7', half: true }, { off: 6, q: '7', half: true },
      { off: 11, q: 'maj7' },
      { off: 11, q: 'm7', half: true }, { off: 4, q: '7', half: true },
      { off: 9, q: 'maj7' },
      { off: 10, q: 'm7', half: true }, { off: 3, q: '7', half: true },
      { off: 8, q: 'maj7' }, { off: 7, q: '7' },
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
      // "the answer, my friend…": | F | G | C | Am | F | G | C | C |
      { off: 5, q: '' }, { off: 7, q: '' }, { off: 0, q: '' }, { off: 9, q: 'm' },
      { off: 5, q: '' }, { off: 7, q: '' }, { off: 0, q: '' }, { off: 0, q: '' },
    ],
  },
  {
    // The chorus loop in G, played twice — "country roads, take me home".
    id: 'country-roads', label: 'Take Me Home, Country Roads', genre: 'folk', key: 7,
    bars: [
      // | G | D | Em | C | G | D | C | G | ×2
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 5, q: '' }, { off: 0, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 5, q: '' }, { off: 0, q: '' },
    ],
  },
  {
    // English folk in Am (in 6/8 — charted one or two chords per bar as on
    // the common guitar sheets). Verse walks Am–C–G–Em and cadences on E;
    // the refrain ("Greensleeves was all my joy") starts on C.
    id: 'greensleeves', label: 'Greensleeves', genre: 'folk', key: 9, minor: true,
    bars: [
      // verse: | Am C | G Em | Am | E | Am C | G Em | Am E7 | Am |
      { off: 0, q: 'm', half: true }, { off: 3, q: '', half: true },
      { off: 10, q: '', half: true }, { off: 7, q: 'm', half: true },
      { off: 0, q: 'm' }, { off: 7, q: '' },
      { off: 0, q: 'm', half: true }, { off: 3, q: '', half: true },
      { off: 10, q: '', half: true }, { off: 7, q: 'm', half: true },
      { off: 0, q: 'm', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm' },
      // refrain: | C G | Em | Am | E | C G | Em | Am E7 | Am |
      { off: 3, q: '', half: true }, { off: 10, q: '', half: true },
      { off: 7, q: 'm' }, { off: 0, q: 'm' }, { off: 7, q: '' },
      { off: 3, q: '', half: true }, { off: 10, q: '', half: true },
      { off: 7, q: 'm' },
      { off: 0, q: 'm', half: true }, { off: 7, q: '7', half: true },
      { off: 0, q: 'm' },
    ],
  },
  {
    // 아리랑 — Korean folk song in a simple Western harmonization in C
    // (the standard guitar arrangement: C Am7 Fmaj7 C / G Am G C, played
    // for both Arirang phrases). Major-key reading of the pentatonic
    // melody; minor/7th colours follow the published guitar chart.
    id: 'arirang', label: 'Arirang (아리랑)', genre: 'folk', key: 0,
    bars: [
      // | C | Am7 | Fmaj7 | C | G | Am | G | C | ×2
      { off: 0, q: '' }, { off: 9, q: 'm7' }, { off: 5, q: 'maj7' }, { off: 0, q: '' },
      { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 7, q: '' }, { off: 0, q: '' },
      { off: 0, q: '' }, { off: 9, q: 'm7' }, { off: 5, q: 'maj7' }, { off: 0, q: '' },
      { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 7, q: '' }, { off: 0, q: '' },
    ],
  },

  // ---------- more folk / country ----------

  {
    // G — the verse rides | G | D | Em | C |; the "rock me mama" chorus
    // lands G–D–C. Both phrases twice.
    id: 'wagon-wheel', label: 'Wagon Wheel', genre: 'folk', key: 7,
    bars: [
      // verse ×2: | G | D | Em | C |
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' },
      // chorus ×2: | G | D | C | C |
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 5, q: '' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 5, q: '' }, { off: 5, q: '' },
    ],
  },
  {
    // Am — the whole song rides i–III–VII–i: | Am | C | G | Am |.
    id: 'jolene', label: 'Jolene', genre: 'folk', key: 9, minor: true,
    bars: [
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 0, q: 'm' },
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 0, q: 'm' },
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 0, q: 'm' },
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 10, q: '' }, { off: 0, q: 'm' },
    ],
  },
  {
    // G — the mariachi-horn chart: I–IV pairs with the V7 turnaround.
    // Two passes of the 8-bar phrase.
    id: 'ring-of-fire', label: 'Ring of Fire', genre: 'folk', key: 7,
    bars: [
      // | G | C | G | C | G | D7 | G | G |  ×2
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '7' }, { off: 0, q: '' }, { off: 0, q: '' },
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 5, q: '' },
      { off: 0, q: '' }, { off: 7, q: '7' }, { off: 0, q: '' }, { off: 0, q: '' },
    ],
  },
  {
    // Am (Johnny Cash version) — the verse walks Am–C–D; the chorus
    // ("what have I become") turns Am–F–C–G.
    id: 'hurt', label: 'Hurt (Johnny Cash)', genre: 'folk', key: 9, minor: true,
    bars: [
      // verse: | Am | C | D | Am | C | D | Am | Am |
      { off: 0, q: 'm' }, { off: 3, q: '' }, { off: 5, q: '' }, { off: 0, q: 'm' },
      { off: 3, q: '' }, { off: 5, q: '' }, { off: 0, q: 'm' }, { off: 0, q: 'm' },
      // chorus ×2: | Am | F | C | G |
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
      { off: 0, q: 'm' }, { off: 8, q: '' }, { off: 3, q: '' }, { off: 10, q: '' },
    ],
  },
  {
    // C — the verse form | C | F | C | C | F | C | G7 | C |, twice.
    id: 'you-are-my-sunshine', label: 'You Are My Sunshine', genre: 'folk', key: 0,
    bars: [
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 0, q: '' },
      { off: 5, q: '' }, { off: 0, q: '' }, { off: 7, q: '7' }, { off: 0, q: '' },
      { off: 0, q: '' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 0, q: '' },
      { off: 5, q: '' }, { off: 0, q: '' }, { off: 7, q: '7' }, { off: 0, q: '' },
    ],
  },
];

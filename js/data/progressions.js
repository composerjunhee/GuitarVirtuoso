// Progression presets. Bars are {off: semitones from key root, q: quality}.
// Practice resolves them against the chosen key. `songs` names well-known
// examples (Latin titles, shared across UI languages) — keep it accurate:
// a generic tag beats a wrong name-drop.

export const PROGRESSIONS = [
  {
    id: 'I-IV-V', label: 'I–IV–V',
    songs: 'La Bamba · Twist and Shout',
    bars: [{ off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' }, { off: 0, q: '' }],
  },
  {
    id: 'I-V-vi-IV', label: 'I–V–vi–IV',
    songs: 'Let It Be · No Woman No Cry',
    bars: [{ off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }],
  },
  {
    id: 'I-vi-IV-V', label: 'I–vi–IV–V',
    songs: 'Stand By Me · Earth Angel',
    bars: [{ off: 0, q: '' }, { off: 9, q: 'm' }, { off: 5, q: '' }, { off: 7, q: '' }],
  },
  {
    id: 'I-vi-ii-V', label: 'I–vi–ii–V',
    songs: 'Blue Moon · Heart and Soul',
    bars: [{ off: 0, q: '' }, { off: 9, q: 'm' }, { off: 2, q: 'm' }, { off: 7, q: '' }],
  },
  {
    id: 'vi-IV-I-V', label: 'vi–IV–I–V',
    songs: 'Despacito · Africa',
    bars: [{ off: 9, q: 'm' }, { off: 5, q: '' }, { off: 0, q: '' }, { off: 7, q: '' }],
  },
  {
    id: 'I-V-vi-iii-IV-I-IV-V', label: 'I–V–vi–iii–IV–I–IV–V',
    songs: 'Pachelbel’s Canon · Let It Go · Basket Case',
    bars: [
      { off: 0, q: '' }, { off: 7, q: '' }, { off: 9, q: 'm' }, { off: 4, q: 'm' },
      { off: 5, q: '' }, { off: 0, q: '' }, { off: 5, q: '' }, { off: 7, q: '' },
    ],
  },
  {
    id: 'I-III-IV-iv', label: 'I–III–IV–iv',
    songs: 'Creep',
    bars: [{ off: 0, q: '' }, { off: 4, q: '' }, { off: 5, q: '' }, { off: 5, q: 'm' }],
  },
  {
    id: 'i-VII-VI-V', label: 'i–VII–VI–V',
    songs: 'Hotel California',
    bars: [{ off: 9, q: 'm' }, { off: 7, q: '' }, { off: 5, q: '' }, { off: 4, q: '' }],
  },
  {
    id: 'ii-V-I', label: 'ii–V–I',
    songs: 'Autumn Leaves (ii–V–I)',
    bars: [{ off: 2, q: 'm7' }, { off: 7, q: '7' }, { off: 0, q: 'maj7' }, { off: 0, q: 'maj7' }],
  },
  {
    id: 'blues12', label: '12-bar blues',
    songs: '12-bar blues standard',
    bars: [
      { off: 0, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 5, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 0, q: '7' },
      { off: 7, q: '7' }, { off: 5, q: '7' }, { off: 0, q: '7' }, { off: 7, q: '7' },
    ],
  },
];

// Practice decks: chord symbols resolved via chords.parseSymbol.
export const DECKS = {
  starter8: ['C', 'G', 'D', 'A', 'E', 'Am', 'Em', 'Dm'],
  open15: ['C', 'G', 'D', 'A', 'E', 'F', 'Am', 'Em', 'Dm',
    'A7', 'E7', 'D7', 'G7', 'B7', 'C7'],
};

# Guitar Virtuoso

기타 코드 튜터 — chord library, fretboard trainer, tuner, ear training.
Vanilla JS PWA, no build step. KO/EN.

## Run

```
python serve.py        # → http://localhost:8000  (localhost = secure context, mic OK)
```

Installable as a PWA; fully offline after first load (service worker).

## Test

```
npm test               # node test/selftest.js — synth audio → detectors + voicing engine
```

or open `test/selftest.html` in the browser. The harness synthesizes chords
with the app's own Karplus-Strong engine and feeds them through the pitch and
chord detectors, so no real guitar is needed.

## Icons

```
python tools/make_icon.py   # Pillow — icons/, favicon.ico, apple-touch-icon.png
```

## Layout

- `js/theory/` — notes (pitch-class math), chords (quality table + symbol
  parser), voicings (voicing generator/ranker/finger-assigner; curated shapes
  in `js/data/curated.js` go first)
- `js/audio/` — `input.js` mic (AudioWorklet frames + AnalyserNode spectrum),
  `pitch.js` YIN-lite tuner, `chordDetect.js` harmonic pitch-class-profile
  verification (knows the expected chord, not open recognition), `pluck.js`
  Karplus-Strong playback, `metronome.js` lookahead scheduler
- `js/ui/` — SVG fretboard (display + interactive, lefty mirror), chord box
  diagram, tuner gauge
- `js/screens/` — library / practice (flashcards + metronome progressions +
  custom progression builder in `progBuilder.js`) / tuner / ear training
  (`ear.js`: quality ID, root ID, mic-verified play-it-back)

Practice stats live in `localStorage` (`gt.stats`, Leitner boxes; `gt.deck`
custom deck; `gt.progs` user progressions; `gt.lang`/`gt.flat`/`gt.lefty`
settings).

// Library screen: root × quality pickers → chord diagram, voicing pager,
// full-fretboard tone map, Karplus-Strong playback, deck management.

import { pcName, STRINGS, midiToPc, fretToMidi, preferFlat } from '../theory/notes.js';
import { QUALITIES, makeChord, chordSymbol, chordPcs } from '../theory/chords.js';
import { voicingsFor, voicingMidi } from '../theory/voicings.js';
import { renderChordDiagram } from '../ui/chordDiagram.js';
import { createFretboard } from '../ui/fretboard.js';
import { chipRow, rootPicker, groupedChips, QUALITY_GROUPS, showBanner }
  from '../ui/components.js';
import { playVoicing } from '../audio/pluck.js';
import { t, getLang, onLangChange } from '../i18n.js';
import { settings, onSetting, addToDeck } from '../state.js';

const sel = { root: 0, quality: '', bass: null, voicingIdx: 0 };
let board;

function noteOpts() { return { flat: settings.flat, lang: getLang() }; }

function renderPickers() {
  const opts = noteOpts();
  rootPicker(document.getElementById('rootChips'),
    sel.root, id => { sel.root = id; sel.bass = null; sel.voicingIdx = 0; renderAll(); }, opts);

  // quality picker: 20 chips grouped into labeled families (triads, sus,
  // 6ths, 7ths, extended) instead of one wrapping wall of pills
  groupedChips(document.getElementById('qualityChips'),
    QUALITY_GROUPS.map(g => ({
      label: t(g.key),
      items: g.qs.map(qk => ({ id: qk, label: QUALITIES[qk].label })),
    })),
    sel.quality, id => { sel.quality = id; sel.bass = null; sel.voicingIdx = 0; renderAll(); });

  // bass chips: root + each chord tone (slash chords / inversions)
  const tones = [...chordPcs(sel.root, sel.quality)];
  chipRow(document.getElementById('bassChips'),
    [{ id: -1, label: t('lib.bass') + ': —' },
     ...tones.map(pc => ({ id: pc, label: pcName(pc, opts) }))],
    sel.bass ?? -1, id => { sel.bass = id < 0 ? null : id; sel.voicingIdx = 0; renderAll(); });
}

function renderAll() {
  renderPickers();
  const chord = makeChord(sel.root, sel.quality, sel.bass);
  const voicings = voicingsFor(chord);
  sel.voicingIdx = Math.min(sel.voicingIdx, Math.max(0, voicings.length - 1));
  const v = voicings[sel.voicingIdx];

  // chord symbols stay Latin in every UI language (C, Am7, F#/C# …) —
  // that's how chord charts are written in Korean too
  document.getElementById('chordTitle').textContent =
    chordSymbol(chord, { flat: settings.flat });
  if (v) {
    renderChordDiagram(document.getElementById('chordDiagram'), v, { lefty: settings.lefty });
    document.getElementById('voicingInfo').textContent = `${sel.voicingIdx + 1}/${voicings.length}`;
    // notes line: the actual pitches in this voicing
    const names = voicingMidi(v).map(m => m === null ? '×' : pcName(midiToPc(m), noteOpts()));
    document.getElementById('voicingNotes').textContent =
      `${t('lib.tones')}: ${names.join(' ')}`;
    paintBoard(chord, v);
  } else {
    document.getElementById('chordDiagram').replaceChildren();
    document.getElementById('voicingInfo').textContent = '0/0';
    document.getElementById('voicingNotes').textContent = '';
    paintBoard(chord, null);
  }
}

// Full-board map: all chord tones dim, current voicing bright, root accented.
function paintBoard(chord, voicing) {
  const pcs = chordPcs(chord.root, chord.quality);
  const root = chord.root;
  const marks = [];
  const inVoicing = new Map();   // "s,f" → finger
  if (voicing) {
    voicing.frets.forEach((f, s) => {
      if (f >= 0) inVoicing.set(`${s},${f}`, voicing.fingers?.[s] || '');
    });
  }
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= 15; f++) {
      const pc = midiToPc(fretToMidi(s, f));
      if (!pcs.has(pc)) continue;
      const key = `${s},${f}`;
      if (inVoicing.has(key)) {
        marks.push({ string: s, fret: f, kind: pc === root ? 'root' : 'tone', label: inVoicing.get(key) });
      } else {
        marks.push({ string: s, fret: f, kind: 'dim' });
      }
    }
  }
  board.setMarkers(marks);
}

let boardLefty = null;

export function initLibrary() {
  board = createFretboard(document.getElementById('libraryBoard'), { lefty: settings.lefty });
  boardLefty = settings.lefty;

  document.getElementById('voicingPrev').addEventListener('click', () => {
    const n = voicingsFor(makeChord(sel.root, sel.quality, sel.bass)).length;
    sel.voicingIdx = (sel.voicingIdx - 1 + n) % n; renderAll();
  });
  document.getElementById('voicingNext').addEventListener('click', () => {
    const n = voicingsFor(makeChord(sel.root, sel.quality, sel.bass)).length;
    sel.voicingIdx = (sel.voicingIdx + 1) % n; renderAll();
  });
  document.getElementById('playChord').addEventListener('click', () => {
    const v = voicingsFor(makeChord(sel.root, sel.quality, sel.bass))[sel.voicingIdx];
    if (v) playVoicing(v);
  });
  document.getElementById('addToDeck').addEventListener('click', () => {
    // stored symbols must stay parseable → always Latin spelling
    const sym = chordSymbol(makeChord(sel.root, sel.quality, sel.bass),
      { flat: settings.flat, lang: 'en' });
    addToDeck(sym);
    showBanner(t('lib.deckAdded'), 1500, 'info');
  });

  onLangChange(renderAll);
  onSetting((k) => {
    if (k === 'lefty' && boardLefty !== settings.lefty) {
      board = createFretboard(document.getElementById('libraryBoard'),
        { lefty: settings.lefty });
      boardLefty = settings.lefty;
    }
    if (k === 'flat' || k === 'lefty') renderAll();
  });
  renderAll();
}

// Small shared UI helpers.
import { pcName } from '../theory/notes.js';

// Build a chip row into `container`.
// items: [{id, label}]  sel: current id  onPick(id)
export function chipRow(container, items, sel, onPick) {
  container.replaceChildren();
  for (const it of items) {
    const b = document.createElement('button');
    b.className = 'chip' + (it.id === sel ? ' sel' : '');
    b.textContent = it.label;
    b.dataset.id = it.id;
    b.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('sel'));
      b.classList.add('sel');
      onPick(it.id);
    });
    container.append(b);
  }
}

// Segmented control for 2–4 mutually-exclusive options: one bordered pill
// split into equal segments (all styling lives in the .seg CSS). Same
// contract as chipRow — segments are plain .chip buttons and keep .sel.
export function segRow(container, items, sel, onPick) {
  container.classList.add('seg');
  chipRow(container, items, sel, onPick);
}

// Chord-quality family groups (a partition of QUALITY_ORDER). `key` is an
// i18n key for the group header — callers resolve it with t(). Shared by
// the library picker and the ear trainer's pool/fixed-quality pickers.
export const QUALITY_GROUPS = [
  { key: 'qual.triads',   qs: ['', 'm', '5', 'dim', 'aug'] },
  { key: 'qual.sus',      qs: ['sus2', 'sus4'] },
  { key: 'qual.sixths',   qs: ['6', 'm6'] },
  { key: 'qual.sevenths', qs: ['7', 'maj7', 'm7', 'm7b5', 'dim7', '7sus4'] },
  { key: 'qual.extended', qs: ['add9', '9', 'm9', 'maj9', '11', '13'] },
];

// Labeled chip groups: one .picker-label header per .qgroup, then that
// group's chips in a wrapping row. Same .chip/.sel + onPick(id) contract
// as chipRow. opts.multi = toggle semantics (sel is a Set; the chip flips
// its own .sel and onPick(id) is still called — ear's chord pool).
export function groupedChips(container, groups, sel, onPick, opts = {}) {
  container.replaceChildren();
  container.classList.add('picker-groups');
  for (const g of groups) {
    const grp = document.createElement('div');
    grp.className = 'qgroup';
    const lbl = document.createElement('span');
    lbl.className = 'picker-label';
    lbl.textContent = g.label;
    const row = document.createElement('div');
    row.className = 'chip-row wrap';
    for (const it of g.items) {
      const b = document.createElement('button');
      const on = opts.multi ? sel.has(it.id) : it.id === sel;
      b.className = 'chip' + (on ? ' sel' : '');
      b.textContent = it.label;
      b.dataset.id = it.id;
      b.addEventListener('click', () => {
        if (opts.multi) b.classList.toggle('sel');
        else {
          container.querySelectorAll('.chip').forEach(c => c.classList.remove('sel'));
          b.classList.add('sel');
        }
        onPick(it.id);
      });
      row.append(b);
    }
    grp.append(lbl, row);
    container.append(grp);
  }
}

// 12-pitch-class root picker: every root visible at once, no scrolling.
// Naturals (C D E F G A B) fill row 1; accidentals sit on row 2 centered
// on the gap between their neighbors, like black keys (C♯/D♭ between C
// and D, …). Each chip spans 2 of the grid's 14 columns — .root-grid in
// styles.css carries the layout.
// Same contract as chipRow: onPick(id) receives the pc int 0-11 and the
// picked chip keeps .sel. opts = {flat, lang} goes to pcName for spelling;
// pass opts.quiz = true to skip .sel management (ear quiz answers mark
// .right/.wrong themselves instead).
const NAT_PCS = [0, 2, 4, 5, 7, 9, 11];           // C D E F G A B
const ACC_PCS = [1, 3, 6, 8, 10];                 // C♯ D♯ F♯ G♯ A♯
const NAT_COL = [1, 3, 5, 7, 9, 11, 13];          // each natural: 2 cols
const ACC_COL = [2, 4, 8, 10, 12];                // centered on the gap

export function rootPicker(container, sel, onPick, opts = {}) {
  container.replaceChildren();
  container.classList.add('root-grid');
  const mk = (pc, col, row) => {
    const b = document.createElement('button');
    // row 2 = the "black keys": .acc lets CSS give them a darker, inset look
    b.className = 'chip' + (row === 2 ? ' acc' : '') + (pc === sel ? ' sel' : '');
    b.textContent = pcName(pc, opts);
    b.dataset.id = pc;
    b.style.gridRow = String(row);
    b.style.gridColumn = `${col} / span 2`;
    b.addEventListener('click', () => {
      if (!opts.quiz) {
        container.querySelectorAll('.chip').forEach(c => c.classList.remove('sel'));
        b.classList.add('sel');
      }
      onPick(pc);
    });
    container.append(b);
  };
  NAT_PCS.forEach((pc, i) => mk(pc, NAT_COL[i], 1));
  ACC_PCS.forEach((pc, i) => mk(pc, ACC_COL[i], 2));
}

export function showBanner(msg, ms = 4000, variant = '') {
  const el = document.getElementById('micBanner');
  el.textContent = msg;
  el.className = 'banner' + (variant ? ' ' + variant : '');
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.hidden = true; }, ms);
}

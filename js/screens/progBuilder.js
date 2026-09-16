// Custom progression builder — a collapsible panel inside the practice
// setup screen (#customProg, rendered by initProgBuilder). User progressions
// persist in localStorage 'gt.progs' as
//   [{ id:'custom-<timestamp>', label:string, bars:[{off:0..11, q:<QUALITIES key>}] }]
// — the same shape as PROGRESSIONS in js/data/progressions.js, which
// practice.js merges into the progression chip row via getCustomProgressions().
// No DOM is touched at import time; everything happens inside init/render.

import { QUALITIES, QUALITY_ORDER, chordSymbol } from '../theory/chords.js';
import { voicingsFor } from '../theory/voicings.js';
import { playVoicing } from '../audio/pluck.js';
import { getLang, onLangChange } from '../i18n.js';
import { settings, onSetting } from '../state.js';

const LS_KEY = 'gt.progs';
const BAR_MS = 700;

// Scale-degree names for semitone offsets 0..11 above the key root.
const ROMAN = ['I', '♭II', 'II', '♭III', 'III', 'IV',
               '♭V', 'V', '♭VI', 'VI', '♭VII', 'VII'];
// qualities that conventionally print as lowercase numerals (vi, ii, vii°…)
const MINORISH = new Set(['m', 'm6', 'm7', 'm7b5', 'm9', 'dim', 'dim7']);

// Module-local strings (delegated-module convention — not the global t()).
const S = {
  ko: {
    myProgs: '내 진행',
    empty: '저장된 진행이 없습니다.',
    bars: n => `${n}마디`,
    play: '듣기',
    del: '삭제',
    newProg: '+ 새 진행',
    namePh: '이름 (비우면 자동 생성)',
    addBar: '+ 마디 추가',
    preview: '▶ 미리듣기',
    save: '저장',
    cancel: '취소',
    inC: 'C 키 기준',
  },
  en: {
    myProgs: 'My progressions',
    empty: 'No saved progressions yet.',
    bars: n => `${n} bar${n === 1 ? '' : 's'}`,
    play: 'Play',
    del: 'Delete',
    newProg: '+ New progression',
    namePh: 'Name (blank = auto)',
    addBar: '+ Add bar',
    preview: '▶ Preview',
    save: 'Save',
    cancel: 'Cancel',
    inC: 'in C',
  },
};

let onChangedCb = null;
let inited = false;
let open = false;
let editing = null;            // draft { label, bars:[{off,q}] } or null
let previewTimers = [];

// Visuals live in styles.css: .prog-panel/.prog-row/.prog-name/.prog-syms/
// .prog-new/.prog-editor/.prog-bar/.prog-sym/.prog-foot + .gt-select/.gt-input.
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ---------- storage ----------

export function getCustomProgressions() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY));
    if (!Array.isArray(raw)) return [];
    return raw.filter(p =>
      p && typeof p.id === 'string' && typeof p.label === 'string' &&
      Array.isArray(p.bars) && p.bars.length > 0 &&
      p.bars.every(b =>
        b && Number.isInteger(b.off) && b.off >= 0 && b.off < 12 &&
        typeof b.q === 'string' &&
        !!(QUALITIES[b.q] && Array.isArray(QUALITIES[b.q].intervals))));
  } catch {
    return [];
  }
}

function saveProgs(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

// ---------- helpers ----------

// Degree numeral for a bar: lowercase when the quality is minor/dim family,
// matching the preset convention (I–V–vi–IV, ii–V–I).
function numeral(off, q) {
  const n = ROMAN[off];
  return MINORISH.has(q) ? n.toLowerCase() : n;
}

function autoLabel(bars) { return bars.map(b => numeral(b.off, b.q)).join('–'); }

// Chord name as the preview plays it — preview roots are the raw offsets,
// i.e. the key of C. Chord symbols stay Latin in every UI language.
function barSym(b) {
  return chordSymbol({ root: b.off, quality: b.q, bass: null },
    { flat: settings.flat });
}

function stopPreview() {
  previewTimers.forEach(clearTimeout);
  previewTimers = [];
}

// Strum one bar every ~700ms using the best voicing for each chord.
function preview(bars) {
  stopPreview();
  bars.forEach((b, i) => {
    previewTimers.push(setTimeout(() => {
      const v = voicingsFor({ root: b.off, quality: b.q, bass: null })[0];
      if (v) playVoicing(v);
    }, i * BAR_MS));
  });
}

// ---------- render ----------

function render() {
  stopPreview();
  const host = document.getElementById('customProg');
  if (!host) return;
  const s = S[getLang()] || S.en;
  host.replaceChildren();

  const tog = el('button', 'ghost', `${s.myProgs} ${open ? '▾' : '▸'}`);
  tog.addEventListener('click', () => { open = !open; render(); });
  host.append(tog);
  if (!open) return;

  const panel = el('div', 'prog-panel');
  host.append(panel);

  const progs = getCustomProgressions();
  if (!progs.length) panel.append(el('p', 'hint', s.empty));

  for (const p of progs) {
    const row = el('div', 'chip-row prog-row');
    const name = el('span', 'prog-name', p.label);
    const cnt = el('span', 'hint', s.bars(p.bars.length));
    const play = el('button', 'chip', '▶');
    play.title = s.play;
    play.addEventListener('click', () => preview(p.bars));
    const del = el('button', 'chip', '✕');
    del.title = s.del;
    del.addEventListener('click', () => {
      saveProgs(progs.filter(x => x.id !== p.id));
      render();
      if (onChangedCb) onChangedCb();          // refresh the prog chip row
    });
    row.append(name, cnt, play, del);
    panel.append(row);

    // the chords as previewed (key of C), dim line under the name
    const syms = el('p', 'hint mono prog-syms',
      `${p.bars.map(barSym).join(' · ')}  (${s.inC})`);
    panel.append(syms);
  }

  if (editing) renderEditor(panel, s);
  else {
    const add = el('button', 'ghost prog-new', s.newProg);
    add.addEventListener('click', () => {
      editing = { label: '', bars: [{ off: 0, q: '' }] };
      render();
    });
    panel.append(add);
  }
}

function move(i, d) {
  const j = i + d;
  if (!editing || j < 0 || j >= editing.bars.length) return;
  const [b] = editing.bars.splice(i, 1);
  editing.bars.splice(j, 0, b);
  render();
}

function saveEditing() {
  if (!editing || !editing.bars.length) return;
  const progs = getCustomProgressions();
  progs.push({
    id: `custom-${Date.now()}`,
    label: editing.label.trim() || autoLabel(editing.bars),
    bars: editing.bars.map(b => ({ off: b.off, q: b.q })),
  });
  saveProgs(progs);
  editing = null;
  render();
  if (onChangedCb) onChangedCb();
}

function renderEditor(panel, s) {
  const box = el('div', 'prog-editor');
  panel.append(box);

  const nameIn = el('input', 'gt-input');
  nameIn.type = 'text';
  nameIn.placeholder = s.namePh;
  nameIn.value = editing.label;
  nameIn.maxLength = 40;
  nameIn.addEventListener('input', () => { editing.label = nameIn.value; });
  box.append(nameIn);

  editing.bars.forEach((b, i) => {
    const row = el('div', 'chip-row wrap prog-bar');
    row.append(el('span', 'mono hint', `${i + 1}.`));

    const deg = el('select', 'gt-select');
    ROMAN.forEach((r, off) => deg.add(new Option(r, off)));
    deg.value = b.off;

    const q = el('select', 'gt-select');
    QUALITY_ORDER.forEach(key => q.add(new Option(QUALITIES[key].label, key)));
    q.value = b.q;

    // live chord symbol for this bar (as previewed, in C)
    const sym = el('span', 'mono hint prog-sym', barSym(b));
    deg.addEventListener('change', () => {
      b.off = +deg.value;
      sym.textContent = barSym(b);
    });
    q.addEventListener('change', () => {
      b.q = q.value;
      sym.textContent = barSym(b);
    });

    const up = el('button', 'chip', '↑');
    const dn = el('button', 'chip', '↓');
    const rm = el('button', 'chip', '✕');
    up.disabled = i === 0;
    dn.disabled = i === editing.bars.length - 1;
    rm.disabled = editing.bars.length === 1;   // a progression needs ≥1 bar
    // disabled ↑/↓/✕ are dimmed by .prog-editor .chip:disabled in styles.css
    up.addEventListener('click', () => move(i, -1));
    dn.addEventListener('click', () => move(i, +1));
    rm.addEventListener('click', () => { editing.bars.splice(i, 1); render(); });

    row.append(deg, q, sym, up, dn, rm);
    box.append(row);
  });

  const foot = el('div', 'chip-row wrap prog-foot');
  const addB = el('button', 'ghost', s.addBar);
  addB.addEventListener('click', () => {
    editing.bars.push({ off: 0, q: '' });
    render();
  });
  const prev = el('button', 'ghost', s.preview);
  prev.addEventListener('click', () => preview(editing.bars));
  const save = el('button', 'primary', s.save);
  save.addEventListener('click', saveEditing);
  const cancel = el('button', 'ghost', s.cancel);
  cancel.addEventListener('click', () => { editing = null; render(); });
  foot.append(addB, prev, save, cancel);
  box.append(foot);
}

// ---------- public ----------

// Called once by initPractice(); onChanged is practice's renderSetup, invoked
// after every save/delete so the progression chip row picks up the change.
export function initProgBuilder(onChanged) {
  onChangedCb = onChanged;
  if (!inited) {
    inited = true;
    onLangChange(render);
    // chord-symbol lines use the ♯/♭ spelling — keep them fresh
    onSetting(k => { if (k === 'flat') render(); });
  }
  render();
}

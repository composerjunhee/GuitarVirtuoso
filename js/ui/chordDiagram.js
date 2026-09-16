// Classic vertical chord box: 6 vertical strings (low E left), 5 visible
// frets, finger-numbered dots, barre arcs, O/× above, "nfr" when up the neck.

const NS = 'http://www.w3.org/2000/svg';
const BOX_FRET_COUNT = 5;
const SW = 30;                     // string spacing
const FH = 34;                     // fret height
const PAD_L = 26;
const PAD_T = 30;
const W = PAD_L + 5 * SW + 36;   // right margin leaves room for the "nfr" tag
const H = PAD_T + BOX_FRET_COUNT * FH + 10;

// warm-dark palette — reads the custom properties in styles.css
const C = {
  box: 'var(--cd-box)',        // dark inset behind the grid
  fret: 'var(--cd-fret)',
  nut: 'var(--ink)',
  string: 'var(--fb-string)',
  dim: 'var(--fb-label)',
  dot: 'var(--ink)',
  dotInk: 'var(--bg)',
  ring: 'var(--fb-ring)',      /* was rgba(20,17,12,.4) — unified with the board */
  open: 'var(--good)',
  mute: 'var(--bad)',
};

function el(tag, attrs) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

// voicing = { frets:[6], fingers:[6], barres:[{fret,from,to,finger}], base }
export function renderChordDiagram(container, voicing, { lefty = false } = {}) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}` });
  const frets = voicing.frets;
  const maxF = Math.max(0, ...frets);
  // window starts at 1 (nut shown) when everything fits in frets 1..5
  const base = maxF <= BOX_FRET_COUNT ? 1 : Math.min(...frets.filter(f => f > 0));

  const sx = s => PAD_L + (lefty ? 5 - s : s) * SW;      // string 0 (low E) at left; lefty mirrors
  const fy = f => PAD_T + (f - base + 0.5) * FH;

  // dark box behind the grid so the diagram reads as a piece of fretboard
  svg.append(el('rect', {
    x: PAD_L, y: PAD_T, width: 5 * SW, height: BOX_FRET_COUNT * FH,
    rx: 4, fill: C.box,
  }));

  // strings
  for (let s = 0; s < 6; s++) {
    svg.append(el('line', {
      x1: sx(s), y1: PAD_T, x2: sx(s), y2: PAD_T + BOX_FRET_COUNT * FH,
      stroke: C.string, 'stroke-width': 1 + (5 - s) * 0.3,
    }));
  }
  // frets — the top line becomes a solid nut bar when the window starts at 1
  for (let f = 0; f <= BOX_FRET_COUNT; f++) {
    const y = PAD_T + f * FH;
    if (f === 0 && base === 1) {
      svg.append(el('rect', {
        x: PAD_L - 2, y: y - 3, width: 5 * SW + 4, height: 7,
        rx: 2, fill: C.nut,
      }));
    } else {
      svg.append(el('line', {
        x1: PAD_L, y1: y, x2: PAD_L + 5 * SW, y2: y,
        stroke: C.fret, 'stroke-width': 2,
      }));
    }
  }
  if (base > 1) {
    const t = el('text', {
      x: PAD_L + 5 * SW + 8, y: PAD_T + FH * 0.5 + 4,
      fill: C.dim, 'font-size': 11, 'font-family': 'monospace',
    });
    t.textContent = `${base}fr`;
    svg.append(t);
  }

  // O / × above each string
  for (let s = 0; s < 6; s++) {
    const t = el('text', {
      x: sx(s), y: PAD_T - 10, 'text-anchor': 'middle', 'font-size': 13,
      'font-family': 'monospace',
      fill: frets[s] === 0 ? C.open : frets[s] < 0 ? C.mute : 'transparent',
    });
    t.textContent = frets[s] === 0 ? '○' : '×';
    svg.append(t);
  }

  // barres
  for (const b of voicing.barres || []) {
    if (b.fret < base || b.fret >= base + BOX_FRET_COUNT) continue;
    const x1 = sx(b.from), x2 = sx(b.to);
    const y = fy(b.fret);
    svg.append(el('rect', {
      x: Math.min(x1, x2) - 9, y: y - 9,
      width: Math.abs(x2 - x1) + 18, height: 18, rx: 9,
      fill: C.dot, stroke: C.ring, 'stroke-width': 1,
    }));
    if (b.finger) {
      const t = el('text', {
        x: (x1 + x2) / 2, y: y + 4, 'text-anchor': 'middle',
        'font-size': 11, 'font-family': 'monospace', fill: C.dotInk,
        'font-weight': 'bold',
      });
      t.textContent = b.finger;
      svg.append(t);
    }
  }

  // finger dots
  for (let s = 0; s < 6; s++) {
    const f = frets[s];
    if (f <= 0 || f < base || f >= base + BOX_FRET_COUNT) continue;
    // skip strings covered by a barre fill (dot drawn only at barre ends? —
    // standard diagrams show the barre bar only; keep dots for non-barre)
    const barred = (voicing.barres || []).some(b =>
      b.fret === f && s >= Math.min(b.from, b.to) && s <= Math.max(b.from, b.to));
    if (barred) continue;
    svg.append(el('circle', {
      cx: sx(s), cy: fy(f), r: 10, fill: C.dot,
      stroke: C.ring, 'stroke-width': 1,
    }));
    const fin = voicing.fingers?.[s];
    if (fin) {
      const t = el('text', {
        x: sx(s), y: fy(f) + 4, 'text-anchor': 'middle',
        'font-size': 11, 'font-family': 'monospace', fill: C.dotInk,
        'font-weight': 'bold',
      });
      t.textContent = fin;
      svg.append(t);
    }
  }
  // finger numbers along the bottom for barred strings? keep it clean.

  container.replaceChildren(svg);
  return svg;
}

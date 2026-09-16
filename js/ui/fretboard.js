// SVG fretboard. Two modes:
//   display  — setMarkers() paints note dots (chord tones etc.)
//   input    — user taps cells to build a shape; getShape() returns frets[]
// String 0 = low E drawn at the bottom (standard horizontal-board view).

import { STRINGS, STRING_NAMES } from '../theory/notes.js';

const NS = 'http://www.w3.org/2000/svg';
const FRETS_SHOWN = 15;
const FW = 62;            // fret width
const SH = 34;            // string spacing
const PAD_L = 46;         // room for string names / open-mute column
const PAD_T = 26;
const BOARD_W = FRETS_SHOWN * FW;
const W = PAD_L + BOARD_W + 20;
const H = PAD_T + 5 * SH + 26;
const INLAYS = [3, 5, 7, 9, 12];

// warm-dark palette — reads the custom properties in styles.css, so the
// drawing follows the theme instead of keeping parallel hex literals
const C = {
  woodA: 'var(--fb-wood-a)',   // fretboard top
  woodB: 'var(--fb-wood-b)',   // fretboard bottom
  edge: 'var(--fb-edge)',
  fret: 'var(--fb-fret)',      // fret wire
  inlay: 'var(--fb-inlay)',
  string: 'var(--fb-string)',
  nut: 'var(--ink)',
  label: 'var(--fb-label)',
  root: 'var(--accent)',
  tone: 'var(--ink)',
  dim: 'var(--fb-dim)',
  good: 'var(--good)',
  bad: 'var(--bad)',
  ink: 'var(--bg)',
  ring: 'var(--fb-ring)',
};

let svgUid = 0;   // unique gradient ids when two boards share a document

function el(tag, attrs) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

// x center of a fret cell: fret 0 is the open column, 1..N are fret cells.
function cellX(fret, lefty) {
  const i = lefty ? FRETS_SHOWN - fret : fret - 1;   // cell index after open col
  return PAD_L + i * FW + FW / 2;
}
function stringY(s) { return PAD_T + (5 - s) * SH; }

export function createFretboard(container, { interactive = false, lefty = false, onChange } = {}) {
  // Lefty mirrors the board: the nut and the open/mute column move to the
  // right edge, which needs extra room for the open rings and string names.
  const vw = W + (lefty ? 28 : 0);
  const svg = el('svg', { viewBox: `0 0 ${vw} ${H}` });
  const layerBase = el('g', {});
  const layerMarks = el('g', {});
  const layerInput = el('g', {});
  const layerHits = el('g', {});

  // wood body gradient (per-instance id — two boards can share a document)
  const woodId = `fb-wood-${++svgUid}`;
  const defs = el('defs', {});
  const grad = el('linearGradient', { id: woodId, x1: 0, y1: 0, x2: 0, y2: 1 });
  grad.append(
    el('stop', { offset: '0%', 'stop-color': C.woodA }),
    el('stop', { offset: '55%', 'stop-color': 'var(--fb-wood-mid)' }),
    el('stop', { offset: '100%', 'stop-color': C.woodB }),
  );
  defs.append(grad);
  svg.append(defs, layerBase, layerMarks, layerInput, layerHits);
  container.replaceChildren(svg);

  // nut / open column + frets. In lefty view the fret order mirrors, so the
  // nut sits at the right end and open-string markers hang off that side.
  const nutX = lefty ? PAD_L + BOARD_W : PAD_L;
  const openX = lefty ? nutX + 16 : nutX - 16;
  const nameX = lefty ? vw - 14 : 14;

  // board body
  layerBase.append(el('rect', {
    x: PAD_L, y: PAD_T - 5, width: BOARD_W, height: 5 * SH + 10,
    rx: 9, fill: `url(#${woodId})`, stroke: C.edge, 'stroke-width': 1.5,
  }));
  // nut
  layerBase.append(el('rect', {
    x: nutX - 3.5, y: PAD_T - 5, width: 7, height: 5 * SH + 10,
    rx: 2, fill: C.nut,
  }));
  for (let f = 0; f <= FRETS_SHOWN; f++) {
    const i = lefty ? FRETS_SHOWN - f : f;
    const x = PAD_L + i * FW;
    if (f > 0) layerBase.append(el('line', {
      x1: x, y1: PAD_T - 3, x2: x, y2: PAD_T + 5 * SH + 3,
      stroke: C.fret, 'stroke-width': f === FRETS_SHOWN ? 1 : 2,
    }));
    if (f > 0) {
      // number sits in the center of the fret's cell — cellX() already
      // mirrors for lefty, so labels stay on the correct side of the wire
      const t = el('text', {
        x: cellX(f, lefty), y: PAD_T + 5 * SH + 20, 'text-anchor': 'middle',
        fill: C.label, 'font-size': 11, 'font-family': 'monospace',
      });
      t.textContent = f;
      layerBase.append(t);
    }
  }
  for (const f of INLAYS) {
    const cx = cellX(f, lefty);
    if (f === 12) {
      // double dot, tucked into the gaps between the D/G and B/e pairs
      for (const k of [1.5, 3.5]) {
        layerBase.append(el('circle', {
          cx, cy: PAD_T + k * SH, r: 5.5, fill: C.inlay,
        }));
      }
    } else {
      layerBase.append(el('circle', {
        cx, cy: PAD_T + 5 * SH / 2, r: 6, fill: C.inlay,
      }));
    }
  }
  // strings span the whole board regardless of which end the nut is on
  for (let s = 0; s < 6; s++) {
    const y = stringY(s);
    layerBase.append(el('line', {
      x1: PAD_L, y1: y, x2: PAD_L + BOARD_W, y2: y,
      stroke: C.string, 'stroke-width': 1 + (5 - s) * 0.35,
    }));
    const name = el('text', {
      x: nameX, y: y + 4, 'text-anchor': 'middle', fill: C.label,
      'font-size': 12, 'font-family': 'monospace',
    });
    name.textContent = STRING_NAMES[s];
    layerBase.append(name);
  }

  // ----- state -----
  let markers = [];
  const shape = new Array(6).fill(null);   // null | -1 | 0 | fret

  function drawMarkers() {
    layerMarks.replaceChildren();
    for (const m of markers) {
      const cx = cellX(m.fret, lefty);
      const cy = stringY(m.string);
      const color = m.kind === 'root' ? C.root : m.kind === 'dim' ? C.dim : C.tone;
      if (m.fret === 0) {
        // open-string marker: ring off the nut side
        layerMarks.append(el('circle', {
          cx: openX, cy, r: 7.5, fill: 'none', stroke: color, 'stroke-width': 2.5,
        }));
        continue;
      }
      layerMarks.append(el('circle', {
        cx, cy, r: m.kind === 'dim' ? 9 : 11.5, fill: color,
        stroke: C.ring, 'stroke-width': 1.5,
      }));
      if (m.label) {
        const t = el('text', {
          x: cx, y: cy + 4, 'text-anchor': 'middle', 'font-size': 11,
          'font-family': 'monospace',
          fill: m.kind === 'root' ? 'var(--accent-ink)' : C.ink,
          'font-weight': 'bold',
        });
        t.textContent = m.label;
        layerMarks.append(t);
      }
    }
  }

  function drawShape() {
    layerInput.replaceChildren();
    for (let s = 0; s < 6; s++) {
      const f = shape[s];
      const y = stringY(s);
      if (f === null) continue;
      if (f === -1) {
        const t = el('text', {
          x: openX, y: y + 4, 'text-anchor': 'middle',
          fill: C.bad, 'font-size': 13, 'font-family': 'monospace',
        });
        t.textContent = '×';
        layerInput.append(t);
      } else if (f === 0) {
        layerInput.append(el('circle', {
          cx: openX, cy: y, r: 6.5, fill: 'none',
          stroke: C.good, 'stroke-width': 2.5,
        }));
      } else {
        layerInput.append(el('circle', {
          cx: cellX(f, lefty), cy: y, r: 11.5, fill: C.root,
          stroke: C.ring, 'stroke-width': 1.5,
        }));
      }
    }
  }

  if (interactive) {
    // open/mute column hit areas (beside the nut — right side when lefty).
    // The fb-* classes let CSS paint hover/press feedback without JS.
    for (let s = 0; s < 6; s++) {
      const r = el('rect', {
        x: lefty ? vw - 36 : 24, y: stringY(s) - SH / 2, width: 22, height: SH,
        fill: 'transparent', cursor: 'pointer', 'class': 'fb-hit fb-open',
      });
      r.addEventListener('click', () => {
        shape[s] = shape[s] === null ? 0 : shape[s] === 0 ? -1 : null;
        drawShape(); onChange?.(getShape());
      });
      layerHits.append(r);
      for (let f = 1; f <= FRETS_SHOWN; f++) {
        const cell = el('rect', {
          x: cellX(f, lefty) - FW / 2, y: stringY(s) - SH / 2,
          width: FW, height: SH, fill: 'transparent', cursor: 'pointer',
          'class': 'fb-hit fb-cell',
        });
        cell.addEventListener('click', () => {
          shape[s] = shape[s] === f ? null : f;
          drawShape(); onChange?.(getShape());
        });
        layerHits.append(cell);
      }
    }
  }

  function getShape() { return shape.map(f => (f === null ? -1 : f)); }
  // null means "unset" — for checking we treat unset as mute.

  return {
    setMarkers(m) { markers = m; drawMarkers(); },
    getShape,
    setShape(frets) {
      for (let s = 0; s < 6; s++) shape[s] = frets[s];
      drawShape();
    },
    clear() {
      shape.fill(null);
      if (interactive) { drawShape(); onChange?.(getShape()); }
    },
  };
}

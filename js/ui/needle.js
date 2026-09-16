// Tuner gauge: −50…+50 cents arc, needle, in-tune window (±5 cents).

const NS = 'http://www.w3.org/2000/svg';
const W = 320, H = 190;
const CX = 160, CY = 165, R = 120;

// warm-dark palette — reads the custom properties in styles.css
const C = {
  face: 'var(--gauge-face)',    // dial plate band behind the track
  track: 'var(--line)',
  band: 'var(--good)',          // in-tune window
  tickMinor: 'var(--gauge-tick-minor)',
  tick: 'var(--gauge-tick)',
  tick0: 'var(--ink)',
  label: 'var(--fb-label)',
  needle: 'var(--accent)',
  needleOff: 'var(--fb-dim)',
  pivot: 'var(--ink)',
  pivotInk: 'var(--bg)',
};

function el(tag, attrs) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}
const rad = d => (d - 90) * Math.PI / 180;
// cents -50..50 → angle -60..60 deg
const ang = c => -60 + (c + 50) * 1.2;

export function createGauge(container) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}` });

  const a0 = rad(-60), a1 = rad(60);
  const p = (r, a) => `${CX + r * Math.cos(a)},${CY + r * Math.sin(a)}`;

  // dial plate: a wide subdued band behind everything else
  svg.append(el('path', {
    d: `M ${p(R, a0)} A ${R} ${R} 0 0 1 ${p(R, a1)}`,
    fill: 'none', stroke: C.face, 'stroke-width': 34,
  }));
  // outer arc (the track the needle sweeps along)
  svg.append(el('path', {
    d: `M ${p(R, a0)} A ${R} ${R} 0 0 1 ${p(R, a1)}`,
    fill: 'none', stroke: C.track, 'stroke-width': 10, 'stroke-linecap': 'round',
  }));
  // in-tune band (±5c) — start at the −5 end so the sweep takes the short way
  svg.append(el('path', {
    d: `M ${p(R, rad(ang(-5)))} A ${R} ${R} 0 0 1 ${p(R, rad(ang(5)))}`,
    fill: 'none', stroke: C.band, 'stroke-width': 10,
  }));
  // minor ticks every 5c (skipping the major 10c positions)
  for (let c = -45; c <= 45; c += 10) {
    const a = rad(ang(c));
    const inner = R - 10;
    svg.append(el('line', {
      x1: CX + inner * Math.cos(a), y1: CY + inner * Math.sin(a),
      x2: CX + R * Math.cos(a), y2: CY + R * Math.sin(a),
      stroke: C.tickMinor, 'stroke-width': 1.5,
    }));
  }
  // major ticks every 10c
  for (let c = -50; c <= 50; c += 10) {
    const a = rad(ang(c));
    const inner = c === 0 ? R - 26 : R - 18;
    svg.append(el('line', {
      x1: CX + inner * Math.cos(a), y1: CY + inner * Math.sin(a),
      x2: CX + R * Math.cos(a), y2: CY + R * Math.sin(a),
      stroke: c === 0 ? C.tick0 : C.tick, 'stroke-width': c === 0 ? 3 : 2,
    }));
    if (c % 20 === 0) {
      const t = el('text', {
        x: CX + (R - 38) * Math.cos(a), y: CY + (R - 38) * Math.sin(a) + 4,
        'text-anchor': 'middle', fill: C.label, 'font-size': 10,
        'font-family': 'monospace',
      });
      t.textContent = (c > 0 ? '+' : '') + c;
      svg.append(t);
    }
  }
  // needle with a short counterweight tail below the pivot
  const needle = el('line', {
    x1: CX, y1: CY + 14, x2: CX, y2: CY - (R - 30),
    stroke: C.needle, 'stroke-width': 3, 'stroke-linecap': 'round',
  });
  svg.append(needle);
  // pivot: ring + dark hub
  svg.append(el('circle', { cx: CX, cy: CY, r: 9, fill: C.pivot }));
  svg.append(el('circle', { cx: CX, cy: CY, r: 3.5, fill: C.pivotInk }));

  container.replaceChildren(svg);

  return {
    set(cents) {
      if (cents === null || cents === undefined) {
        needle.setAttribute('transform', `rotate(${ang(0)} ${CX} ${CY})`);
        needle.setAttribute('stroke', C.needleOff);
        return;
      }
      const c = Math.max(-50, Math.min(50, cents));
      needle.setAttribute('transform', `rotate(${ang(c)} ${CX} ${CY})`);
      needle.setAttribute('stroke', Math.abs(cents) <= 5 ? C.band : C.needle);
    },
  };
}

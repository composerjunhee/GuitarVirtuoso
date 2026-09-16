// Voicing engine: enumerate playable fretboard shapes for a chord, assign
// fingers, rank, return the best few. Runs lazily per chord and caches.
//
// Voicing = { frets:[-1|0..24 ×6] (low E→high e), fingers:[0..4 ×6],
//             barres:[{fret, from, to, finger}], base, score }
// -1 = muted, 0 = open.

import { STRINGS, midiToPc } from './notes.js';
import { chordPcs, bassPc } from './chords.js';
import { CURATED } from '../data/curated.js';

const MAX_FRET = 15;
const SPAN = 4;          // max fretted-window width (minFret..minFret+3)
const TOP_N = 6;

const cache = new Map();

export function voicingsFor(chord) {
  const key = `${chord.root}|${chord.quality}|${chord.bass ?? ''}`;
  if (cache.has(key)) return cache.get(key);
  const pcs = chordPcs(chord.root, chord.quality);
  const want = bassPc(chord);
  const fifthPc = (chord.root + 7) % 12;
  const out = [];

  // One window per anchor fret; open strings always allowed.
  for (let anchor = 0; anchor <= MAX_FRET - SPAN; anchor++) {
    const lo = Math.max(anchor, 1);
    const hi = anchor + SPAN - 1;
    // candidate frets per string, plus the pcs each string can still supply
    const cand = STRINGS.map(open => {
      const c = [-1];
      if (pcs.has(midiToPc(open))) c.push(0);
      for (let f = lo; f <= hi; f++) {
        if (pcs.has(midiToPc(open + f))) c.push(f);
      }
      return c;
    });
    const candPcs = cand.map((list, s) =>
      new Set(list.filter(f => f >= 0).map(f => midiToPc(STRINGS[s] + f))));
    // suffix union: pcs coverable by strings s..5
    const suffix = new Array(7);
    suffix[6] = new Set();
    for (let s = 5; s >= 0; s--) {
      suffix[s] = new Set([...suffix[s + 1], ...candPcs[s]]);
    }
    const frets = new Array(6);
    const got = new Set();
    let found = 0;
    walk(0);
    function walk(s) {
      if (found > 80) return;              // enough candidates from this window
      if (s === 6) {
        const v = evaluate(frets.slice(), pcs, want, fifthPc);
        if (v) { out.push(v); found++; }
        return;
      }
      // prune: pcs not yet covered and not coverable by strings s..5
      // (only the chord's own fifth may be omitted, and only in 4+ note chords)
      for (const pc of pcs) {
        if (!got.has(pc) && !suffix[s].has(pc)) {
          if (!(pcs.size > 3 && pc === fifthPc)) return;
        }
      }
      for (let i = 0; i < cand[s].length; i++) {
        const f = cand[s][i];
        frets[s] = f;
        let added = false;
        if (f >= 0) {
          const pc = midiToPc(STRINGS[s] + f);
          if (!got.has(pc)) { got.add(pc); added = true; }
        }
        walk(s + 1);
        if (added) got.delete(midiToPc(STRINGS[s] + f));
      }
    }
  }

  let ranked = rank(out).slice(0, TOP_N);
  // Curated canonical shapes go first — but they're root position, so only
  // when no slash bass is requested. Collect-then-prepend (unshifting one
  // at a time would reverse the curated order), and drop generated copies
  // of the same shapes so a curated entry always wins its listed rank.
  if (chord.bass === null || chord.bass === undefined || chord.bass === chord.root) {
    const cur = CURATED[`${chord.root}|${chord.quality}|`];
    if (cur) {
      const heads = [];
      for (const v of cur) {
        const full = analyze(v.frets, pcs, fifthPc);
        if (full) heads.push(full);
      }
      const seen = new Set(heads.map(h => h.frets.join(',')));
      ranked = [...heads, ...ranked.filter(r => !seen.has(r.frets.join(',')))];
    }
  }
  cache.set(key, ranked);
  return ranked;
}

// Evaluate a candidate fret set; returns voicing or null.
function evaluate(frets, pcs, wantPc, fifthPc) {
  const sounded = [];
  for (let s = 0; s < 6; s++) {
    if (frets[s] >= 0) sounded.push({ s, f: frets[s], pc: midiToPc(STRINGS[s] + frets[s]) });
  }
  if (sounded.length < 3) return null;                     // need ≥3 notes
  const got = new Set(sounded.map(n => n.pc));
  // every required pc must sound — only the root's own fifth may be omitted,
  // and only when the chord has 4+ distinct tones
  for (const pc of pcs) {
    if (!got.has(pc) && !(pcs.size > 3 && pc === fifthPc)) return null;
  }
  // fingering
  const f = assignFingers(frets);
  if (!f) return null;
  const muted = frets.filter(x => x < 0).length;
  const innerMute = frets.slice(1, 5).some(x => x < 0) && frets[0] >= 0 && frets[5] >= 0;
  if (innerMute) return null;                              // unstrummable
  const frettedFs = sounded.filter(n => n.f > 0).map(n => n.f);
  const minF = frettedFs.length ? Math.min(...frettedFs) : 0;
  const maxF = frettedFs.length ? Math.max(...frettedFs) : 0;
  const bassNote = sounded[0];                             // lowest sounded string
  let score = 100;
  if (bassNote.pc === wantPc) score += 40;                 // right bass
  else if (sounded[1] && sounded[1].pc === wantPc) score += 10;
  else score -= 30;                                        // wrong bass
  score += sounded.filter(n => n.f === 0).length * 6;      // open strings
  score -= muted * 8;
  score -= (maxF - minF) * 2;                              // stretch
  score -= minF * 1.5;                                     // prefer low position
  if (sounded.length === 6) score += 6;                    // full strum
  return { frets, fingers: f.fingers, barres: f.barres, base: minF, score };
}

// Assign fingers to fretted notes. Returns {fingers:[6], barres:[...]} or null.
// Model: lowest fretted position may barre (≥2 strings); remaining notes each
// take one finger; total ≤4; span ≤4 frets.
function assignFingers(frets) {
  const fretted = [];
  for (let s = 0; s < 6; s++) if (frets[s] > 0) fretted.push({ s, f: frets[s] });
  const fingers = [0, 0, 0, 0, 0, 0];
  const barres = [];
  if (!fretted.length) return { fingers, barres };
  const minF = Math.min(...fretted.map(n => n.f));
  const maxF = Math.max(...fretted.map(n => n.f));
  if (maxF - minF >= SPAN) return null;
  const atMin = fretted.filter(n => n.f === minF);
  let used;
  if (atMin.length >= 2) {
    // index-finger barre across the min-fret strings
    const from = Math.min(...atMin.map(n => n.s));
    const to = Math.max(...atMin.map(n => n.s));
    // barre must cover every string between from..to that sounds at minF
    // (strings in between sounding at other frets are fine — fingered over barre)
    barres.push({ fret: minF, from, to, finger: 1 });
    for (const n of atMin) fingers[n.s] = 1;
    const rest = fretted.filter(n => n.f !== minF);
    if (rest.length > 3) return null;
    rest.sort((a, b) => a.f - b.f || a.s - b.s);
    // fingers 2..4 by ascending fret
    const byFret = [...new Set(rest.map(n => n.f))].sort((a, b) => a - b);
    if (byFret.length > 3) return null;
    for (const n of rest) fingers[n.s] = 2 + byFret.indexOf(n.f);
    used = 1 + rest.length;
  } else {
    const byFret = [...new Set(fretted.map(n => n.f))].sort((a, b) => a - b);
    if (byFret.length > 4) return null;
    for (const n of fretted) fingers[n.s] = 1 + byFret.indexOf(n.f);
    used = fretted.length;
    // duplicate fingers on same fret across strings without barre is fine only
    // if same finger row — approximate: same-fret pairs share the finger number
    // but still count as one hand position; keep used = distinct (finger,fret).
    used = new Set(fretted.map(n => `${fingers[n.s]}@${n.f}`)).size;
  }
  if (used > 4) return null;
  return { fingers, barres };
}

function rank(list) {
  // dedupe identical fret sets, then sort by score desc.
  const seen = new Map();
  for (const v of list) {
    const k = v.frets.join(',');
    if (!seen.has(k) || seen.get(k).score < v.score) seen.set(k, v);
  }
  return [...seen.values()].sort((a, b) => b.score - a.score);
}

// Recompute fingers for a curated shape — but only if it actually covers
// the chord (guards against a bad entry in the data table).
function analyze(frets, pcs, fifthPc) {
  const sounded = new Set();
  for (let s = 0; s < 6; s++) {
    if (frets[s] >= 0) sounded.add(midiToPc(STRINGS[s] + frets[s]));
  }
  for (const pc of pcs) {
    if (!sounded.has(pc) && !(pcs.size > 3 && pc === fifthPc)) return null;
  }
  const f = assignFingers(frets);
  const pos = frets.filter(x => x > 0);
  return {
    frets: frets.slice(),
    fingers: f ? f.fingers : [0, 0, 0, 0, 0, 0],
    barres: f ? f.barres : [],
    base: pos.length ? Math.min(...pos) : 0,
    score: 1000,
    curated: true,
  };
}

export function voicingMidi(voicing) {
  return voicing.frets.map((f, s) => (f < 0 ? null : STRINGS[s] + f));
}

export function voicingPcs(voicing) {
  return new Set(voicing.frets
    .map((f, s) => (f < 0 ? null : midiToPc(STRINGS[s] + f)))
    .filter(x => x !== null));
}

// ---------- voice leading ----------

// Hand-movement distance between two voicings: the position shift dominates
// (×3), then per-string fret movement; a muted↔sounded string costs 2.
function voicingDist(a, b) {
  let d = Math.abs(a.base - b.base) * 3;
  for (let s = 0; s < 6; s++) {
    const fa = a.frets[s], fb = b.frets[s];
    if (fa < 0 && fb < 0) continue;
    if (fa < 0 || fb < 0) { d += 2; continue; }
    d += Math.abs(fa - fb);
  }
  return d;
}

// Cost of moving from voicing `a` to voicing `b` (lower is better).
function moveCost(a, b) {
  let c = voicingDist(a, b);
  // open-string continuity: when the previous shape rings open strings in a
  // low position, prefer candidates that keep those same strings open
  if (a.base <= 3) {
    for (let s = 0; s < 6; s++) {
      if (a.frets[s] === 0 && b.frets[s] === 0) c -= 1.5;
    }
  }
  // mild pull toward the shape's own rating so a marginally nearer but bad
  // grip never wins (capped — curated shapes carry score 1000)
  c -= Math.min(b.score, 140) * 0.08;
  return c;
}

/**
 * Pick one voicing per chord minimizing hand movement along the progression.
 * @param {Array<{root:number, quality:string, bass?:number|null}>} chords
 * @returns {Array<object|null>} voicing per chord (same shape as
 *          voicingsFor()[i]: {frets, fingers, barres, base, score}); null if
 *          that chord has no voicings.
 *
 * Method: the progression loops, so this is a small cyclic DP — anchor each
 * candidate of the first voiced chord, run a forward DP down the chain
 * accumulating moveCost(), and close with the last→anchor hop. ≤ ~10
 * candidates × ≤ 12 chords keeps it trivial. Chords with no voicings return
 * null and are skipped in the chain (the hop bridges over them).
 */
export function voiceLead(chords) {
  const out = new Array(chords.length).fill(null);
  if (!chords.length) return out;
  const cands = chords.map(c => voicingsFor(c));
  const idx = [];                    // indices of chords that have voicings
  for (let i = 0; i < chords.length; i++) if (cands[i].length) idx.push(i);
  const m = idx.length;
  if (!m) return out;
  if (m === 1) { out[idx[0]] = cands[idx[0]][0]; return out; }

  let bestTotal = Infinity, bestPick = null;
  for (const anchor of cands[idx[0]]) {
    // cols[k][j] = min cost arriving at candidate j of voiced chord k,
    // given this anchor at voiced chord 0; pars[k][j] = parent index
    const cols = [null], pars = [null];
    cols[1] = cands[idx[1]].map(v => moveCost(anchor, v));
    pars[1] = cands[idx[1]].map(() => -1);   // parent is the anchor
    for (let k = 2; k < m; k++) {
      const col = [], par = [];
      for (const v of cands[idx[k]]) {
        let lo = Infinity, li = 0;
        cands[idx[k - 1]].forEach((p, j) => {
          const c = cols[k - 1][j] + moveCost(p, v);
          if (c < lo) { lo = c; li = j; }
        });
        col.push(lo); par.push(li);
      }
      cols[k] = col; pars[k] = par;
    }
    // close the loop: last voiced chord back to the anchor
    let tail = Infinity, tj = 0;
    cands[idx[m - 1]].forEach((v, j) => {
      const c = cols[m - 1][j] + moveCost(v, anchor);
      if (c < tail) { tail = c; tj = j; }
    });
    if (tail < bestTotal) {
      bestTotal = tail;
      const pick = new Array(m);
      pick[0] = anchor;
      let j = tj;
      for (let k = m - 1; k >= 2; k--) { pick[k] = cands[idx[k]][j]; j = pars[k][j]; }
      pick[1] = cands[idx[1]][j];
      bestPick = pick;
    }
  }
  for (let k = 0; k < m; k++) out[idx[k]] = bestPick[k];
  return out;
}

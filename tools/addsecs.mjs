// One-shot: inject `sections` into every entry of standards.js.
// bar indices = display cell indices (stock data: cell == bar, half pairs
// count as ONE bar). Validated against a barCells replica before writing.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { STANDARDS } from '../js/data/standards.js';

const FILE = fileURLToPath(new URL('../js/data/standards.js', import.meta.url));
const NAMES = new Set(['intro', 'verse', 'pre', 'chorus', 'bridge',
  'interlude', 'solo', 'outro', 'tag', 'refrain', 'head', 'vamp',
  'A', 'B', 'C', 'D']);

const SECS = {
  // ---------- jazz ----------
  'autumn-leaves': [[0, 'A'], [8, 'A'], [16, 'B'], [24, 'C']],
  'blue-bossa': [[0, 'A'], [8, 'B']],
  'all-the-things-you-are': [[0, 'A'], [8, 'A'], [16, 'B'], [24, 'A']],
  'satin-doll': [[0, 'A'], [8, 'A'], [16, 'B'], [24, 'A']],
  'take-the-a-train': [[0, 'A'], [8, 'A'], [16, 'B'], [24, 'A']],
  'blue-monk': [[0, 'head']],
  'tenor-madness': [[0, 'head']],
  'cantaloupe-island': [[0, 'A'], [4, 'B'], [8, 'C'], [12, 'A']],
  'summertime': [[0, 'A'], [4, 'B'], [8, 'A'], [12, 'C']],
  'fly-me-to-the-moon': [[0, 'A'], [8, 'A'], [16, 'B'], [24, 'A']],
  'so-what': [[0, 'A'], [8, 'A'], [16, 'B'], [24, 'A']],
  'mr-pc': [[0, 'head']],
  'all-of-me': [[0, 'A'], [8, 'B'], [16, 'A'], [24, 'C']],
  'misty': [[0, 'A'], [8, 'A'], [16, 'B'], [24, 'A']],
  'solar': [[0, 'A']],
  'stella-by-starlight': [[0, 'A'], [16, 'B'], [24, 'C']],
  'there-will-never-be-another-you': [[0, 'A'], [8, 'B'], [16, 'A'], [24, 'C']],
  'blue-in-green': [[0, 'A']],
  'there-is-no-greater-love': [[0, 'A'], [8, 'A'], [16, 'B'], [24, 'A']],
  'freddie-freeloader': [[0, 'head']],
  'round-midnight': [[0, 'A'], [9, 'A'], [18, 'B'], [26, 'A']],
  'night-and-day': [[0, 'A'], [16, 'A'], [32, 'B']],
  'body-and-soul': [[0, 'A'], [8, 'A'], [16, 'B'], [24, 'A']],
  'in-a-sentimental-mood': [[0, 'A'], [8, 'A'], [16, 'B'], [24, 'A']],
  'softly-as-in-a-morning-sunrise': [[0, 'A'], [8, 'A'], [16, 'B'], [24, 'A']],
  'yesterdays': [[0, 'A'], [16, 'A']],
  'cherokee': [[0, 'A'], [16, 'A'], [32, 'B'], [48, 'A']],
  'my-funny-valentine': [[0, 'A'], [8, 'A']],
  'fever': [[0, 'A'], [8, 'A']],
  'blue-moon': [[0, 'A']],
  // ---------- classical ----------
  'canon-in-d': [[0, 'A'], [8, 'A']],
  'fur-elise': [[0, 'A'], [8, 'B'], [14, 'A']],
  'minuet-in-g': [[0, 'A'], [8, 'A'], [16, 'B']],
  // ---------- pop ----------
  'let-it-be': [[0, 'verse'], [8, 'chorus']],
  'stand-by-me': [[0, 'verse'], [8, 'chorus']],
  'hey-jude': [[0, 'verse'], [8, 'outro']],
  'no-woman-no-cry': [[0, 'verse']],
  'yesterday': [[0, 'verse'], [7, 'bridge'], [17, 'verse']],
  'africa': [[0, 'verse'], [12, 'chorus']],
  'someone-like-you': [[0, 'verse'], [8, 'chorus']],
  'let-her-go': [[0, 'verse'], [8, 'chorus']],
  'riptide': [[0, 'verse']],
  'perfect': [[0, 'verse'], [8, 'chorus']],
  'thinking-out-loud': [[0, 'verse'], [8, 'chorus']],
  'counting-stars': [[0, 'verse'], [8, 'chorus']],
  'viva-la-vida': [[0, 'verse'], [8, 'chorus']],
  'chasing-cars': [[0, 'verse']],
  'im-yours': [[0, 'verse'], [8, 'chorus']],
  'hey-soul-sister': [[0, 'verse'], [8, 'chorus']],
  'just-the-way-you-are': [[0, 'verse'], [8, 'chorus']],
  'rolling-in-the-deep': [[0, 'verse'], [4, 'chorus']],
  'take-on-me': [[0, 'chorus']],
  'dont-stop-believin': [[0, 'verse'], [8, 'chorus']],
  'with-or-without-you': [[0, 'verse'], [8, 'chorus']],
  'use-somebody': [[0, 'verse'], [12, 'tag']],
  'shallow': [[0, 'verse'], [8, 'chorus']],
  'drivers-license': [[0, 'verse'], [8, 'chorus'], [13, 'bridge']],
  'titanium': [[0, 'verse'], [8, 'chorus']],
  'halo': [[0, 'verse'], [8, 'chorus']],
  'someone-you-loved': [[0, 'verse'], [8, 'chorus']],
  'hey-there-delilah': [[0, 'verse']],
  // ---------- kpop ----------
  'through-the-night': [[0, 'verse'], [8, 'chorus'], [16, 'outro']],
  'spring-day': [[0, 'verse'], [8, 'pre'], [12, 'chorus']],
  'love-scenario': [[0, 'verse'], [8, 'chorus']],
  'dont-worry-my-dear': [[0, 'verse'], [8, 'refrain']],
  'snow-flower': [[0, 'verse'], [8, 'chorus']],
  'haru-haru': [[0, 'verse'], [8, 'chorus']],
  'lies': [[0, 'verse'], [8, 'chorus']],
  'if-it-is-you': [[0, 'verse'], [8, 'chorus']],
  'cherry-blossom-ending': [[0, 'verse'], [8, 'chorus']],
  // ---------- rock ----------
  'hotel-california': [[0, 'verse']],
  'house-of-the-rising-sun': [[0, 'verse']],
  'knockin-on-heavens-door': [[0, 'verse'], [8, 'chorus']],
  'zombie': [[0, 'verse'], [8, 'chorus']],
  'wonderwall': [[0, 'verse'], [8, 'chorus']],
  'creep': [[0, 'verse'], [8, 'chorus']],
  'wish-you-were-here': [[0, 'intro'], [10, 'verse']],
  'boulevard-of-broken-dreams': [[0, 'verse'], [8, 'chorus']],
  'good-riddance': [[0, 'verse'], [8, 'chorus']],
  'numb': [[0, 'verse'], [8, 'chorus']],
  'every-breath-you-take': [[0, 'verse']],
  'nothing-else-matters': [[0, 'verse'], [8, 'refrain']],
  'seven-nation-army': [[0, 'verse']],
  'come-as-you-are': [[0, 'verse']],
  'californication': [[0, 'verse'], [8, 'chorus']],
  // ---------- blues ----------
  'sweet-home-chicago': [[0, 'verse']],
  'johnny-b-goode': [[0, 'verse']],
  'the-thrill-is-gone': [[0, 'verse']],
  'hit-the-road-jack': [[0, 'verse']],
  'aint-no-sunshine': [[0, 'verse']],
  'pride-and-joy': [[0, 'verse']],
  // ---------- latin ----------
  'girl-from-ipanema': [[0, 'A'], [8, 'A'], [16, 'B'], [32, 'A']],
  'wave': [[0, 'A'], [12, 'A'], [24, 'B'], [32, 'A']],
  'recordame': [[0, 'A'], [8, 'B']],
  // ---------- folk ----------
  'hallelujah': [[0, 'verse'], [8, 'pre'], [16, 'chorus']],
  'blowin-in-the-wind': [[0, 'verse'], [24, 'refrain']],
  'country-roads': [[0, 'chorus']],
  'greensleeves': [[0, 'verse'], [8, 'refrain']],
  'arirang': [[0, 'verse']],
  'wagon-wheel': [[0, 'verse'], [8, 'chorus']],
  'jolene': [[0, 'verse']],
  'ring-of-fire': [[0, 'verse']],
  'hurt': [[0, 'verse'], [8, 'chorus']],
  'you-are-my-sunshine': [[0, 'verse']],
  'falling-slowly': [[0, 'verse'], [8, 'bridge'], [16, 'chorus'],
    [24, 'interlude'], [28, 'bridge'], [36, 'chorus'], [44, 'outro']],
};

// --- barCells replica (slot = 4 beats; half = 2; beats = explicit) ---
function barCells(song) {
  const cells = [];
  let cur = null, sum = 0;
  song.bars.forEach((b, i) => {
    const w = b.beats || (b.half ? 2 : 4);
    if (!cur || sum + w > 4) { cur = { slots: [] }; cells.push(cur); sum = 0; }
    cur.slots.push(i);
    sum += w;
  });
  return cells;
}

// --- validate the map ---
const problems = [];
for (const s of STANDARDS) {
  const secs = SECS[s.id];
  if (!secs) { problems.push(`${s.id}: no section map`); continue; }
  const n = barCells(s).length;
  secs.forEach(([bar, name], i) => {
    if (!Number.isInteger(bar) || bar < 0 || bar >= n)
      problems.push(`${s.id}: bar ${bar} out of range (cells=${n})`);
    if (!NAMES.has(name)) problems.push(`${s.id}: bad name ${name}`);
    if (i && bar <= secs[i - 1][0])
      problems.push(`${s.id}: not sorted at index ${i}`);
  });
}
if (problems.length) { console.log(problems.join('\n')); process.exit(1); }

// --- format the sections array ---
function fmt(secs) {
  const items = secs.map(([bar, name]) => `{ bar: ${bar}, name: '${name}' }`);
  const one = `    sections: [${items.join(', ')}],`;
  if (one.length <= 84) return one;
  const lines = ['    sections: ['];
  let cur = '      ';
  items.forEach((it, i) => {
    const piece = it + (i < items.length - 1 ? ', ' : ',');
    if (cur.length > 7 && cur.length + piece.length > 78) {
      lines.push(cur); cur = '      ';
    }
    cur += piece;
  });
  lines.push(cur, '    ],');
  return lines.join('\n');
}

// --- inject ---
let src = fs.readFileSync(FILE, 'utf8');
for (const [id, secs] of Object.entries(SECS)) {
  const anchor = `id: '${id}'`;
  const ai = src.indexOf(anchor);
  if (ai < 0) throw new Error('anchor not found: ' + id);
  const close = src.indexOf('\n  },', ai);   // entry's closing brace
  if (close < 0) throw new Error('no close for ' + id);
  src = src.slice(0, close) + '\n' + fmt(secs) + src.slice(close);
}
fs.writeFileSync(FILE, src);
console.log(`injected sections into ${Object.keys(SECS).length} entries`);

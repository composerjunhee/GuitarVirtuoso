// Ear training screen. Three drills:
//   quality — hear a chord, pick its quality (maj/min/7/maj7/m7/m7♭5/sus4…)
//   root    — hear a chord of a fixed quality, pick the root pc
//   play    — hear a chord, play the same one on a real guitar (mic-verified,
//             same ≥4-of-6 poll gate as practice.js)
// All DOM is built here inside #earBody; strings are a module-local {ko,en}
// table keyed by getLang() (i18n.js is shared and not ours to edit).

import { QUALITIES, QUALITY_ORDER, makeChord, chordSymbol, requiredPcs, bassPc }
  from '../theory/chords.js';
import { pcName } from '../theory/notes.js';
import { voicingsFor } from '../theory/voicings.js';
import { segRow, rootPicker, groupedChips, QUALITY_GROUPS, showBanner }
  from '../ui/components.js';
import { mic } from '../audio/input.js';
import { profileFromSpectrum, matchChord } from '../audio/chordDetect.js';
import { playVoicing } from '../audio/pluck.js';
import { audioCtx } from '../audio/engine.js';
import { t, getLang, onLangChange } from '../i18n.js';
import { settings, recordAttempt } from '../state.js';

const STR = {
  ko: {
    drill: '드릴',
    dQuality: '성격 맞히기',
    dRoot: '루트 맞히기',
    dPlay: '따라 연주',
    pool: '코드 풀',
    fixedQ: '고정 코드',
    hintQuality: '코드를 듣고 성격(메이저/마이너/세븐스…)을 골라 보세요.',
    hintRoot: '고정된 성격의 코드를 듣고 루트를 골라 보세요.',
    hintPlay: '들은 코드를 기타로 똑같이 연주해 보세요. 마이크가 확인합니다.',
    start: '시작',
    end: '끝내기',
    replay: '다시 듣기',
    reveal: '정답 보기',
    next: '다음',
    whichQ: '어떤 성격일까요?',
    whichR: '루트는 무엇일까요?',
    playIt: '같은 코드를 연주하세요',
    listening: '듣는 중…',
    correct: '정답!',
    wrong: '오답',
    streak: '연속',
    results: '결과',
    accuracy: '정확도',
    bestStreak: '최고 연속',
    missed: '틀린 코드',
    again: '다시 하기',
    needTwo: '코드 풀에서 2개 이상 선택하세요.',
    needOne: '코드 풀에서 1개 이상 선택하세요.',
    micDenied: '마이크 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.',
    micFailed: '마이크를 열 수 없습니다.',
    deadString: '{n}번 줄',
  },
  en: {
    drill: 'Drill',
    dQuality: 'Quality ID',
    dRoot: 'Root ID',
    dPlay: 'Play it back',
    pool: 'Chord pool',
    fixedQ: 'Fixed quality',
    hintQuality: 'Hear a chord and pick its quality.',
    hintRoot: 'Hear a chord of a fixed quality and pick its root.',
    hintPlay: 'Hear a chord, then play the same one on your guitar — mic-verified.',
    start: 'Start',
    end: 'End',
    replay: 'Replay',
    reveal: 'Reveal',
    next: 'Next',
    whichQ: 'Which quality?',
    whichR: 'Which root?',
    playIt: 'Play the same chord',
    listening: 'Listening…',
    correct: 'Correct!',
    wrong: 'Wrong',
    streak: 'Streak',
    results: 'Results',
    accuracy: 'Accuracy',
    bestStreak: 'Best streak',
    missed: 'Missed',
    again: 'Again',
    needTwo: 'Pick at least 2 qualities for the pool.',
    needOne: 'Pick at least 1 quality for the pool.',
    micDenied: 'Mic permission denied. Allow it in browser settings.',
    micFailed: 'Could not open the microphone.',
    deadString: 'string {n}',
  },
};

const ROUNDS = 10;
const DEFAULT_POOL = ['', 'm', '7', 'maj7', 'm7', 'm7b5', 'sus4'];

const setup = { type: 'quality', pool: new Set(DEFAULT_POOL), fixedQ: '' };

let body = null;                 // #earBody
let panel = 'setup';             // 'setup' | 'run' | 'result'
let session = null;              // {type, round, results, streak, best, chord, voicing, sym, picked, resolved, done, t0, lastKey}
let pollTimer = null;
let advanceTimer = null;
let voteRing = [];               // sliding window of recent match results
let seenOnset = 0;               // last onset timestamp the vote consumed

const s = k => STR[getLang()]?.[k] ?? STR.en[k] ?? k;
const opts = () => ({ flat: settings.flat, lang: getLang() });
const q = id => body.querySelector('#' + id);
const randInt = n => Math.floor(Math.random() * n);
const pick = arr => arr[randInt(arr.length)];

// ---------- DOM ----------

function render() {
  body.innerHTML = `
    <div id="earSetup" class="setup-card">
      <div class="chip-row"><span class="row-label" data-s="drill"></span>
        <span id="earDrill" class="seg"></span></div>
      <div id="earPoolRow"><span class="row-label" data-s="pool"></span>
        <div id="earPool"></div></div>
      <div id="earFixedRow" hidden>
        <span class="row-label" data-s="fixedQ"></span>
        <div id="earFixed"></div></div>
      <p class="hint" id="earHint"></p>
      <button id="earStart" class="primary big" data-s="start"></button>
    </div>
    <div id="earRun" class="setup-card" hidden>
      <div class="run-top">
        <span id="earProgress" class="mono"></span>
        <span><span id="earScore" class="mono"></span>&ensp;<span id="earStreak" class="mono"></span></span>
        <button id="earEnd" class="ghost" data-s="end"></button>
      </div>
      <div class="run-bar" aria-hidden="true"><i></i></div>
      <div class="run-body">
        <h2 id="earReveal" class="chord-title huge"></h2>
        <div id="earPrompt" class="feedback"></div>
        <div id="earAnswers" class="chip-row wrap center"></div>
        <div id="earHeard" class="heard"></div>
        <div id="earFeedback" class="feedback"></div>
        <div class="row" style="justify-content:center">
          <button id="earReplay" class="ghost" data-s="replay"></button>
          <button id="earGiveup" class="ghost" data-s="reveal"></button>
          <button id="earNext" class="primary" data-s="next" hidden></button>
        </div>
      </div>
    </div>
    <div id="earResult" class="setup-card" hidden>
      <h2 data-s="results"></h2>
      <div id="earResultBody" style="font-family:var(--mono);font-size:14px;line-height:1.9"></div>
      <button id="earAgain" class="primary big" data-s="again"></button>
    </div>`;
  wire();
  fillStrings();
  renderSetupRows();
  if (session && !session.done && session.round > 0) renderRound();
  showPanel(panel);
}

function wire() {
  q('earStart').addEventListener('click', startSession);
  q('earEnd').addEventListener('click', endSession);
  q('earAgain').addEventListener('click', () => { session = null; showPanel('setup'); });
  q('earReplay').addEventListener('click', playCurrent);
  q('earNext').addEventListener('click', () => { clearTimeout(advanceTimer); nextRound(); });
  q('earGiveup').addEventListener('click', () => resolve(false, null));
}

function fillStrings() {
  body.querySelectorAll('[data-s]').forEach(el => { el.textContent = s(el.dataset.s); });
}

function showPanel(p) {
  panel = p;
  if (!body) return;
  q('earSetup').hidden = p !== 'setup';
  q('earRun').hidden = p !== 'run';
  q('earResult').hidden = p !== 'result';
}

// ---------- setup ----------

function renderSetupRows() {
  segRow(q('earDrill'), [
    { id: 'quality', label: s('dQuality') },
    { id: 'root', label: s('dRoot') },
    { id: 'play', label: s('dPlay') },
  ], setup.type, id => { setup.type = id; renderSetupRows(); });

  // quality families, shared with the library picker
  const groups = QUALITY_GROUPS.map(g => ({
    label: t(g.key),
    items: g.qs.map(qk => ({ id: qk, label: QUALITIES[qk].label })),
  }));

  // chord pool: multi-select quality chips, grouped by family
  groupedChips(q('earPool'), groups, setup.pool,
    qk => { if (setup.pool.has(qk)) setup.pool.delete(qk); else setup.pool.add(qk); },
    { multi: true });

  // root drill: single fixed quality, same grouping
  groupedChips(q('earFixed'), groups, setup.fixedQ, id => { setup.fixedQ = id; });

  q('earPoolRow').hidden = setup.type === 'root';
  q('earFixedRow').hidden = setup.type !== 'root';
  q('earHint').textContent =
    s(setup.type === 'quality' ? 'hintQuality'
      : setup.type === 'root' ? 'hintRoot' : 'hintPlay');
}

// ---------- session ----------

async function startSession() {
  audioCtx();                    // create/resume inside the click gesture
  if (setup.type === 'quality' && setup.pool.size < 2) {
    showBanner(s('needTwo'), 4000, 'info'); return;
  }
  if (setup.type === 'play' && setup.pool.size < 1) {
    showBanner(s('needOne'), 4000, 'info'); return;
  }
  if (setup.type === 'play') {
    try { await mic.start(); }
    catch (e) {
      showBanner(e && e.name === 'NotAllowedError' ? s('micDenied') : s('micFailed'));
      return;
    }
    // user may have left the tab while getUserMedia was pending
    if (!document.getElementById('screen-ear').classList.contains('active')) {
      mic.stop(); return;
    }
  }
  session = {
    type: setup.type, round: 0, results: [], streak: 0, best: 0,
    chord: null, sym: '', picked: null, resolved: false, done: false,
    t0: 0, lastKey: null,
  };
  showPanel('run');
  nextRound();
}

function nextRound() {
  if (!session || session.done) return;
  if (session.round >= ROUNDS) { finish(); return; }
  session.round++;
  session.resolved = false;
  session.picked = null;
  voteRing = [];
  session.chord = pickChord();
  // the reference shape doubles as the mic template in the play drill
  session.voicing = voicingsFor(session.chord)[0] || null;
  // chord symbols stay Latin in every UI language (same convention as
  // library.js / the practice deck keys)
  session.sym = chordSymbol(session.chord, { flat: settings.flat });
  session.t0 = performance.now();
  renderRound();
  playCurrent();
  if (session.type === 'play') startPoll();
}

function pickChord() {
  let chord, key;
  do {
    const qk = session.type === 'root' ? setup.fixedQ : pick([...setup.pool]);
    chord = makeChord(randInt(12), qk);
    key = `${chord.root}|${qk}`;
  } while (key === session.lastKey);       // no immediate repeats
  session.lastKey = key;
  return chord;
}

function playCurrent() {
  if (!session || session.done || !session.chord) return;
  const v = session.voicing || voicingsFor(session.chord)[0];
  if (v) playVoicing(v);
}

// ---------- round UI ----------

function promptKey() {
  return session.type === 'quality' ? 'whichQ'
    : session.type === 'root' ? 'whichR' : 'playIt';
}

function masked() {
  // what fills the big title before the answer is revealed
  return session.type === 'root'
    ? '?' + session.chord.quality.replace('b5', '♭5')
    : '?';
}

function want() {
  return session.type === 'quality' ? session.chord.quality : session.chord.root;
}

function renderRound() {
  const se = session;
  q('earProgress').textContent = `${se.round}/${ROUNDS}`;
  const bar = q('earRun')?.querySelector('.run-bar > i');
  if (bar) bar.style.width = `${(se.round - 1) / ROUNDS * 100}%`;
  paintScore();
  q('earReveal').textContent = se.resolved ? se.sym : masked();
  q('earPrompt').textContent = se.resolved ? '' : s(promptKey());
  const fb = q('earFeedback');
  if (se.resolved) {
    const last = se.results[se.results.length - 1];
    fb.textContent = last && last.correct ? s('correct') : s('wrong');
    fb.className = 'feedback ' + (last && last.correct ? 'good' : 'bad');
  } else {
    fb.textContent = se.type === 'play' ? s('listening') : '';
    fb.className = 'feedback';
  }
  q('earHeard').replaceChildren();
  q('earGiveup').hidden = se.resolved;
  q('earNext').hidden = !se.resolved;
  renderAnswers();
}

function renderAnswers() {
  const el = q('earAnswers');
  el.replaceChildren();
  // root answers share the picker's two-row grid; quality answers get a
  // uniform tile grid (.ans-grid). The classes must be removed explicitly —
  // they live on the container, not the chips, so they survive
  // replaceChildren().
  el.classList.toggle('root-grid', session.type === 'root');
  el.classList.toggle('ans-grid', session.type === 'quality');
  if (session.type === 'play') return;             // mic answers, not chips
  if (session.type === 'root') {
    // quiz mode: no .sel toggling — markAnswers paints .right/.wrong
    rootPicker(el, -1, id => resolve(id === want(), id),
      { ...opts(), quiz: true });
  } else {
    const items = QUALITY_ORDER.filter(k => setup.pool.has(k))
      .map(k => ({ id: k, label: QUALITIES[k].label }));
    for (const it of items) {
      const b = document.createElement('button');
      b.className = 'chip';
      b.dataset.id = it.id;
      b.textContent = it.label;
      b.disabled = session.resolved;
      b.addEventListener('click', () => resolve(it.id === want(), it.id));
      el.append(b);
    }
  }
  if (session.resolved) markAnswers();
}

// after resolve: .chip.right = correct answer, .chip.wrong = the bad pick
function markAnswers() {
  const w = String(want());
  q('earAnswers').querySelectorAll('.chip').forEach(b => {
    b.disabled = true;
    if (b.dataset.id === w) b.classList.add('right');
    else if (session.picked !== null && b.dataset.id === String(session.picked)) {
      b.classList.add('wrong');
    }
  });
}

function paintScore() {
  const ok = session.results.filter(r => r.correct).length;
  q('earScore').textContent = `✓${ok} ✗${session.results.length - ok}`;
  q('earStreak').textContent = `${s('streak')} ${session.streak}`;
}

function resolve(correct, picked) {
  const se = session;
  if (!se || se.done || se.resolved) return;
  se.resolved = true;
  se.picked = picked;
  stopPoll();
  const dt = performance.now() - se.t0;
  se.results.push({ sym: se.sym, correct, dt });
  recordAttempt(se.sym, correct, dt);
  se.streak = correct ? se.streak + 1 : 0;
  se.best = Math.max(se.best, se.streak);
  paintScore();
  q('earReveal').textContent = se.sym;
  q('earPrompt').textContent = '';
  const fb = q('earFeedback');
  fb.textContent = correct ? s('correct') : s('wrong');
  fb.className = 'feedback ' + (correct ? 'good' : 'bad');
  if (se.type !== 'play') markAnswers();
  q('earGiveup').hidden = true;
  q('earNext').hidden = false;
  if (correct) {
    // brief pause to read the answer, then the next chord plays itself
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(() => { advanceTimer = null; nextRound(); }, 1100);
  }
}

// ---------- mic verification (play drill) ----------

// Poll the spectrum ~14×/s; the chord passes when ≥4 of the last 6 frames
// verify — same vote gate as practice.js, tolerates noisy strum frames.
// Same two extra gates too: voicing template per frame (≤1 dead string) and
// votes only count within ~1.8 s of a pick attack, so leftover ring from
// the revealed answer can't score the next round.
function startPoll() {
  stopPoll();
  pollTimer = setInterval(() => {
    if (!session || session.done || session.resolved) return;
    const spec = mic.spectrum();
    if (!spec) return;
    const prof = profileFromSpectrum(spec.db, spec.binHz,
      requiredPcs(session.chord), session.voicing);
    const res = matchChord(prof, session.chord);
    paintHeard(res);
    // a fresh attack re-arms the vote: drop whatever the ring still holds
    if (mic.lastOnset !== seenOnset) { seenOnset = mic.lastOnset; voteRing = []; }
    const fresh = seenOnset > 0 && performance.now() - seenOnset < 1800;
    const frameOk = res.ok && res.stringsOk !== false;
    voteRing.push(frameOk);
    if (voteRing.length > 6) voteRing.shift();
    if (fresh && frameOk && voteRing.filter(Boolean).length >= 4) resolve(true, null);
  }, 70);
}

function stopPoll() { clearInterval(pollTimer); pollTimer = null; }

function paintHeard(res) {
  const el = q('earHeard');
  if (!el || !session) return;
  el.replaceChildren();
  for (const pc of requiredPcs(session.chord)) {
    const sp = document.createElement('span');
    sp.className = res.heard.has(pc) ? 'hit' : 'miss';
    sp.textContent = pcName(pc, opts()) + ' ';
    el.append(sp);
  }
  if (res.bassPc != null && res.bassPc !== bassPc(session.chord)) {
    const sp = document.createElement('span');
    sp.className = 'miss';
    sp.textContent = `bass:${pcName(res.bassPc, opts())}`;
    el.append(sp);
  }
  // voicing template: name the strings that should ring but don't
  if (res.strings) {
    for (const st of res.strings) {
      if (st.ok) continue;
      const sp = document.createElement('span');
      sp.className = 'miss';
      sp.textContent = s('deadString').replace('{n}', st.s + 1) +
        (st.heard != null ? ':' + pcName(st.heard, opts()) : '');
      el.append(sp);
    }
  }
}

// ---------- finish ----------

function cleanupAudio() {
  stopPoll();
  clearTimeout(advanceTimer); advanceTimer = null;
  if (mic.running) mic.stop();
}

function endSession() {          // "끝내기" — discard the run, back to setup
  cleanupAudio();
  if (session) session.done = true;
  showPanel('setup');
}

function finish() {
  session.done = true;
  cleanupAudio();
  showPanel('result');
  const ok = session.results.filter(r => r.correct);
  const acc = session.results.length
    ? Math.round(100 * ok.length / session.results.length) : 0;
  const missed = session.results.filter(r => !r.correct).map(r => r.sym);
  q('earResultBody').innerHTML =
    `${s('accuracy')}: ${acc}% (${ok.length}/${session.results.length})<br>` +
    `${s('bestStreak')}: ${session.best}<br>` +
    (missed.length
      ? `<span style="color:var(--bad)">${s('missed')}: ${missed.join(', ')}</span>`
      : '');
}

// ---------- wiring ----------

export function initEar() {
  body = document.getElementById('earBody');
  render();
  onLangChange(render);          // rebuild labels; session state survives
}

// app.js calls this when leaving the ear tab: release the mic and every
// scheduled timer so nothing plays or polls in the background.
export function suspendEar() {
  cleanupAudio();
  if (session && !session.done) {
    session.done = true;
    showPanel('setup');
  }
}

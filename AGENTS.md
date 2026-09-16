# Guitar Virtuoso — agent notes

Vanilla-JS PWA, no build step. `python serve.py` → localhost:8000.
`npm test` → `node test/selftest.js` (must stay green: 50 tests, 1 known-limitation).
Python on PATH is a Store stub — use `%LOCALAPPDATA%\Python\bin\python.exe`.

## Machine setup (helper space)

This machine is used as a helper space for other projects. Installed:
- Temurin JDK 21.0.12.1 (`winget install EclipseAdoptium.Temurin.21.JDK`) at
  `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot` — system
  `JAVA_HOME` + PATH set by the MSI. Satisfies "Gradle for Java" / JDT.LS
  JDK 17+ requirement; editor restart needed to pick up env vars.

## Team mode (사용자 요청)

The user wants work delegated to role-scoped subagents, orchestrated by the
main session as manager. Conventions:

- **Manager** = main session: decomposes work, writes delegation prompts with
  full context (subagents are stateless — front-load everything), reviews and
  merges results, keeps this file + the plan file as shared source of truth.
- **Coder** = `subagent_general` on a disjoint module set (e.g. `js/audio/*`
  vs `js/screens/*` — never two agents on the same file).
- **Designer / art director** = `subagent_general` scoped to `styles.css`,
  `index.html` markup, `icon.svg`, `tools/make_icon.py`, `js/ui/*` visuals.
- **Research/analysis** = `subagent_explore` (read-only).
- Parallel subagents must have **disjoint write scopes**. State it explicitly
  in each delegation prompt.
- After delegating work lands, manager re-runs `node test/selftest.js`.

## Audio-detection roadmap (research audit, post-v1)

The 50-test selftest uses a clean synthesized signal; it does NOT model real
mic input. Known gaps, in priority order:

- **Residual ring / sympathetic resonance** — the previous chord keeps
  sounding into the next window; open-string pcs (E,A,D,G,B,e) can even
  complete a target with no strum. Mitigated today by the ≥4-of-6 vote ring
  (with current-frame-must-pass); the real fix is **onset gating** (spectral
  flux in the worklet → only count votes ~1.5s after an attack).
- **Voicing-template verification (v2, recommended over NMF)** — the poll
  knows `voicingsFor(chord)[0]`; require a peak within ~±0.7 semitone of
  each expected fundamental. Kills sympathetic-ring false-accepts and gives
  per-string feedback ("B string isn't sounding"). ~30 lines on the existing
  peak list.
- **Selftest hardening targets** — per-string gain jitter, ±15–35¢ detune,
  noise bed, previous-chord ring at −15dB, sympathetic open strings,
  relative-chord negatives (Am audio vs C target), quiet input at −55dB.
- **Superset leniency is deliberate-ish** — C7 audio passes for target C;
  Am7 passes for C. Acceptable for a tutor, but be aware.
- Tuner: `THRESH=0.15` + fallback global-min accept (<0.30) + 2-consecutive-
  frame needle gate in tuner.js. Octave cross-check was tried and reverted —
  d(2τ) is always a dip for periodic signals, so it can't discriminate.

Quick wins already landed: adaptive noise floor (median+10dB replaces
absolute DB_FLOOR), F_MAX 1200, soft pc binning, PEAK_KEEP 32, heard-floor
0.02 + fundamental-evidence gate (`profile.fund` — a pc needs non-harmonic
peak support; the Am→C false-accept came from A's 7th partial sitting near
G), harmonic tolerance ∝ k (stiff-string partials drift sharp with k),
fifth-omission parity with voicings.js (both mic and virtual paths),
`res.ok &&` in the vote check, analyser smoothing 0.3, DC blocker + 4096
window in the worklet, reused YIN buffers.

## Deploy & roadmap decisions (2026-09-15)

- **Hosting**: GitHub Pages from `main` → https://composerjunhee.github.io/GuitarVirtuoso/
  (repo: github.com/composerjunhee/GuitarVirtuoso, **public** — user confirmed OK
  since client JS is inspectable anyway). Push to main auto-deploys.
- **Private + Cloudflare Pages**: considered, deferred — repo stays public.
- **Language/framework migration**: user decided NO switch to another language.
  Deferred upgrade path for when the codebase outgrows no-build vanilla:
  Vite + TypeScript → Svelte/React → Capacitor (native) → Workers backend
  (sync/accounts). Do it all at once later, not piecemeal.
- **Play Store** (future): PWABuilder/Bubblewrap TWA packaging.

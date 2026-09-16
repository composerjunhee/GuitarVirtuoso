// YIN-lite monophonic pitch detection on a worklet frame.
// Difference function → cumulative mean normalized difference → first dip
// below threshold → octave cross-check → parabolic interpolation.
// Guitar floor E2 ≈ 82 Hz.

const THRESH = 0.15;         // canonical YIN band; 0.18 was too eager to
                             // accept a shallow early dip, 0.14 starves E2
const RMS_GATE = 0.0008;     // -62dBFS — dNorm is amplitude-invariant so the
                             // gate only rejects noise-floor frames; soft
                             // night plucks decay through higher gates fast

// reused across frames — ~11KB × 86fps of fresh allocations is needless GC
let d = null, dNorm = null;

export function detectPitch(buf, sr) {
  const N = buf.length;
  const tauMax = Math.min(Math.floor(sr / 65), N - 2);   // ~678 @44.1k → ≥65 Hz
  const tauMin = Math.floor(sr / 1400);                  // ceiling ~1.4 kHz
  const W = N - tauMax;                                  // integration window

  if (!d || d.length <= tauMax) {
    d = new Float64Array(tauMax + 1);
    dNorm = new Float64Array(tauMax + 1);
  } else d.fill(0, 0, tauMax + 1);

  let rms = 0;
  for (let i = 0; i < N; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / N);
  if (rms < RMS_GATE) return null;

  for (let tau = tauMin; tau <= tauMax; tau++) {
    let sum = 0;
    for (let j = 0; j < W; j++) {
      const diff = buf[j] - buf[j + tau];
      sum += diff * diff;
    }
    d[tau] = sum;
  }

  // cumulative mean normalized difference
  dNorm[0] = 1;
  let acc = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    acc += d[tau];
    dNorm[tau] = acc === 0 ? 1 : d[tau] * tau / acc;
  }

  // first local minimum below threshold
  let tau = -1;
  for (let t = tauMin + 1; t < tauMax; t++) {
    if (dNorm[t] < THRESH) {
      while (t + 1 <= tauMax && dNorm[t + 1] < dNorm[t]) t++;
      tau = t;
      break;
    }
  }
  // Fallback for deep-but-not-quite dips: real low strings (decay bias,
  // weak fundamental) may never cross THRESH. Accept the global minimum
  // when it's still clearly periodic.
  if (tau < 0) {
    let minV = Infinity, minT = -1;
    for (let t = tauMin + 1; t < tauMax; t++) {
      if (dNorm[t] < minV) { minV = dNorm[t]; minT = t; }
    }
    // 0.35: a quiet string + room noise can leave the true dip shallower
    // than 0.30; pc-stability gating in the caller filters junk accepts
    if (minV < 0.35) tau = minT; else return null;
  }

  // parabolic interpolation around tau
  const x0 = tau > tauMin ? dNorm[tau - 1] : dNorm[tau];
  const x2 = tau < tauMax ? dNorm[tau + 1] : dNorm[tau];
  const den = x0 - 2 * dNorm[tau] + x2;
  const shift = den !== 0 ? (x0 - x2) / (2 * den) : 0;
  const period = tau + Math.max(-0.5, Math.min(0.5, shift));

  return { freq: sr / period, clarity: 1 - dNorm[tau], rms };
}

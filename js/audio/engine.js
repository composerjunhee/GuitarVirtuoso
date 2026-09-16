// Shared AudioContext. Created lazily inside a user gesture so autoplay
// policy is satisfied; resume() is called defensively every access.

let ctx = null;

export function audioCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

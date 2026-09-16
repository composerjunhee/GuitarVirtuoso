// App shell: tab routing (incl. the settings gear), SW registration.
// The old header toggles (♯/♭, lefty, KO/EN) live on the settings screen now.

import { initLang } from './i18n.js';
import { initLibrary } from './screens/library.js';
import { initPractice, endPractice } from './screens/practice.js';
import { initTuner, suspendTuner } from './screens/tuner.js';
import { initEar, suspendEar } from './screens/ear.js';
import { initStrum, suspendStrum } from './screens/strum.js';
import { initSongs, suspendSongs } from './screens/songs.js';
import { initStats } from './screens/stats.js';
import { initSettings } from './screens/settings.js';

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(btn => btn.addEventListener('click', () => {
    const name = btn.dataset.tab;
    tabs.forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.screen').forEach(s =>
      s.classList.toggle('active', s.id === `screen-${name}`));
    // leaving a screen suspends its audio work
    if (name !== 'tuner') suspendTuner();
    if (name !== 'practice') endPractice();
    if (name !== 'ear') suspendEar();
    if (name !== 'strum') suspendStrum();
    if (name !== 'songs') suspendSongs();
  }));
}

initLang();
initTabs();
initSettings();
initLibrary();
initPractice();
initTuner();
initEar();
initStrum();
initSongs();
initStats();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

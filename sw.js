// Cache-first service worker. Bump CACHE on every deploy.

const CACHE = 'gv-v18';  // song chart section markers (verse/chorus/A-B)

const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'icon.svg',
  'favicon.ico',
  'apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png',
  'js/app.js',
  'js/i18n.js',
  'js/state.js',
  'js/theory/notes.js',
  'js/theory/chords.js',
  'js/theory/voicings.js',
  'js/data/curated.js',
  'js/data/progressions.js',
  'js/data/standards.js',
  'js/audio/engine.js',
  'js/audio/input.js',
  'js/audio/worklet-processor.js',
  'js/audio/pitch.js',
  'js/audio/chordDetect.js',
  'js/audio/pluck.js',
  'js/audio/metronome.js',
  'js/ui/fretboard.js',
  'js/ui/chordDiagram.js',
  'js/ui/needle.js',
  'js/ui/components.js',
  'js/screens/library.js',
  'js/screens/practice.js',
  'js/screens/tuner.js',
  'js/screens/ear.js',
  'js/screens/progBuilder.js',
  'js/screens/strum.js',
  'js/screens/songs.js',
  'js/screens/fretboardGame.js',
  'js/screens/stats.js',
  'js/screens/settings.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit =>
      hit || fetch(e.request).then(res => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }))
  );
});

const CACHE_NAME = 'mlp-chinese-flashcards-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './css/print.css',
  './js/data.js',
  './js/audio.js',
  './js/canvas-writer.js',
  './js/games.js',
  './js/storage.js',
  './js/app.js',
  './manifest.json',
  './icons/icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    }).catch(() => {
      return caches.match('./index.html');
    })
  );
});

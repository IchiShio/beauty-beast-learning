const CACHE_NAME = 'bblearn-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
];
const AUDIO_ASSETS = [
  './audio/kata_beast.mp3',
  './audio/kata_bell.mp3',
  './audio/kata_ballroom.mp3',
  './audio/kata_dance.mp3',
  './audio/kata_party.mp3',
  './audio/kata_rose.mp3',
  './audio/kata_red_dress.mp3',
  './audio/kata_blue_dress.mp3',
];
for (let i = 1; i <= 20; i++) AUDIO_ASSETS.push(`./audio/num_${i}.mp3`);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_ASSETS)
        .then(() => cache.addAll(AUDIO_ASSETS.map(u => new Request(u, { cache: 'no-cache' })))
          .catch(() => {})) // audio files may not exist yet
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // external CDN: network first, cache fallback
  if (url.hostname !== self.location.hostname) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        fetch(event.request)
          .then(res => { cache.put(event.request, res.clone()); return res; })
          .catch(() => cache.match(event.request))
      )
    );
    return;
  }
  // local: cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, res.clone()));
        return res;
      });
    })
  );
});

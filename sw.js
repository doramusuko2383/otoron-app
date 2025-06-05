const CACHE_NAME = 'otoron-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/style.css',
  '/generated-icon.png',
  '/favicon.ico',
  // CSS files
  '/css/common.css',
  '/css/intro.css',
  '/css/login.css',
  '/css/result.css',
  '/css/signup.css',
  '/css/home.css',
  '/css/header.css',
  '/css/training.css',
  '/css/training_full.css',
  '/css/settings.css',
  '/css/summary.css',
  '/css/growth.css',
  '/css/mypage.css',
  '/css/info.css',
  '/css/pricing.css',
  '/css/setup.css',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
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
  const { request } = event;
  if (request.method !== 'GET') return;

  // Prefer cache for local assets and audio
  if (request.url.includes('/audio/') || request.url.includes('/sounds/') || request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        });
      })
    );
  }
});

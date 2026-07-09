const CACHE_NAME = 'ihsanpark-v6';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=1.0.6',
  './app.js',
  './config.js',
  './logo.png',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network First, Cache Fallback)
self.addEventListener('fetch', (e) => {
  // Always fetch Google Apps Script sync URLs directly from network
  if (e.request.url.includes('script.google.com') || e.request.url.includes('/exec') || e.request.url.includes('google.com')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .catch(() => {
        return caches.match(e.request);
      })
  );
});

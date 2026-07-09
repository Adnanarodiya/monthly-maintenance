const CACHE_NAME = 'ihsanpark-v8';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=1.0.6',
  './app.js',
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
  const requestUrl = e.request.url;

  // Always fetch Google sync URLs and config.js from network
  if (
    requestUrl.includes('script.google.com') ||
    requestUrl.includes('/exec') ||
    requestUrl.includes('google.com') ||
    requestUrl.includes('config.js')
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .catch(() => {
        return caches.match(e.request);
      })
  );
});

const CACHE_NAME = 'dreamos-v13.1.2';
const DYNAMIC_CACHE = 'dreamos-dynamic-v1';
const ASSETS_TO_CACHE = [
  '/Quantum-Edition/',
  '/Quantum-Edition/index.html',
  '/Quantum-Edition/offline.html',
  '/Quantum-Edition/assets/apple-touch-icon.png',
  '/Quantum-Edition/assets/android-chrome-192x192.png',
  '/Quantum-Edition/assets/android-chrome-512x512.png',
  '/Quantum-Edition/assets/favicon-16x16.png',
  '/Quantum-Edition/assets/favicon-32x32.png',
  'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // API Supabase: Network First
  if (event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/Quantum-Edition/offline.html'))
    );
    return;
  }

  // Cache First untuk semua aset
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/Quantum-Edition/offline.html') || caches.match('/Quantum-Edition/');
          }
        })
      )
  );
});

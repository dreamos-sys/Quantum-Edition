// ========== DREAM OS QUANTUM SERVICE WORKER v6.1 ==========
// 🔥 FIXED FOR GITHUB PAGES PATH ISSUES

const CACHE_NAME = 'dream-os-v6.1';
const OFFLINE_URL = 'offline.html';

// 🎯 PERBAIKAN: Semua path RELATIF (./) untuk GitHub Pages
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  
  // External resources (tetap absolute)
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap'
];

// ========== INSTALL EVENT ==========
self.addEventListener('install', event => {
  console.log('🛠️ [Quantum Fix] Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching core app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('✅ All resources cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Cache installation failed:', error);
      })
  );
});

// ========== ACTIVATE EVENT ==========
self.addEventListener('activate', event => {
  console.log('🚀 [Quantum Fix] Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim clients immediately
      self.clients.claim()
    ])
    .then(() => {
      console.log('✅ Service Worker ready to handle fetches!');
    })
  );
});

// ========== FETCH STRATEGY: NETWORK FIRST, CACHE FALLBACK ==========
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  const requestUrl = new URL(event.request.url);
  
  // 🎯 PERBAIKAN: Handle GitHub Pages subdirectory
  if (requestUrl.origin === location.origin) {
    // For same-origin requests
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // If navigation request, return offline page
              if (event.request.mode === 'navigate') {
                return caches.match('./offline.html');
              }
              
              return new Response('Network error', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        })
    );
  } else {
    // For cross-origin requests (fonts, APIs)
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              // Don't cache large responses
              if (response.ok && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // Return offline response for fonts
              if (event.request.url.includes('fonts.googleapis.com')) {
                return new Response(
                  '@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap");',
                  { headers: { 'Content-Type': 'text/css' } }
                );
              }
              return new Response('', { status: 408 });
            });
        })
    );
  }
});

// ========== PUSH NOTIFICATIONS ==========
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Dream OS Notification',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './',
      timestamp: Date.now()
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Dream OS Quantum',
      options
    )
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || './');
        }
      })
  );
});

// ========== MESSAGE HANDLER ==========
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ [Quantum Fix] Service Worker v6.1 loaded!');

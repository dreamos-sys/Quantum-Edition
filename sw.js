const CACHE_NAME = 'dream-os-v13.0';
const DYNAMIC_CACHE = 'dream-os-dynamic-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/admin-dashboard.html',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-72.png',
  '/assets/icon-96.png',
  '/assets/icon-128.png',
  '/assets/icon-144.png',
  '/assets/icon-152.png',
  '/assets/icon-384.png',
  '/assets/splash-screen.png',
  'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE) {
            console.log('🧹 Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Cache First, Network Fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Special handling for API calls (Network First)
  if (event.request.url.includes('/api/') || event.request.url.includes('quantum-sync')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For everything else: Cache First
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('📦 Serving from cache:', event.request.url);
          return cachedResponse;
        }

        return fetch(event.request)
          .then(fetchResponse => {
            // Don't cache if not successful
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            const responseToCache = fetchResponse.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          })
          .catch(error => {
            console.log('❌ Fetch failed:', error);
            
            // Return offline page for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            // Return placeholder for images
            if (event.request.url.match(/\.(jpg|png|gif)$/)) {
              return caches.match('/assets/placeholder.png');
            }
          });
      })
  );
});

// Background Sync for Offline Data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    console.log('🔄 Background Sync: Syncing reports');
    event.waitUntil(syncReports());
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'DREAM OS Notification',
    icon: '/assets/icon-192.png',
    badge: '/assets/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Buka Aplikasi'
      },
      {
        action: 'close',
        title: 'Tutup'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'DREAM OS', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          if (clientList.length > 0) {
            let client = clientList[0];
            for (let i = 0; i < clientList.length; i++) {
              if (clientList[i].focused) {
                client = clientList[i];
              }
            }
            return client.focus();
          }
          return clients.openWindow(event.notification.data.url || '/');
        })
    );
  }
});

// Helper Functions
async function syncReports() {
  try {
    const queue = await getIndexedDB('quantumQueue');
    for (const report of queue) {
      const response = await fetch('https://api.yourserver.com/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      
      if (response.ok) {
        await removeFromIndexedDB('quantumQueue', report.id);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

function getIndexedDB(storeName) {
  return new Promise((resolve) => {
    const request = indexedDB.open('DreamOSDB', 1);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result || []);
    };
    request.onerror = () => resolve([]);
  });
}

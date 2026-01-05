// File: public/sw.js
const CACHE_NAME = 'dreamos-quantum-v1.0.0';
const OFFLINE_CACHE = 'dreamos-offline-v1';
const API_CACHE = 'dreamos-api-v1';

const OFFLINE_URL = '/offline.html';
const INSTALL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/js/main.js',
  '/icons/icon-72x72.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  OFFLINE_URL
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(INSTALL_URLS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE && cacheName !== API_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event with multiple strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // API requests - Network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(apiFirstStrategy(event));
    return;
  }
  
  // Static assets - Cache first, network fallback
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(event));
    return;
  }
  
  // HTML pages - Network first, offline fallback
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(networkFirstStrategy(event));
    return;
  }
});

// Strategy: API First (Network then Cache)
async function apiFirstStrategy(event) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(event.request);
    
    // Clone response for cache
    const responseToCache = networkResponse.clone();
    
    // Cache successful responses (except errors)
    if (networkResponse.ok) {
      cache.put(event.request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(event.request);
    
    if (cachedResponse) {
      console.log('[Service Worker] Serving API from cache:', event.request.url);
      return cachedResponse;
    }
    
    // No cache, return error
    return new Response(
      JSON.stringify({ error: 'Network error and no cache available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Strategy: Cache First (Cache then Network)
async function cacheFirstStrategy(event) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(event.request);
  
  if (cachedResponse) {
    // Update cache in background
    event.waitUntil(updateCache(event.request, cache));
    return cachedResponse;
  }
  
  // Not in cache, try network
  try {
    const networkResponse = await fetch(event.request);
    
    // Cache the new response
    cache.put(event.request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // Network failed, return offline page for HTML, or placeholder for images
    if (event.request.headers.get('accept').includes('text/html')) {
      return caches.match(OFFLINE_URL);
    }
    
    // For images, return placeholder
    if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return caches.match('/icons/placeholder-image.png');
    }
    
    throw error;
  }
}

// Strategy: Network First (Network then Cache)
async function networkFirstStrategy(event) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(event.request);
    
    // Update cache
    cache.put(event.request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(event.request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match(OFFLINE_URL);
  }
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
  
  if (event.tag === 'sync-api-requests') {
    event.waitUntil(syncAPIRequests());
  }
});

// Periodic sync (every 12 hours)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-sync') {
    console.log('[Service Worker] Periodic sync triggered');
    event.waitUntil(syncAllData());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Dream OS Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          if (clientList.length > 0) {
            const client = clientList[0];
            client.focus();
            return client.navigate(event.notification.data.url);
          }
          return clients.openWindow(event.notification.data.url);
        })
    );
  }
});

// Helper functions
function isStaticAsset(url) {
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/);
}

async function updateCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silently fail update
  }
}

async function syncOfflineData() {
  console.log('[Service Worker] Syncing offline data...');
  
  // Get offline queue from IndexedDB
  const db = await openDatabase();
  const offlineQueue = await getAllFromStore(db, 'offlineQueue');
  
  for (const item of offlineQueue) {
    try {
      await fetch(item.url, item.options);
      await deleteFromStore(db, 'offlineQueue', item.id);
      console.log('[Service Worker] Synced:', item.url);
    } catch (error) {
      console.error('[Service Worker] Sync failed:', error);
    }
  }
}

// IndexedDB for offline queue
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DreamOSOfflineQueue', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offlineQueue')) {
        const store = db.createObjectStore('offlineQueue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

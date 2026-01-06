// ========== DREAM OS QUANTUM SERVICE WORKER v6.0 ==========
const CACHE_NAME = 'dream-os-v6.0';
const OFFLINE_URL = 'offline.html';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap'
];

// ========== INSTALL EVENT ==========
self.addEventListener('install', event => {
  console.log('🛠️ Dream OS Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('✅ All resources cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Cache install failed:', error);
      })
  );
});

// ========== ACTIVATE EVENT ==========
self.addEventListener('activate', event => {
  console.log('🚀 Dream OS Service Worker: Activating...');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// ========== FETCH EVENT ==========
self.addEventListener('fetch', event => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Handle API requests differently
  if (event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone response to cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For navigation requests, try network first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }
  
  // For other resources: cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('📦 Serving from cache:', event.request.url);
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a successful response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response to cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.log('❌ Fetch failed:', error);
            // For images, return a placeholder
            if (event.request.destination === 'image') {
              return caches.match('/icons/icon-512x512.png');
            }
            return new Response('', { 
              status: 408, 
              statusText: 'Offline mode' 
            });
          });
      })
  );
});

// ========== SYNC EVENT ==========
self.addEventListener('sync', event => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  } else if (event.tag === 'sync-k3-reports') {
    event.waitUntil(syncK3Reports());
  }
});

// ========== PUSH NOTIFICATION ==========
self.addEventListener('push', event => {
  console.log('📨 Push notification received');
  
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.body || 'Dream OS Notification',
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
        title: 'Buka Aplikasi'
      },
      {
        action: 'close',
        title: 'Tutup'
      }
    ],
    tag: data.tag || 'dreamos-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Dream OS Quantum', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(clientList => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/');
        }
      })
    );
  }
});

// ========== PERIODIC SYNC ==========
self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-sync') {
    event.waitUntil(performDailySync());
  }
});

// ========== SYNC FUNCTIONS ==========
async function syncBookings() {
  console.log('🔄 Syncing bookings...');
  
  try {
    const offlineBookings = await getOfflineBookings();
    
    if (offlineBookings.length === 0) {
      console.log('📭 No offline bookings to sync');
      return;
    }
    
    // Sync with Supabase
    for (const booking of offlineBookings) {
      const response = await fetch('https://ywtpykgjvbjwhmapmygb.supabase.co/rest/v1/bookings', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dHB5a2dqdmJqd2htYXBteWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTI5OTcsImV4cCI6MjA4MjQ4ODk5N30.MA78j8WLwOO9nxR36tikN7jBQLjbYWYvTZn___eXBkk',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(booking)
      });
      
      if (response.ok) {
        console.log('✅ Booking synced:', booking.id);
        // Remove from offline storage
        removeOfflineBooking(booking.id);
      }
    }
    
    // Show notification
    self.registration.showNotification('Dream OS Sync', {
      body: `${offlineBookings.length} bookings synced successfully`,
      icon: '/icons/icon-192x192.png'
    });
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

async function syncK3Reports() {
  console.log('🔄 Syncing K3 reports...');
  
  try {
    const offlineReports = await getOfflineK3Reports();
    
    if (offlineReports.length === 0) {
      console.log('📭 No offline K3 reports to sync');
      return;
    }
    
    // Sync each report
    for (const report of offlineReports) {
      // Convert base64 photo to blob if needed
      if (report.photo && report.photo.startsWith('data:image')) {
        const base64Response = await fetch(report.photo);
        const blob = await base64Response.blob();
        report.photo_blob = blob;
      }
      
      const response = await fetch('https://ywtpykgjvbjwhmapmygb.supabase.co/rest/v1/k3_reports', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dHB5a2dqdmJqd2htYXBteWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTI5OTcsImV4cCI6MjA4MjQ4ODk5N30.MA78j8WLwOO9nxR36tikN7jBQLjbYWYvTZn___eXBkk',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(report)
      });
      
      if (response.ok) {
        console.log('✅ K3 report synced:', report.id);
        removeOfflineK3Report(report.id);
      }
    }
    
  } catch (error) {
    console.error('❌ K3 sync failed:', error);
  }
}

async function performDailySync() {
  console.log('📅 Performing daily sync...');
  await syncBookings();
  await syncK3Reports();
  await syncInventory();
}

// ========== OFFLINE STORAGE HELPERS ==========
async function getOfflineBookings() {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bookings'], 'readonly');
    const store = transaction.objectStore('bookings');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function removeOfflineBooking(id) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bookings'], 'readwrite');
    const store = transaction.objectStore('bookings');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getOfflineK3Reports() {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['k3_reports'], 'readonly');
    const store = transaction.objectStore('k3_reports');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function removeOfflineK3Report(id) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['k3_reports'], 'readwrite');
    const store = transaction.objectStore('k3_reports');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DreamOSDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('bookings')) {
        const bookingStore = db.createObjectStore('bookings', { keyPath: 'id', autoIncrement: true });
        bookingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('k3_reports')) {
        const k3Store = db.createObjectStore('k3_reports', { keyPath: 'id', autoIncrement: true });
        k3Store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('inventory')) {
        const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id' });
        inventoryStore.createIndex('qr_code', 'qr_code', { unique: true });
      }
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// ========== BACKGROUND TASKS ==========
async function syncInventory() {
  console.log('🔄 Syncing inventory...');
  
  try {
    // Fetch latest inventory from server
    const response = await fetch('https://ywtpykgjvbjwhmapmygb.supabase.co/rest/v1/inventory', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dHB5a2dqdmJqd2htYXBteWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTI5OTcsImV4cCI6MjA4MjQ4ODk5N30.MA78j8WLwOO9nxR36tikN7jBQLjbYWYvTZn___eXBkk'
      }
    });
    
    if (response.ok) {
      const inventory = await response.json();
      
      // Cache in IndexedDB
      const db = await openIndexedDB();
      const transaction = db.transaction(['inventory'], 'readwrite');
      const store = transaction.objectStore('inventory');
      
      // Clear existing data
      store.clear();
      
      // Add new data
      inventory.forEach(item => {
        store.add(item);
      });
      
      console.log('✅ Inventory synced:', inventory.length, 'items');
    }
    
  } catch (error) {
    console.error('❌ Inventory sync failed:', error);
  }
}

// ========== MESSAGE HANDLER ==========
self.addEventListener('message', event => {
  console.log('📨 Message from client:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    caches.open(CACHE_NAME).then(cache => {
      cache.keys().then(keys => {
        event.ports[0].postMessage({
          type: 'CACHE_SIZE_RESPONSE',
          size: keys.length
        });
      });
    });
  }
});

console.log('✅ Dream OS Quantum Service Worker v6.0 loaded successfully!');

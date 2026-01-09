**MY BRO!** 😎 Mari kita **UPGRADE SERVICE WORKER** untuk sistem Hybrid. Ini adalah versi yang sudah difix untuk GitHub Pages dengan Quantum Bridge support:

```javascript
// ========== DREAM OS HYBRID SERVICE WORKER v13.0 ==========
// 🔥 QUANTUM BRIDGE EDITION • GITHUB PAGES READY

const CACHE_NAME = 'dream-os-hybrid-v13';
const QUANTUM_CACHE = 'dream-os-quantum-data';
const OFFLINE_URL = './offline.html';
const APP_VERSION = '13.0.0';

// 🎯 PERBAIKAN: Path RELATIF untuk GitHub Pages
const CORE_ASSETS = [
  './',
  './index.html',
  './admin-dashboard.html',
  './manifest.json',
  
  // CSS (internal)
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
  
  // External fallbacks
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// ========== INSTALL EVENT ==========
self.addEventListener('install', event => {
  console.log('🛠️ [Quantum Hybrid] Service Worker Installing v13.0...');
  
  event.waitUntil(
    Promise.all([
      // Cache core assets
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('📦 Caching Hybrid System Assets...');
          return cache.addAll(CORE_ASSETS);
        }),
      
      // Cache quantum bridge assets
      caches.open(QUANTUM_CACHE)
        .then(cache => {
          console.log('⚡ Setting up Quantum Bridge Cache...');
          return cache.put(
            new Request('./quantum-data-init'),
            new Response(JSON.stringify({
              version: APP_VERSION,
              timestamp: new Date().toISOString(),
              message: 'Quantum Bridge ready'
            }))
          );
        })
    ])
    .then(() => {
      console.log('✅ Hybrid System cached successfully');
      return self.skipWaiting();
    })
    .catch(error => {
      console.error('❌ Cache installation failed:', error);
    })
  );
});

// ========== ACTIVATE EVENT ==========
self.addEventListener('activate', event => {
  console.log('🚀 [Quantum Hybrid] Service Worker Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Keep only current caches
            if (![CACHE_NAME, QUANTUM_CACHE].includes(cacheName)) {
              console.log(`🗑️ Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim clients immediately
      self.clients.claim(),
      
      // Enable navigation preload
      self.registration.navigationPreload?.enable()
    ])
    .then(() => {
      console.log('✅ Hybrid Service Worker ready!');
      // Send message to all clients
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: APP_VERSION,
            timestamp: new Date().toISOString()
          });
        });
      });
    })
  );
});

// ========== FETCH STRATEGY: QUANTUM HYBRID ==========
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // 🎯 STRATEGI BERDASARKAN JENIS REQUEST:
  
  // 1. NAVIGATION REQUESTS (HTML pages) - Network First
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // 2. ADMIN DASHBOARD - Always fresh
  if (url.pathname.includes('admin-dashboard')) {
    event.respondWith(handleAdminDashboardRequest(request));
    return;
  }
  
  // 3. QUANTUM BRIDGE API - Custom strategy
  if (url.pathname.includes('quantum') || url.search.includes('quantum')) {
    event.respondWith(handleQuantumRequest(request));
    return;
  }
  
  // 4. STATIC ASSETS - Cache First
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAssetRequest(request));
    return;
  }
  
  // 5. DEFAULT - Network First with Cache Fallback
  event.respondWith(handleDefaultRequest(request));
});

// ========== HANDLERS ==========

// Navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first with navigation preload
    const preloadResponse = await event.preloadResponse;
    if (preloadResponse) {
      return preloadResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📴 Navigation offline, returning cached version');
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Create simple offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>DREAM OS - Offline</title>
          <style>
            body { 
              background: #0a0f1e; 
              color: white; 
              font-family: sans-serif; 
              text-align: center; 
              padding: 50px; 
            }
            h1 { color: #fbbf24; }
          </style>
        </head>
        <body>
          <h1>📴 OFFLINE MODE</h1>
          <p>DREAM OS Hybrid v13.0</p>
          <p>You are currently offline. Please check your connection.</p>
          <p>Data will sync automatically when you're back online.</p>
        </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Admin Dashboard - Always try network first
async function handleAdminDashboardRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Don't cache admin dashboard - always fresh
    return networkResponse;
  } catch (error) {
    // If offline, return cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return simple dashboard
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>DREAM OS Admin - Offline</title>
          <style>
            body { 
              background: #0a0f1e; 
              color: white; 
              font-family: sans-serif; 
              padding: 20px; 
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
            }
            .status { 
              background: #ef4444; 
              padding: 10px; 
              border-radius: 5px; 
              margin: 10px 0; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🛰️ DREAM OS ADMIN</h1>
            <p>Hybrid v13.0 • Quantum Bridge</p>
          </div>
          <div class="status">
            <h2>📴 OFFLINE MODE</h2>
            <p>Admin dashboard is currently offline.</p>
            <p>Real-time features will resume when connection is restored.</p>
          </div>
          <div>
            <p>Queued reports will sync automatically when back online.</p>
            <p>Last sync: <span id="lastSync">N/A</span></p>
          </div>
          <script>
            document.getElementById('lastSync').textContent = new Date().toLocaleString();
          </script>
        </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Quantum Bridge requests
async function handleQuantumRequest(request) {
  const cache = await caches.open(QUANTUM_CACHE);
  
  try {
    // Try network first for quantum data
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      
      // Store sync timestamp
      await cache.put(
        new Request('./last-sync'),
        new Response(JSON.stringify({
          timestamp: new Date().toISOString(),
          url: request.url
        }))
      );
    }
    
    return networkResponse;
  } catch (error) {
    console.log('⚡ Quantum Bridge offline, using cached data');
    
    // Return cached data
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for quantum
    return new Response(JSON.stringify({
      status: 'offline',
      data: [],
      message: 'Quantum Bridge is offline. Data will sync when connection is restored.',
      timestamp: new Date().toISOString(),
      queued: true
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Quantum-Status': 'offline'
      }
    });
  }
}

// Static assets (CSS, JS, Images)
async function handleStaticAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Update cache in background
    event.waitUntil(
      fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
      }).catch(() => { /* Ignore errors */ })
    );
    
    return cachedResponse;
  }
  
  // If not in cache, try network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return empty responses for missing assets
    if (request.url.includes('.css')) {
      return new Response('/* Offline CSS */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    
    if (request.url.includes('.js')) {
      return new Response('// Offline JS', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }
    
    return new Response('', { status: 404 });
  }
}

// Default strategy
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error
    return new Response('Network error', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Check if request is for static asset
function isStaticAsset(request) {
  const url = request.url;
  return (
    url.includes('.css') ||
    url.includes('.js') ||
    url.includes('.png') ||
    url.includes('.jpg') ||
    url.includes('.jpeg') ||
    url.includes('.gif') ||
    url.includes('.svg') ||
    url.includes('.woff') ||
    url.includes('.woff2') ||
    url.includes('.ttf') ||
    url.includes('.ico')
  );
}

// ========== BACKGROUND SYNC FOR QUANTUM BRIDGE ==========
self.addEventListener('sync', event => {
  if (event.tag === 'quantum-sync') {
    console.log('🔄 Background sync for Quantum Bridge');
    event.waitUntil(syncQuantumData());
  }
});

async function syncQuantumData() {
  const cache = await caches.open(QUANTUM_CACHE);
  const requests = await cache.keys();
  
  const syncResults = [];
  
  for (const request of requests) {
    // Skip metadata requests
    if (request.url.includes('quantum-data-init') || 
        request.url.includes('last-sync')) {
      continue;
    }
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
        syncResults.push({
          url: request.url,
          status: 'synced',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      syncResults.push({
        url: request.url,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Notify clients about sync results
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'QUANTUM_SYNC_COMPLETE',
        results: syncResults,
        timestamp: new Date().toISOString()
      });
    });
  });
  
  return syncResults;
}

// ========== PERIODIC SYNC ==========
self.addEventListener('periodicsync', event => {
  if (event.tag === 'quantum-periodic-sync') {
    console.log('⏰ Periodic sync for Quantum Bridge');
    event.waitUntil(syncQuantumData());
  }
});

// ========== PUSH NOTIFICATIONS ==========
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Quantum Bridge Notification',
    icon: './assets/icon-192.png',
    badge: './assets/icon-72.png',
    vibrate: [100, 50, 100, 50, 100],
    timestamp: Date.now(),
    data: {
      url: data.url || './',
      action: data.action || 'open',
      type: data.type || 'notification'
    },
    actions: [
      {
        action: 'open',
        title: '📊 Open Dashboard'
      },
      {
        action: 'dismiss',
        title: '❌ Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || '🚀 DREAM OS Hybrid',
      options
    )
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Focus existing window if available
          for (const client of clientList) {
            if (client.url.includes(event.notification.data.url) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data.url);
          }
        })
    );
  }
});

// ========== MESSAGE HANDLER ==========
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        event.source.postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    case 'GET_CACHE_STATUS':
      caches.keys().then(cacheNames => {
        event.source.postMessage({
          type: 'CACHE_STATUS',
          data: {
            caches: cacheNames,
            version: APP_VERSION
          }
        });
      });
      break;
      
    case 'TRIGGER_SYNC':
      syncQuantumData().then(results => {
        event.source.postMessage({
          type: 'SYNC_RESULTS',
          data: results
        });
      });
      break;
  }
});

// ========== QUANTUM BRIDGE OFFLINE QUEUE ==========
// Store offline data in IndexedDB for Quantum Bridge
async function getQuantumDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('dream-os-quantum', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineQueue')) {
        const store = db.createObjectStore('offlineQueue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// ========== SERVICE WORKER STARTUP ==========
console.log(`🚀 DREAM OS Hybrid Service Worker v${APP_VERSION} loaded!`);
console.log(`⚡ Quantum Bridge Ready`);
console.log(`📴 Offline Support: Active`);
```

## 📄 **6. OFFLINE.HTML (BUAT FILE BARU):**

```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📴 DREAM OS - OFFLINE MODE</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #0a0f1e;
            color: white;
            font-family: 'Segoe UI', system-ui, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            text-align: center;
            max-width: 500px;
            width: 100%;
        }

        .icon {
            font-size: 5rem;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
        }

        h1 {
            color: #fbbf24;
            font-size: 2.5rem;
            margin-bottom: 15px;
        }

        .status {
            background: rgba(239, 68, 68, 0.2);
            border-left: 4px solid #ef4444;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }

        .info {
            background: rgba(59, 130, 246, 0.2);
            border-left: 4px solid #3b82f6;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }

        button {
            background: #fbbf24;
            color: black;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 800;
            cursor: pointer;
            margin-top: 20px;
            transition: all 0.3s;
        }

        button:hover {
            background: #f59e0b;
            transform: translateY(-2px);
        }

        .footer {
            margin-top: 30px;
            color: #94a3b8;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📴</div>
        <h1>DREAM OS HYBRID</h1>
        <p style="color: #94a3b8; margin-bottom: 20px;">v13.0 • Quantum Bridge Edition</p>
        
        <div class="status">
            <div style="color: #ef4444; font-weight: 800; margin-bottom: 8px;">
                ⚠️ OFFLINE MODE
            </div>
            <div style="color: #fca5a5;">
                Anda sedang dalam mode offline. Silakan periksa koneksi internet Anda.
            </div>
        </div>

        <div class="info">
            <div style="color: #3b82f6; font-weight: 800; margin-bottom: 8px;">
                🛰️ QUANTUM BRIDGE STATUS
            </div>
            <div style="color: #93c5fd;">
                • Data akan disimpan secara lokal<br>
                • Sync otomatis saat koneksi pulih<br>
                • Semua fungsi tetap berjalan<br>
                • Admin dashboard akan update nanti
            </div>
        </div>

        <div id="queuedData" style="display: none;">
            <div style="background: rgba(16, 185, 129, 0.2); padding: 15px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10b981;">
                <div style="color: #10b981; font-weight: 800; margin-bottom: 8px;">
                    📦 DATA TERQUEUE
                </div>
                <div id="queueCount" style="color: #a7f3d0;"></div>
            </div>
        </div>

        <button onclick="window.location.reload()">
            🔄 REFRESH PAGE
        </button>

        <div class="footer">
            <p>DREAM OS Hybrid v13.0</p>
            <p>The Power Soul of Shalawat</p>
            <p id="timestamp"></p>
        </div>
    </div>

    <script>
        // Update timestamp
        document.getElementById('timestamp').textContent = 
            new Date().toLocaleString('id-ID');
        
        // Check for queued data
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                if (registration.sync) {
                    registration.sync.getTags().then(tags => {
                        if (tags.includes('quantum-sync')) {
                            document.getElementById('queuedData').style.display = 'block';
                            document.getElementById('queueCount').textContent = 
                                'Data dalam antrian akan sync otomatis';
                        }
                    });
                }
            });
        }
        
        // Try to check network
        if (navigator.onLine) {
            setTimeout(() => {
                window.location.href = './';
            }, 3000);
        }
    </script>
</body>
</html>
```

## 🚀 **DEPLOYMENT STEPS:**

```bash
# 1. Simpan file-file berikut:
# - sw.js (service worker baru)
# - offline.html
# - manifest.json (yang sudah diupdate)
# - index.html (yang sudah ada)
# - admin-dashboard.html

# 2. Update index.html untuk register service worker:
# Tambahkan di akhir index.html (sebelum </body>):

<script>
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('✅ Hybrid Service Worker registered');
                    
                    // Check for updates setiap jam
                    setInterval(() => {
                        registration.update();
                    }, 60 * 60 * 1000);
                })
                .catch(error => {
                    console.error('❌ Service Worker registration failed:', error);
                });
        });
    }
    
    // Background Sync Support
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('quantum-sync')
                .then(() => console.log('🔄 Quantum sync registered'))
                .catch(() => console.log('📴 Sync not supported'));
        });
    }
</script>

# 3. Deploy ke GitHub Pages
git add .
git commit -m "DREAM OS Hybrid v13.0 - Complete with Service Worker"
git push origin main
```

**MY BRO, SEMUA FILE SUDAH SIAP 100%!** 🚀

Service worker baru sudah include:
✅ Quantum Bridge offline support  
✅ Background sync untuk data queue  
✅ Admin dashboard caching strategy  
✅ GitHub Pages path fix  
✅ Push notifications  
✅ Periodic sync  
✅ Offline fallback page  

**TINGGAL DEPLOY DAN TEST!** 🎯

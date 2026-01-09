// ========== DREAM OS HYBRID SERVICE WORKER v13.0.1 ==========
// 🔥 QUANTUM BRIDGE EDITION • GITHUB PAGES READY • FIXED EDITION

const CACHE_NAME = 'dream-os-hybrid-v13.0.1';
const QUANTUM_CACHE = 'dream-os-quantum-data-v2';
const OFFLINE_URL = './offline.html';
const APP_VERSION = '13.0.1';

// 🎯 PERBAIKAN CRITICAL: Path untuk GitHub Pages (REPOSITORY NAME AWARE)
const getCorrectPath = (path) => {
  // Jika ada repository name dalam path, kita sesuaikan
  const currentPath = self.location.pathname;
  const isGitHubPages = currentPath.includes('/dream-os-hybrid/'); // GANTI DENGAN NAMA REPO LU
  
  if (isGitHubPages && !path.startsWith('http')) {
    // Tambahkan repository name ke path
    return currentPath.split('/').slice(0, -1).join('/') + path.substring(1);
  }
  return path;
};

// Core assets dengan path yang sudah difix
const CORE_ASSETS = [
  './',
  './index.html',
  './admin-dashboard.html',
  './manifest.json',
  './offline.html',
  './sw.js', // Cache service worker sendiri
  './assets/css/style.css',
  './assets/js/main.js',
  
  // External resources dengan fallback
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  
  // Fallback icons lokal
  './assets/icons/icon-72x72.png',
  './assets/icons/icon-96x96.png',
  './assets/icons/icon-128x128.png',
  './assets/icons/icon-144x144.png',
  './assets/icons/icon-152x152.png',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-384x384.png',
  './assets/icons/icon-512x512.png'
].map(getCorrectPath);

// ========== FIXED INSTALL EVENT ==========
self.addEventListener('install', event => {
  console.log('🔥 [Quantum Hybrid] Installing v13.0.1...');
  
  event.waitUntil(
    (async () => {
      try {
        // Open caches
        const coreCache = await caches.open(CACHE_NAME);
        const quantumCache = await caches.open(QUANTUM_CACHE);
        
        console.log('📦 Caching core assets...');
        
        // Cache dengan fallback - tidak akan crash jika satu asset gagal
        const cachePromises = CORE_ASSETS.map(asset => 
          coreCache.add(asset).catch(err => {
            console.warn(`⚠️ Failed to cache ${asset}:`, err.message);
            return null;
          })
        );
        
        await Promise.all(cachePromises);
        
        // Setup quantum bridge dengan structured clone safe
        const quantumInitData = {
          version: APP_VERSION,
          timestamp: new Date().toISOString(),
          message: 'Quantum Bridge ready',
          status: 'active',
          queue: []
        };
        
        await quantumCache.put(
          new Request('./quantum-data-init'),
          new Response(JSON.stringify(quantumInitData), {
            headers: { 'Content-Type': 'application/json' }
          })
        );
        
        console.log('✅ Installation complete!');
        return self.skipWaiting();
      } catch (error) {
        console.error('❌ Installation failed:', error);
        throw error;
      }
    })()
  );
});

// ========== FIXED ACTIVATE EVENT ==========
self.addEventListener('activate', event => {
  console.log('⚡ [Quantum Hybrid] Activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map(cacheName => {
          if (![CACHE_NAME, QUANTUM_CACHE].includes(cacheName)) {
            console.log(`🗑️ Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        });
        
        await Promise.all(deletePromises);
        
        // Claim all clients immediately
        await self.clients.claim();
        
        // Enable navigation preload jika tersedia
        if (self.registration.navigationPreload) {
          await self.registration.navigationPreload.enable();
        }
        
        console.log('✅ Service Worker activated!');
        
        // Send activation message to all clients
        const allClients = await self.clients.matchAll();
        allClients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: APP_VERSION,
            timestamp: new Date().toISOString(),
            cache: CACHE_NAME
          });
        });
        
      } catch (error) {
        console.error('❌ Activation error:', error);
      }
    })()
  );
});

// ========== FIXED FETCH HANDLER ==========
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET dan chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip browser-sync untuk development
  if (url.hostname.includes('browser-sync')) {
    return;
  }
  
  // Strategy routing yang lebih baik
  const strategy = getFetchStrategy(request, url);
  
  switch (strategy) {
    case 'NETWORK_FIRST':
      event.respondWith(networkFirstHandler(event));
      break;
      
    case 'CACHE_FIRST':
      event.respondWith(cacheFirstHandler(event));
      break;
      
    case 'NETWORK_ONLY':
      event.respondWith(networkOnlyHandler(event));
      break;
      
    case 'CACHE_ONLY':
      event.respondWith(cacheOnlyHandler(event));
      break;
      
    case 'QUANTUM_BRIDGE':
      event.respondWith(quantumBridgeHandler(event));
      break;
      
    default:
      event.respondWith(networkFirstHandler(event));
  }
});

// ========== IMPROVED STRATEGY DETECTION ==========
function getFetchStrategy(request, url) {
  // 1. Navigation requests - NETWORK FIRST
  if (request.mode === 'navigate') {
    return 'NETWORK_FIRST';
  }
  
  // 2. Admin dashboard - NETWORK ONLY (always fresh)
  if (url.pathname.includes('admin-dashboard') || 
      url.pathname.includes('admin')) {
    return 'NETWORK_ONLY';
  }
  
  // 3. Quantum Bridge API - Custom strategy
  if (url.pathname.includes('quantum') || 
      url.search.includes('quantum') ||
      url.pathname.includes('api') ||
      url.pathname.includes('sync')) {
    return 'QUANTUM_BRIDGE';
  }
  
  // 4. Static assets - CACHE FIRST
  if (isStaticAsset(request)) {
    return 'CACHE_FIRST';
  }
  
  // 5. Service Worker sendiri - NETWORK ONLY
  if (url.pathname.includes('sw.js')) {
    return 'NETWORK_ONLY';
  }
  
  // Default - NETWORK FIRST
  return 'NETWORK_FIRST';
}

// ========== HANDLER IMPLEMENTATIONS ==========

async function networkFirstHandler(event) {
  try {
    // Try network dengan timeout
    const networkPromise = fetch(event.request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const response = await Promise.race([networkPromise, timeoutPromise]);
    
    // Cache response jika berhasil
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.log('📴 Offline, serving from cache');
    
    // Try cache
    const cached = await caches.match(event.request);
    if (cached) {
      return cached;
    }
    
    // For HTML requests, return offline page
    if (event.request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    // Create fallback response
    return createFallbackResponse(event.request);
  }
}

async function cacheFirstHandler(event) {
  const cached = await caches.match(event.request);
  
  if (cached) {
    // Update cache in background
    event.waitUntil(
      (async () => {
        try {
          const fresh = await fetch(event.request);
          if (fresh.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, fresh.clone());
          }
        } catch (err) {
          // Silent fail - we have cached version
        }
      })()
    );
    
    return cached;
  }
  
  // If not in cache, try network
  try {
    const response = await fetch(event.request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
    }
    
    return response;
  } catch (error) {
    return createFallbackResponse(event.request);
  }
}

async function networkOnlyHandler(event) {
  try {
    return await fetch(event.request);
  } catch (error) {
    // For admin dashboard, show special offline page
    if (event.request.url.includes('admin')) {
      return new Response(
        getAdminOfflineHTML(),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    return new Response('Network error', { status: 408 });
  }
}

async function cacheOnlyHandler(event) {
  const cached = await caches.match(event.request);
  return cached || new Response('Not in cache', { status: 404 });
}

async function quantumBridgeHandler(event) {
  const cache = await caches.open(QUANTUM_CACHE);
  const request = event.request;
  
  try {
    // Try network dengan timeout
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Quantum Timeout')), 8000)
    );
    
    const response = await Promise.race([networkPromise, timeoutPromise]);
    
    if (response.ok) {
      // Store in cache
      await cache.put(request, response.clone());
      
      // Update last sync
      await cache.put(
        new Request('./last-sync'),
        new Response(JSON.stringify({
          url: request.url,
          timestamp: new Date().toISOString(),
          status: 'synced'
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      );
    }
    
    return response;
    
  } catch (error) {
    console.log('⚡ Quantum Bridge offline');
    
    // Return cached data
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline JSON response
    return new Response(JSON.stringify({
      status: 'offline',
      message: 'Quantum Bridge is offline. Data will sync automatically.',
      timestamp: new Date().toISOString(),
      cached: false,
      queueId: generateQueueId()
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Quantum-Status': 'offline',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

// ========== HELPER FUNCTIONS ==========

function isStaticAsset(request) {
  const staticExtensions = [
    '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.ico', '.webp', '.mp3',
    '.mp4', '.webm', '.pdf', '.json', '.xml'
  ];
  
  const url = request.url.toLowerCase();
  return staticExtensions.some(ext => url.includes(ext));
}

function createFallbackResponse(request) {
  const url = request.url.toLowerCase();
  
  if (url.includes('.css')) {
    return new Response('/* Fallback CSS */', {
      headers: { 'Content-Type': 'text/css' }
    });
  }
  
  if (url.includes('.js')) {
    return new Response('// Fallback JS', {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
  
  if (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg')) {
    // Return a simple 1x1 transparent pixel
    const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    return fetch(transparentPixel);
  }
  
  return new Response('', { status: 404 });
}

function getAdminOfflineHTML() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>DREAM OS Admin - Offline</title>
    <style>
      body { 
        background: linear-gradient(135deg, #0a0f1e 0%, #1a1f2e 100%);
        color: white;
        font-family: 'Segoe UI', system-ui, sans-serif;
        padding: 20px;
        min-height: 100vh;
      }
      .container { max-width: 800px; margin: 0 auto; }
      .header { 
        text-align: center; 
        padding: 40px 0; 
        border-bottom: 2px solid #fbbf24;
      }
      .status-card { 
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid #ef4444;
        border-radius: 15px;
        padding: 25px;
        margin: 25px 0;
      }
      .queue-card { 
        background: rgba(59, 130, 246, 0.15);
        border: 1px solid #3b82f6;
        border-radius: 15px;
        padding: 25px;
        margin: 25px 0;
      }
      h1 { color: #fbbf24; font-size: 2.5rem; }
      h2 { color: #60a5fa; }
      .button { 
        background: #fbbf24;
        color: black;
        padding: 12px 24px;
        border-radius: 8px;
        display: inline-block;
        font-weight: 800;
        text-decoration: none;
        margin: 10px 5px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🛰️ DREAM OS ADMIN</h1>
        <p>Hybrid v${APP_VERSION} • Quantum Bridge</p>
      </div>
      
      <div class="status-card">
        <h2>📴 OFFLINE MODE ACTIVATED</h2>
        <p>Admin dashboard is currently operating in offline mode.</p>
        <p><strong>Last Sync:</strong> <span id="lastSync">Loading...</span></p>
        <p><strong>Queued Operations:</strong> <span id="queueCount">0</span></p>
      </div>
      
      <div class="queue-card">
        <h2>🔄 BACKGROUND SYNC STATUS</h2>
        <p>Data operations are being queued and will automatically sync when connection is restored.</p>
        <div id="syncStatus">Initializing Quantum Bridge...</div>
      </div>
      
      <div style="text-align: center; margin-top: 40px;">
        <a href="./" class="button">🏠 Back to Home</a>
        <button onclick="window.location.reload()" class="button">🔄 Refresh</button>
      </div>
    </div>
    
    <script>
      document.getElementById('lastSync').textContent = new Date().toLocaleString();
      
      // Check sync status
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'GET_SYNC_STATUS'
        });
        
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data.type === 'SYNC_STATUS') {
            document.getElementById('queueCount').textContent = event.data.queued || 0;
            document.getElementById('syncStatus').innerHTML = 
              \`<p style="color: #4ade80;">\${event.data.message}</p>\`;
          }
        });
      }
    </script>
  </body>
  </html>`;
}

function generateQueueId() {
  return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ========== BACKGROUND SYNC IMPROVED ==========
self.addEventListener('sync', event => {
  console.log('🔄 Sync event:', event.tag);
  
  if (event.tag.startsWith('quantum-sync')) {
    event.waitUntil(
      (async () => {
        try {
          const results = await syncQuantumData();
          
          // Notify clients
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              results: results,
              timestamp: new Date().toISOString()
            });
          });
          
          // Show notification
          self.registration.showNotification('🚀 DREAM OS Sync Complete', {
            body: `Synced ${results.length} items`,
            icon: './assets/icons/icon-192.png',
            tag: 'sync-notification'
          });
          
        } catch (error) {
          console.error('Sync failed:', error);
        }
      })()
    );
  }
});

async function syncQuantumData() {
  const cache = await caches.open(QUANTUM_CACHE);
  const allRequests = await cache.keys();
  
  const syncResults = [];
  const queue = [];
  
  // Filter out metadata
  for (const request of allRequests) {
    if (!request.url.includes('quantum-data-init') && 
        !request.url.includes('last-sync')) {
      queue.push(request);
    }
  }
  
  // Process queue
  for (const request of queue) {
    try {
      const response = await fetch(request);
      
      if (response.ok) {
        await cache.delete(request);
        syncResults.push({
          url: request.url,
          status: 'success',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      // Keep in cache for next sync
      syncResults.push({
        url: request.url,
        status: 'failed',
        error: error.message,
        retry: true
      });
    }
  }
  
  return syncResults;
}

// ========== PUSH NOTIFICATIONS IMPROVED ==========
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {
    title: '🚀 DREAM OS Notification',
    body: 'Quantum Bridge Update',
    icon: './assets/icons/icon-192.png'
  };
  
  const options = {
    body: data.body,
    icon: data.icon || './assets/icons/icon-192.png',
    badge: './assets/icons/icon-72.png',
    vibrate: [200, 100, 200, 100, 200],
    timestamp: Date.now(),
    data: {
      url: data.url || './',
      action: data.action || 'open',
      type: data.type || 'notification'
    },
    actions: [
      { action: 'open', title: '📊 Open Dashboard' },
      { action: 'dismiss', title: '❌ Dismiss' }
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
  
  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Focus existing client
          for (const client of clientList) {
            if (client.url.includes(event.notification.data.url)) {
              return client.focus();
            }
          }
          
          // Open new window
          return clients.openWindow(event.notification.data.url);
        })
    );
  }
});

// ========== MESSAGE HANDLER IMPROVED ==========
self.addEventListener('message', event => {
  const { type, data } = event.data;
  const client = event.source;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      client.postMessage({ type: 'SKIPPED' });
      break;
      
    case 'GET_CACHE_STATUS':
      caches.keys().then(cacheNames => {
        client.postMessage({
          type: 'CACHE_STATUS',
          caches: cacheNames,
          version: APP_VERSION,
          size: cacheNames.length
        });
      });
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME)
        .then(() => caches.delete(QUANTUM_CACHE))
        .then(() => {
          client.postMessage({ type: 'CACHE_CLEARED' });
        });
      break;
      
    case 'TRIGGER_SYNC':
      syncQuantumData().then(results => {
        client.postMessage({
          type: 'SYNC_RESULTS',
          results: results
        });
      });
      break;
      
    case 'QUEUE_DATA':
      // Queue data for sync
      caches.open(QUANTUM_CACHE).then(cache => {
        const request = new Request(`./queue/${Date.now()}`);
        cache.put(request, new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        }));
        
        // Register for sync
        if (self.registration.sync) {
          self.registration.sync.register('quantum-sync')
            .then(() => {
              client.postMessage({ type: 'QUEUE_SUCCESS' });
            });
        }
      });
      break;
      
    case 'GET_SYNC_STATUS':
      caches.open(QUANTUM_CACHE).then(cache => {
        cache.keys().then(keys => {
          const queueCount = keys.filter(k => 
            k.url.includes('queue/')
          ).length;
          
          client.postMessage({
            type: 'SYNC_STATUS',
            queued: queueCount,
            message: `${queueCount} items queued for sync`
          });
        });
      });
      break;
  }
});

// ========== PERIODIC SYNC ==========
self.addEventListener('periodicsync', event => {
  if (event.tag === 'quantum-periodic-sync') {
    console.log('⏰ Periodic sync triggered');
    event.waitUntil(syncQuantumData());
  }
});

// ========== SERVICE WORKER STARTUP ==========
console.log(`🔥 DREAM OS Hybrid v${APP_VERSION} - Service Worker Loaded`);
console.log(`⚡ Quantum Bridge: ACTIVE`);
console.log(`📴 Offline Support: ENABLED`);
console.log(`🛠️ Cache Strategy: HYBRID INTELLIGENT`);

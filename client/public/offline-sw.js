const CACHE_NAME = 'petsos-v1';
const EMERGENCY_QUEUE_DB = 'petsos-emergency-queue';
const EMERGENCY_QUEUE_STORE = 'queued-requests';

const URLS_TO_CACHE = [
  '/',
  '/emergency',
  '/manifest.json',
];

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(EMERGENCY_QUEUE_DB, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(EMERGENCY_QUEUE_STORE)) {
        db.createObjectStore(EMERGENCY_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function queueEmergencyRequest(request) {
  const db = await openDatabase();
  const tx = db.transaction(EMERGENCY_QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(EMERGENCY_QUEUE_STORE);
  
  const clone = request.clone();
  const body = await clone.json();
  
  const queuedRequest = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries: 5,
  };
  
  await new Promise((resolve, reject) => {
    const addRequest = store.add(queuedRequest);
    addRequest.onsuccess = () => resolve();
    addRequest.onerror = () => reject(addRequest.error);
  });
  
  db.close();
  console.log('[offline-sw] Emergency request queued for later sync');
}

async function getQueuedRequests() {
  const db = await openDatabase();
  const tx = db.transaction(EMERGENCY_QUEUE_STORE, 'readonly');
  const store = tx.objectStore(EMERGENCY_QUEUE_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function removeQueuedRequest(id) {
  const db = await openDatabase();
  const tx = db.transaction(EMERGENCY_QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(EMERGENCY_QUEUE_STORE);
  
  await new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  
  db.close();
}

async function updateQueuedRequest(id, updates) {
  const db = await openDatabase();
  const tx = db.transaction(EMERGENCY_QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(EMERGENCY_QUEUE_STORE);
  
  const existingRequest = store.get(id);
  return new Promise((resolve, reject) => {
    existingRequest.onsuccess = () => {
      const request = existingRequest.result;
      if (request) {
        const updated = { ...request, ...updates };
        store.put(updated);
      }
      db.close();
      resolve();
    };
    existingRequest.onerror = () => {
      db.close();
      reject(existingRequest.error);
    };
  });
}

async function processQueuedRequests() {
  console.log('[offline-sw] Processing queued emergency requests...');
  const queuedRequests = await getQueuedRequests();
  
  if (queuedRequests.length === 0) {
    console.log('[offline-sw] No queued requests to process');
    return;
  }
  
  console.log(`[offline-sw] Found ${queuedRequests.length} queued request(s)`);
  let hasFailures = false;
  
  for (const queuedRequest of queuedRequests) {
    if (queuedRequest.retryCount >= queuedRequest.maxRetries) {
      console.log(`[offline-sw] Request ${queuedRequest.id} exceeded max retries, removing`);
      await removeQueuedRequest(queuedRequest.id);
      
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'OFFLINE_REQUEST_FAILED',
          requestId: queuedRequest.id,
          reason: 'max_retries_exceeded',
        });
      });
      continue;
    }

    try {
      const response = await fetch(queuedRequest.url, {
        method: queuedRequest.method,
        headers: {
          ...queuedRequest.headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queuedRequest.body),
        credentials: 'include',
      });
      
      if (response.ok) {
        await removeQueuedRequest(queuedRequest.id);
        console.log(`[offline-sw] Successfully sent queued request ${queuedRequest.id}`);
        
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'OFFLINE_REQUEST_SYNCED',
            requestId: queuedRequest.id,
            success: true,
          });
        });
      } else {
        console.error(`[offline-sw] Failed to send queued request ${queuedRequest.id}: ${response.status}`);
        hasFailures = true;
        await updateQueuedRequest(queuedRequest.id, { retryCount: queuedRequest.retryCount + 1 });
      }
    } catch (error) {
      console.error(`[offline-sw] Error processing queued request ${queuedRequest.id}:`, error);
      hasFailures = true;
      await updateQueuedRequest(queuedRequest.id, { retryCount: queuedRequest.retryCount + 1 });
    }
  }
  
  if (hasFailures) {
    console.log('[offline-sw] Some requests failed, will retry on next sync or online event');
  }
}

self.addEventListener('install', (event) => {
  console.log('[offline-sw] Service Worker installed');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[offline-sw] Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (event.request.method === 'POST' && url.pathname === '/api/emergency-requests') {
    event.respondWith(
      fetch(event.request.clone())
        .catch(async (error) => {
          console.log('[offline-sw] Network error for emergency request, queuing...');
          await queueEmergencyRequest(event.request.clone());
          
          if ('sync' in self.registration) {
            try {
              await self.registration.sync.register('sync-emergency-requests');
              console.log('[offline-sw] Background sync registered');
            } catch (syncError) {
              console.warn('[offline-sw] Background sync not supported:', syncError);
            }
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              queued: true,
              message: 'Request queued for sending when online',
            }),
            {
              status: 202,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }
  
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).catch(() => {
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        });
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  console.log('[offline-sw] Sync event received:', event.tag);
  
  if (event.tag === 'sync-emergency-requests') {
    event.waitUntil(processQueuedRequests());
  }
});

self.addEventListener('online', () => {
  console.log('[offline-sw] Back online, processing queue...');
  processQueuedRequests();
});

self.addEventListener('message', (event) => {
  console.log('[offline-sw] Message received:', event.data);
  
  if (event.data.type === 'GET_QUEUED_COUNT') {
    getQueuedRequests().then((requests) => {
      event.ports[0].postMessage({ count: requests.length });
    });
  }
  
  if (event.data.type === 'PROCESS_QUEUE') {
    processQueuedRequests();
  }
});

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

let firebaseInitialized = false;

async function initializeFirebase() {
  if (firebaseInitialized) return;
  
  try {
    const response = await fetch('/api/config/firebase');
    if (!response.ok) {
      console.warn('[firebase-messaging-sw.js] Firebase config not available');
      return;
    }
    
    const config = await response.json();
    
    if (!config.apiKey || !config.projectId) {
      console.warn('[firebase-messaging-sw.js] Firebase config incomplete');
      return;
    }
    
    firebase.initializeApp(config);
    firebaseInitialized = true;
    console.log('[firebase-messaging-sw.js] Firebase initialized');
    
    const messaging = firebase.messaging();
    
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);
      
      const notificationTitle = payload.notification?.title || 'PetSOS';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'petsos-notification',
        data: {
          url: payload.data?.url || '/',
        },
        actions: [
          {
            action: 'open',
            title: 'Open',
          },
        ],
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Failed to initialize Firebase:', error);
  }
}

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  event.waitUntil(initializeFirebase());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  event.waitUntil(
    Promise.all([
      initializeFirebase(),
      clients.claim()
    ])
  );
});

self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received');
});

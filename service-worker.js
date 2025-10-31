/**
 * Service Worker - InnerQuest
 * Cache offline et stratégies de mise en cache
 */

const CACHE_VERSION = 'innerquest-v1.0.0';
const CACHE_NAME = `${CACHE_VERSION}`;

// Fichiers à mettre en cache (App Shell)
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',

  // CSS
  '/css/base.css',
  '/css/layout.css',
  '/css/ui.css',
  '/css/animations.css',
  '/css/themes.css',

  // JavaScript
  '/js/main.js',
  '/js/config.js',
  '/js/utils.js',
  '/js/player.js',
  '/js/game.js',
  '/js/events.js',
  '/js/storage.js',
  '/js/ui.js',
  '/js/i18n.js',

  // Data
  '/data/events.json',
  '/data/quests.json',
  '/data/achievements.json',
  '/data/tips.json',

  // Locales
  '/locales/fr.json',

  // Fonts Google
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&family=Open+Sans:wght@300;400;600&display=swap'
];

// ========== Installation ==========

self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Caching app shell');

      return cache.addAll(STATIC_CACHE_URLS.map(url => {
        // Créer Request objects pour éviter CORS issues
        return new Request(url, { mode: 'no-cors' });
      })).catch(error => {
        console.error('[ServiceWorker] Failed to cache:', error);
        // Continue l'installation même si certains fichiers échouent
        return Promise.resolve();
      });
    }).then(() => {
      console.log('[ServiceWorker] Installation complete');
      return self.skipWaiting(); // Activer immédiatement
    })
  );
});

// ========== Activation ==========

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Supprimer les anciens caches
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Activation complete');
      return self.clients.claim(); // Prendre contrôle de tous les clients
    })
  );
});

// ========== Fetch (Stratégies de cache) ==========

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Stratégie selon le type de ressource
  if (STATIC_CACHE_URLS.includes(url.pathname) || url.pathname === '/') {
    // App shell: Cache First (priorité au cache)
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith('/assets/')) {
    // Assets (images, fonts, audio): Cache First
    event.respondWith(cacheFirst(request));
  } else if (url.origin === location.origin) {
    // Autres ressources locales: Network First
    event.respondWith(networkFirst(request));
  } else {
    // Ressources externes (fonts): Cache First
    event.respondWith(cacheFirst(request));
  }
});

// ========== Stratégies de Cache ==========

/**
 * Cache First: Priorité au cache, fallback sur réseau
 */
async function cacheFirst(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
      console.log('[ServiceWorker] Cache hit:', request.url);
      return cached;
    }

    console.log('[ServiceWorker] Cache miss, fetching:', request.url);
    const response = await fetch(request);

    // Mettre en cache si la réponse est valide
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);

    // Retourner page offline personnalisée si disponible
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      const offlinePage = await cache.match('/index.html');
      if (offlinePage) {
        return offlinePage;
      }
    }

    // Ou retourner erreur générique
    return new Response('Offline - InnerQuest est disponible hors ligne uniquement pour les ressources en cache.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

/**
 * Network First: Priorité au réseau, fallback sur cache
 */
async function networkFirst(request) {
  try {
    console.log('[ServiceWorker] Network first:', request.url);
    const response = await fetch(request);

    // Mettre en cache si succès
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);

    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Pas de cache disponible
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// ========== Messages depuis l'app ==========

self.addEventListener('message', event => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[ServiceWorker] All caches cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }

  if (event.data.action === 'getCacheSize') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.keys();
      }).then(keys => {
        console.log('[ServiceWorker] Cache size:', keys.length, 'items');
        event.ports[0].postMessage({ size: keys.length });
      })
    );
  }
});

// ========== Sync (Background Sync - optionnel) ==========

self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Sync event:', event.tag);

  if (event.tag === 'sync-game-data') {
    event.waitUntil(
      // Ici on pourrait synchroniser des données si on avait un backend
      Promise.resolve()
    );
  }
});

// ========== Push Notifications (optionnel - futur) ==========

self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received');

  const options = {
    body: event.data ? event.data.text() : 'Nouveau contenu disponible!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('InnerQuest', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification clicked');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

// ========== Logging ==========

console.log('[ServiceWorker] Loaded', CACHE_VERSION);

/**
 * AGAPE SOVEREIGN AI — Service Worker v2
 * =========================================
 * Strategy: Stale-While-Revalidate for app shell + Network-first for API.
 * Includes: Background Sync scaffold, Push Notification handler, Offline fallback.
 * Cache versioned — old caches purged on activate.
 */

const CACHE_VERSION = 'agape-sovereign-v2';
const OFFLINE_URL = '/offline.html';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/agape-logo-120.png',
  '/agape-logo-oauth.png',
  OFFLINE_URL,
];

// ── Install: pre-cache app shell ────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(APP_SHELL).catch(err => {
        console.warn('[SW] Pre-cache partial failure (expected in dev):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: purge old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: stale-while-revalidate for shell, network-first for API ───────────
self.addEventListener('fetch', event => {
  const { request } = event;

  // Skip non-GET, cross-origin, and Firebase requests
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;
  if (request.url.includes('firestore.googleapis.com')) return;
  if (request.url.includes('firebase')) return;
  if (request.url.includes('/api/')) return;

  // Navigation requests — serve from cache with network fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then(r => r || caches.match(OFFLINE_URL))
      )
    );
    return;
  }

  // Static assets — stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_VERSION).then(cache =>
      cache.match(request).then(cached => {
        const networkFetch = fetch(request).then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => cached);

        return cached || networkFetch;
      })
    )
  );
});

// ── Background Sync: queue scan results when offline ─────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sovereign-scan-sync') {
    event.waitUntil(syncScanQueue());
  }
});

async function syncScanQueue() {
  // Scaffold: in full implementation, drain IndexedDB scan queue → Firebase
  console.log('[SW] Background sync: sovereign-scan-sync triggered');
}

// ── Push Notifications: sovereign security alerts ────────────────────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Agape Sovereign Alert';
  const options = {
    body: data.body || 'A new identity event has been detected.',
    icon: '/agape-logo-120.png',
    badge: '/agape-logo-120.png',
    tag: data.tag || 'sovereign-alert',
    data: { url: data.url || '/dashboard' },
    actions: [
      { action: 'view', title: 'View Dashboard' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/dashboard';
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        const existing = clients.find(c => c.url.includes(self.location.origin));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      })
    );
  }
});

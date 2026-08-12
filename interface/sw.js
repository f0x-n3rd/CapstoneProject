const CACHE_NAME = 'muni-app-v1';

// 1. Install Event: Mabilis na pag-install nang hindi naghihintay
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// 2. Activate Event: Paglilinis ng mga lumang cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 3. Dynamic Cache & Fetch: Kapag in-open ang page o icon, i-sa-save ito kusa sa cache
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      // Kung naka-cache na, ibalik agad para instant load
      if (cached) return cached;

      // Kung wala pa sa cache, i-fetch sa network at i-save
      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return response;
      });
    })
  );
});
const CACHE = 'lockin-v3';
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const isPage = e.request.mode === 'navigate' || e.request.url.endsWith('index.html') || e.request.url.endsWith('/');
  if (isPage) {
    // Network-first for the app itself, so new versions show up right away.
    e.respondWith(
      fetch(e.request).then((res) => {
        caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first for static assets (icons, manifest).
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => cached))
    );
  }
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(e.data.title || 'Lock In', {
      body: e.data.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
    });
  }
});

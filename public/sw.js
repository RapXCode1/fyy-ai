self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Minimal fetch handler to pass PWA installation criteria
  event.respondWith(fetch(event.request).catch(() => {
    return new Response('Offline Mode', { status: 503, statusText: 'Offline' });
  }));
});

// Service Worker APXFITNESS
const CACHE_NAME = 'apxfitness-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Laisser passer toutes les requêtes normalement
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

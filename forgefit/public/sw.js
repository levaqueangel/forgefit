// Service Worker APXFITNESS — push + cache offline
const CACHE_NAME = "apxfitness-v2";
const PRECACHE = ["/client", "/manifest.json", "/icon-192.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// Stale-while-revalidate pour /client (lecture programme offline)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  // Ne pas intercepter les API calls
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fresh = fetch(event.request).then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});

// Gestion des push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: "APXFITNESS", body: event.data.text() }; }
  const options = {
    body: data.body || "Nouveau message de ton coach",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/client" },
  };
  event.waitUntil(
    self.registration.showNotification(data.title || "APXFITNESS", options)
  );
});

// Clic sur notification → ouvre /client
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/client") && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data?.url || "/client");
    })
  );
});

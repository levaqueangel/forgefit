// Service Worker minimal APXFITNESS
// FIX: fichier sw.js manquant (causait des erreurs 404 en console)

const CACHE_NAME = "apxfitness-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
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

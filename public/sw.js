// Service Worker APXFITNESS v4 — Push notifications + cache intelligent
const VERSION = "apxfitness-v4";
const STATIC_CACHE = `${VERSION}-static`;
const DYNAMIC_CACHE = `${VERSION}-dynamic`;
const PRECACHE_URLS = ["/", "/blog", "/faq", "/calculateur"];

// ── Installation ──────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {})
    )
  );
  self.skipWaiting();
});

// ── Activation : nettoyer anciens caches ──────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
            .map((k) => caches.delete(k))
        )
      ),
      clients.claim(),
    ])
  );
});

// ── Fetch : stratégie Network First pour HTML, Cache First pour assets ─
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.hostname.includes("google-analytics")) return;

  // Assets Next.js statiques : Cache First (immutables)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) caches.open(STATIC_CACHE).then((c) => c.put(request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // Images et polices : Cache First
  if (url.pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|avif|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) caches.open(DYNAMIC_CACHE).then((c) => c.put(request, res.clone()));
          return res;
        }).catch(() => cached || new Response("", { status: 404 }));
      })
    );
    return;
  }

  // Pages HTML : Network First avec fallback cache
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/"))
      )
  );
});

// ── Push Notifications ────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "APXFITNESS", body: "Tu as un nouveau message de ton coach.", icon: "/icon-192.png", badge: "/icon-72.png" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/icon-72.png",
      tag: data.tag || "apxfitness",
      requireInteraction: false,
      data: { url: data.url || "/client" },
      actions: data.actions || [
        { action: "open", title: "Voir le message" },
        { action: "close", title: "Ignorer" },
      ],
    })
  );
});

// Clic sur la notification → ouvrir la page client
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const urlToOpen = event.notification.data?.url || "/client";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Si l'app est déjà ouverte, focus + navigation
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus().then(() => client.navigate(urlToOpen));
        }
      }
      // Sinon ouvrir un nouvel onglet
      return clients.openWindow(urlToOpen);
    })
  );
});

// ── Messages depuis l'app ────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_CACHE") {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

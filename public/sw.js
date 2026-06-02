// Service Worker APXFITNESS v5 — Mode hors-ligne renforcé
const VERSION = "apxfitness-v5";
const STATIC_CACHE  = `${VERSION}-static`;
const DYNAMIC_CACHE = `${VERSION}-dynamic`;
const DATA_CACHE    = `${VERSION}-data`;    // Cache des données Firestore

// Pages pré-chargées à l installation
const PRECACHE_URLS = [
  "/",
  "/client",
  "/blog",
  "/calculateur",
  "/faq",
  "/offline",
];

// ── Installation ────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── Activation : nettoyer anciens caches ────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith("apxfitness-") && k !== STATIC_CACHE && k !== DYNAMIC_CACHE && k !== DATA_CACHE)
              .map((k) => caches.delete(k))
        )
      ),
      clients.claim(),
    ])
  );
});

// ── Fetch handler ────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.hostname.includes("google-analytics")) return;
  if (url.hostname.includes("firebaseio.com")) return;
  if (url.hostname.includes("googleapis.com") && !url.pathname.includes("fonts")) return;

  // Assets Next.js statiques (immuables, hash dans le nom) — Cache First
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            caches.open(STATIC_CACHE).then((c) => c.put(request, res.clone()));
          }
          return res;
        }).catch(() => cached || new Response("", { status: 408 }));
      })
    );
    return;
  }

  // Polices Google — Cache First avec longue durée
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) caches.open(DYNAMIC_CACHE).then((c) => c.put(request, res.clone()));
          return res;
        }).catch(() => cached || new Response("", { status: 408 }));
      })
    );
    return;
  }

  // Images et médias — Cache First
  if (url.pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|avif|woff|woff2|gif)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) caches.open(DYNAMIC_CACHE).then((c) => c.put(request, res.clone()));
          return res;
        }).catch(() => cached || new Response("", { status: 408 }));
      })
    );
    return;
  }

  // API Routes — Network only, pas de cache (sécurité + fraîcheur des données)
  if (url.pathname.startsWith("/api/")) {
    return; // Laisse le browser gérer
  }

  // Pages HTML — Network First avec fallback cache puis /offline
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Fallback vers la page /client si c est une page client
        if (url.pathname.startsWith("/client")) {
          const clientCache = await caches.match("/client");
          if (clientCache) return clientCache;
        }
        // Fallback vers l accueil
        return caches.match("/") || new Response("Hors ligne", { status: 503 });
      })
  );
});

// ── Push Notifications ───────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {
    title: "APXFITNESS",
    body: "Tu as un nouveau message de ton coach.",
    icon: "/icon-192.png",
    badge: "/icon-72.png",
  };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/icon-72.png",
      tag: data.tag || "apxfitness",
      requireInteraction: false,
      data: { url: data.url || "/client" },
      actions: [
        { action: "open",  title: "Voir le message" },
        { action: "close", title: "Ignorer" },
      ],
    })
  );
});

// ── Clic notification ────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const urlToOpen = event.notification.data?.url || "/client";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (win.url.includes(self.location.origin)) {
          return win.focus().then(() => win.navigate(urlToOpen));
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

// ── Sync arrière-plan (si supporté) ─────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-mesures") {
    // Synchroniser les mesures en attente
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  // Nettoyer le cache des données en attente (sync désactivée, /api/sync non implémenté)
  try {
    const cache = await caches.open(DATA_CACHE);
    const keys = await cache.keys();
    for (const key of keys) {
      if (key.url.includes("pending-")) {
        await cache.delete(key);
      }
    }
  } catch {}
}

// ── Messages depuis l app ─────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_CACHE") {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
  // Sauvegarder des données pour sync hors-ligne
  if (event.data?.type === "CACHE_DATA") {
    caches.open(DATA_CACHE).then((cache) => {
      const key = `pending-${Date.now()}`;
      cache.put(key, new Response(JSON.stringify(event.data.payload)));
    });
  }
});

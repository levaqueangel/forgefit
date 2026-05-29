// Service Worker APXFITNESS v3
// Cache busting automatique : changer VERSION force le rechargement de tous les clients
const VERSION = "apxfitness-v3";
const STATIC_CACHE = `${VERSION}-static`;
const DYNAMIC_CACHE = `${VERSION}-dynamic`;

// Pages à précacher au démarrage
const PRECACHE_URLS = ["/", "/blog", "/faq", "/mentions-legales"];

// ── Installation : précacher les pages principales ────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {}) // Silencieux si offline au build
    )
  );
  // Prendre le contrôle immédiatement sans attendre
  self.skipWaiting();
});

// ── Activation : supprimer TOUS les anciens caches ────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Nettoyer les caches obsolètes
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
            .map((k) => {
              console.log("[SW] Suppression ancien cache:", k);
              return caches.delete(k);
            })
        )
      ),
      // Prendre le contrôle de tous les onglets ouverts
      clients.claim(),
    ])
  );
});

// ── Fetch : stratégie intelligente par type de ressource ─────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET, les APIs et les analytics
  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.hostname.includes("google-analytics") || url.hostname.includes("analytics")) return;

  // Assets Next.js (_next/static) : Cache First (immutable)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Images et polices : Cache First avec mise en cache dynamique
  if (
    url.pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|avif|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        }).catch(() => cached || new Response("", { status: 404 }));
      })
    );
    return;
  }

  // Pages HTML : Network First avec fallback cache
  // Important : si le réseau répond, on met à jour le cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) => cached || caches.match("/") // Fallback page d'accueil
        )
      )
  );
});

// ── Message : forcer la mise à jour depuis l'app ─────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "CLEAR_CACHE") {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

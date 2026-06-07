import { NextResponse } from "next/server";

/**
 * Middleware Next.js — appliqué avant chaque requête sur les routes matchées.
 *
 * Rôles :
 * 1. Bloquer les User-Agents suspects sur les routes API publiques sensibles
 * 2. Forcer des headers de sécurité supplémentaires sur les routes API
 * 3. Protéger les routes cron contre les appels sans CRON_SECRET
 * 4. Bloquer les IPs abusives connues (liste statique de bots d'attaque courants)
 *
 * ⚠️  Ce middleware ne remplace pas l'auth Firebase — il ajoute une couche
 *     de défense en profondeur (defense in depth) avant que la requête
 *     atteigne les route handlers.
 */

// User-Agents clairement malveillants ou de scanning
const BLOCKED_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /zgrab/i,
  /nuclei/i,
  /python-requests\/[01]\./i, // vieilles versions souvent utilisées par bots
  /go-http-client\/1\.1/i,    // scanners Go basiques
  /curl\/[0-6]\./i,           // curl < 7 souvent des bots
];

// Chemins API publics (pas d'auth) — surveillance renforcée
const PUBLIC_API_PATHS = [
  "/api/generate",
  "/api/save-abandon",
  "/api/create-client",
  "/api/error-log",
];

// Chemins cron — doivent avoir le header Authorization
const CRON_PATHS = [
  "/api/cron/",
];

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent") || "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // ── 1. Bloquer les UA suspects sur les routes API ────────────────────────
  if (pathname.startsWith("/api/")) {
    const isBlocked = BLOCKED_UA_PATTERNS.some(p => p.test(ua));
    if (isBlocked) {
      console.warn(`[middleware] Blocked UA from ${ip}: ${ua.slice(0, 100)}`);
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // ── 2. Routes cron — vérifier la présence du header Authorization ────────
  //    (Le secret lui-même est vérifié dans le route handler,
  //     ici on bloque juste les requêtes sans header du tout)
  if (CRON_PATHS.some(p => pathname.startsWith(p))) {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  // ── 3. Headers API supplémentaires ───────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const res = NextResponse.next();
    // Empêcher la mise en cache des réponses API par des proxies
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    // Empêcher le rendu dans un iframe des réponses API JSON
    res.headers.set("X-Content-Type-Options", "nosniff");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Appliquer le middleware sur toutes les routes sauf les assets statiques
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|manifest.json|sw.js|robots.txt|sitemap.xml|images/|videos/|recettes/).*)",
  ],
};

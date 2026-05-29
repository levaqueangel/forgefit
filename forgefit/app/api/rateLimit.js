// Simple in-memory rate limiter
// Utilise un Map pour stocker les timestamps des dernières requêtes par IP
const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 requêtes max par minute par IP

export function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip || "unknown";

  if (!requestCounts.has(key)) {
    requestCounts.set(key, []);
  }

  // Nettoyer les requêtes hors fenêtre
  const times = requestCounts.get(key).filter(t => now - t < WINDOW_MS);
  times.push(now);
  requestCounts.set(key, times);

  // Nettoyer les IPs inactives toutes les 1000 requêtes pour éviter les fuites mémoire
  if (requestCounts.size > 1000) {
    for (const [k, v] of requestCounts.entries()) {
      if (v.every(t => now - t > WINDOW_MS)) requestCounts.delete(k);
    }
  }

  return times.length <= MAX_REQUESTS;
}

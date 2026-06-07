/**
 * Rate limiter — Upstash Redis (partagé entre toutes les instances Vercel)
 * Fallback automatique sur Map en mémoire si Redis non configuré.
 *
 * Variables d'env requises pour Redis :
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Sans ces variables → fallback mémoire (comportement précédent).
 */

// ── Fallback en mémoire (si Redis absent) ────────────────────────────────────
const WINDOWS = new Map();

function checkRateLimitMemory(key, maxRequests, windowMs) {
  const now = Date.now();
  const k = String(key || "unknown").slice(0, 128);
  const win = WINDOWS.get(k);
  if (!win || now > win.resetAt) {
    WINDOWS.set(k, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (win.count >= maxRequests) return false;
  win.count++;
  return true;
}

// Nettoyage du Map toutes les 5 minutes + cap taille
setInterval(() => {
  const now = Date.now();
  if (WINDOWS.size > 10000) { WINDOWS.clear(); return; }
  for (const [k, v] of WINDOWS.entries()) {
    if (now > v.resetAt) WINDOWS.delete(k);
  }
}, 300_000);

// ── Upstash Redis (si configuré) ─────────────────────────────────────────────
let redisClient = null;
let Ratelimit = null;
const rateLimiters = new Map(); // cache des instances Ratelimit par config

async function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (redisClient) return redisClient;
  try {
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit: RL } = await import("@upstash/ratelimit");
    Ratelimit = RL;
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redisClient;
  } catch (e) {
    console.warn("Upstash Redis indisponible, fallback mémoire :", e.message);
    return null;
  }
}

function getRateLimiter(maxRequests, windowMs) {
  const cacheKey = `${maxRequests}:${windowMs}`;
  if (rateLimiters.has(cacheKey)) return rateLimiters.get(cacheKey);
  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(maxRequests, `${Math.round(windowMs / 1000)} s`),
    prefix: "apx:rl",
  });
  rateLimiters.set(cacheKey, limiter);
  return limiter;
}

// ── API publique ─────────────────────────────────────────────────────────────

/**
 * @param {string} key          - Identifiant : IP, UID, email…
 * @param {number} maxRequests  - Max requêtes dans la fenêtre
 * @param {number} windowMs     - Durée de la fenêtre en millisecondes
 * @returns {Promise<boolean>}  - true = autorisé, false = bloqué
 */
export async function checkRateLimit(key, maxRequests = 20, windowMs = 60_000) {
  const k = String(key || "unknown").slice(0, 128);

  try {
    const redis = await getRedis();
    if (!redis) return checkRateLimitMemory(k, maxRequests, windowMs);

    const limiter = getRateLimiter(maxRequests, windowMs);
    const { success } = await limiter.limit(k);
    return success;
  } catch (e) {
    // Si Redis répond mal → fail open (on laisse passer, on ne bloque pas les vrais clients)
    console.error("Rate limit Redis erreur, fail open :", e.message);
    return checkRateLimitMemory(k, maxRequests, windowMs);
  }
}

/**
 * Double rate limit : par IP ET par clé secondaire (UID, email…)
 * Les deux doivent passer pour que la requête soit autorisée.
 *
 * @param {string} ip
 * @param {string} secondaryKey  - UID Firebase ou email
 * @param {number} maxPerIp
 * @param {number} maxPerKey
 * @param {number} windowMs
 * @returns {Promise<boolean>}
 */
export async function checkRateLimitDouble(ip, secondaryKey, maxPerIp = 30, maxPerKey = 20, windowMs = 60_000) {
  const [ipOk, keyOk] = await Promise.all([
    checkRateLimit(`ip:${ip}`, maxPerIp, windowMs),
    checkRateLimit(`uid:${secondaryKey}`, maxPerKey, windowMs),
  ]);
  return ipOk && keyOk;
}

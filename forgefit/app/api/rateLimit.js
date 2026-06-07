/**
 * Rate limiter en mémoire — par IP ou par clé arbitraire (UID, email…)
 *
 * ⚠️  Limitation serverless : chaque instance lambda a son propre Map.
 *     En cas de forte charge, Vercel peut instancier plusieurs lambdas
 *     et les compteurs ne sont pas partagés entre elles. Ce rate limiter
 *     reste efficace contre les abus simples (bots à source unique) mais
 *     pas contre les attaques distribuées sophistiquées.
 *     Solution complète : remplacer par un compteur Redis (Upstash).
 */

const WINDOWS = new Map(); // key -> { count, resetAt }

/**
 * @param {string} key        - Identifiant : IP, UID, email…
 * @param {number} maxRequests - Max requêtes autorisées dans la fenêtre
 * @param {number} windowMs   - Durée de la fenêtre en millisecondes
 * @returns {boolean}          - true = autorisé, false = bloqué
 */
export function checkRateLimit(key, maxRequests = 20, windowMs = 60_000) {
  const now = Date.now();
  const k   = String(key || "unknown").slice(0, 128); // cap la longueur de la clé

  const win = WINDOWS.get(k);

  if (!win || now > win.resetAt) {
    WINDOWS.set(k, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (win.count >= maxRequests) return false;
  win.count++;
  return true;
}

/**
 * Double rate limit : par IP ET par clé secondaire (UID, email…)
 * Les deux doivent passer pour que la requête soit autorisée.
 * Utile pour les routes authentifiées : bloque l'IP ET le compte compromis.
 *
 * @param {string} ip
 * @param {string} secondaryKey  - UID Firebase ou email
 * @param {number} maxPerIp
 * @param {number} maxPerKey
 * @param {number} windowMs
 * @returns {boolean}
 */
export function checkRateLimitDouble(ip, secondaryKey, maxPerIp = 30, maxPerKey = 20, windowMs = 60_000) {
  const ipOk  = checkRateLimit(`ip:${ip}`,          maxPerIp,  windowMs);
  const keyOk = checkRateLimit(`uid:${secondaryKey}`, maxPerKey, windowMs);
  return ipOk && keyOk;
}

// Nettoyage des entrées expirées toutes les 5 minutes
// évite que le Map grossisse indéfiniment en cas de trafic élevé
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of WINDOWS.entries()) {
    if (now > v.resetAt) WINDOWS.delete(k);
  }
}, 300_000);

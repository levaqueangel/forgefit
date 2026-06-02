// Rate limiter simple en mémoire — réinitialise toutes les 60s
const WINDOWS = new Map(); // ip -> { count, resetAt }

export function checkRateLimit(ip, maxRequests = 20, windowMs = 60_000) {
  const now  = Date.now();
  const key  = ip || "unknown";
  const win  = WINDOWS.get(key);

  if (!win || now > win.resetAt) {
    WINDOWS.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (win.count >= maxRequests) return false;
  win.count++;
  return true;
}

// Nettoyer les entrées expirées toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of WINDOWS.entries()) {
    if (now > v.resetAt) WINDOWS.delete(k);
  }
}, 300_000);

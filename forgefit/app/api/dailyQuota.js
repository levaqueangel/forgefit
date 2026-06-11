import { getAdminDb } from "./firebase-admin";

export const PLAN_LIMITS = {
  starter: { chat: 0, photo: 0 },
  forge:   { chat: 10, photo: 4 },
  elite:   { chat: 20, photo: 6 },
};

/**
 * Vérifie et incrémente le compteur journalier d'un client.
 * Retourne { allowed, remaining, limit, plan }
 * Le compteur est remis à zéro automatiquement chaque nouveau jour.
 */
export async function checkAndIncrementDailyQuota(uid, type) {
  const db = getAdminDb();
  const ref = db.collection("clients").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return { allowed: false, remaining: 0, limit: 0 };

  const data = snap.data();
  const plan = (data.plan || "forge").toLowerCase();
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.forge;
  const limit = limits[type];

  if (limit === 0) {
    return { allowed: false, remaining: 0, limit: 0, plan };
  }

  const today = new Date().toDateString();
  const usage = data.dailyUsage || {};
  const isToday = usage.date === today;

  const chatCount  = isToday ? (usage.chatCount  || 0) : 0;
  const photoCount = isToday ? (usage.photoCount || 0) : 0;
  const currentCount = type === "chat" ? chatCount : photoCount;

  if (currentCount >= limit) {
    return { allowed: false, remaining: 0, limit, plan };
  }

  const newChatCount  = type === "chat"  ? currentCount + 1 : chatCount;
  const newPhotoCount = type === "photo" ? currentCount + 1 : photoCount;

  await ref.update({
    dailyUsage: { date: today, chatCount: newChatCount, photoCount: newPhotoCount },
  });

  const remaining = limit - (type === "chat" ? newChatCount : newPhotoCount);
  return { allowed: true, remaining, limit, plan };
}

import { getAdminDb, verifyAuthToken } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

// ── GET — historique des séances (pour comparaison "dernière fois") ──────────
export async function GET(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 30, 60_000))
    return Response.json({ error: "Trop de requêtes." }, { status: 429 });

  try {
    const decoded = await verifyAuthToken(req);
    if (!decoded) return Response.json({ error: "Non autorisé." }, { status: 401 });

    const uid = new URL(req.url).searchParams.get("uid");
    if (!uid || decoded.uid !== uid)
      return Response.json({ error: "Accès refusé." }, { status: 403 });

    const db = getAdminDb();
    const snap = await db.collection("clients").doc(uid).get();
    if (!snap.exists) return Response.json({ historique: [] });

    const historique = (snap.data().seanceHistorique || []).slice(-20);
    return Response.json({ historique });
  } catch (e) {
    console.error("seance GET:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

// ── POST — sauvegarder une séance complétée ───────────────────────────────────
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 20, 60_000))
    return Response.json({ error: "Trop de requêtes." }, { status: 429 });

  try {
    const decoded = await verifyAuthToken(req);
    if (!decoded) return Response.json({ error: "Non autorisé." }, { status: 401 });

    const body = await req.json();
    const { uid, seanceNom, date, dateTs, dureeMin, exercices, rating } = body;

    if (!uid || decoded.uid !== uid)
      return Response.json({ error: "Accès refusé." }, { status: 403 });
    if (!seanceNom || !exercices?.length)
      return Response.json({ error: "Données manquantes." }, { status: 400 });

    const db = getAdminDb();
    const ref = db.collection("clients").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return Response.json({ error: "Client introuvable." }, { status: 404 });

    const data = snap.data();

    // ── Historique séances (max 50) ──────────────────────────────────────────
    const historique = data.seanceHistorique || [];
    const newEntry = {
      seanceNom,
      date: date || new Date().toDateString(),
      dateTs: dateTs || Date.now(),
      dureeMin: dureeMin || 0,
      exercices,
      rating: rating || null,
    };
    const updatedHistorique = [...historique, newEntry].slice(-50);

    // ── Streak séance ────────────────────────────────────────────────────────
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const lastActive = data.lastActiveDate;
    const curStreak = data.streakDays || 0;
    const newStreak =
      lastActive === today ? curStreak :
      lastActive === yesterday ? curStreak + 1 : 1;

    // ── Session ratings (pour dashboard coach) ───────────────────────────────
    const sessionRatings = data.sessionRatings || [];
    const updatedRatings = rating
      ? [...sessionRatings, {
          seance: seanceNom,
          date: today,
          difficulte: rating.difficulte,
          energie: rating.energie,
        }].slice(-20)
      : sessionRatings;

    // ── Badge : première séance complète ────────────────────────────────────
    const badges = data.badges || [];
    const hasFirstSeance = badges.some(b => b.type === "premiere_seance");
    if (!hasFirstSeance) {
      badges.push({ type: "premiere_seance", date: today, label: "Première séance guidée" });
    }

    // ── Badge : 10 séances complètes ────────────────────────────────────────
    if (updatedHistorique.length === 10) {
      const has10 = badges.some(b => b.type === "seances_10");
      if (!has10) badges.push({ type: "seances_10", date: today, label: "10 séances complètes" });
    }
    if (updatedHistorique.length === 50) {
      const has50 = badges.some(b => b.type === "seances_50");
      if (!has50) badges.push({ type: "seances_50", date: today, label: "50 séances complètes" });
    }

    await ref.update({
      seanceHistorique: updatedHistorique,
      sessionRatings: updatedRatings,
      badges,
      streakDays: newStreak,
      lastActiveDate: today,
    });

    return Response.json({
      ok: true,
      streakDays: newStreak,
      totalSeances: updatedHistorique.length,
      newBadges: badges.filter(b =>
        ["premiere_seance","seances_10","seances_50"].includes(b.type) &&
        b.date === today
      ),
    });
  } catch (e) {
    console.error("seance POST:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

import { getAdminDb, verifyAuthToken } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

// ── Calcul du score /100 ──────────────────────────────────────────────────────
function calcScore(sommeil, stress, courbatures) {
  // sommeil 1-5 : poids 40%  (plus c'est haut, mieux c'est)
  // stress  1-5 : poids 35%  (inversé — plus bas = moins stressé = mieux)
  // courbatures 1-5 : poids 25% (inversé — plus bas = moins de douleur = mieux)
  return Math.round(
    (sommeil / 5) * 40 +
    ((6 - stress) / 5) * 35 +
    ((6 - courbatures) / 5) * 25
  );
}

function getRecommandation(score) {
  if (score < 40) return { label: "Repos aujourd'hui", detail: "Marche légère ou étirements seulement.", couleur: "#E07070", emoji: "😴" };
  if (score < 55) return { label: "Séance légère", detail: "Cardio doux ou mobilité — évite l'intensité.", couleur: "#E8C87A", emoji: "🚶" };
  if (score < 70) return { label: "Séance normale", detail: "Suis ton programme sans te forcer.", couleur: "#C9A84C", emoji: "💪" };
  if (score < 85) return { label: "Bonne forme", detail: "Donne tout — tu es prêt(e) !", couleur: "#7AE07A", emoji: "🔥" };
  return { label: "Forme optimale", detail: "Séance intensive — repousse tes limites !", couleur: "#5DCAA5", emoji: "⚡" };
}

// ── POST — enregistrer le check-in du jour ────────────────────────────────────
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!await checkRateLimit(ip, 10, 60_000))
    return Response.json({ error: "Trop de requêtes." }, { status: 429 });

  try {
    const decoded = await verifyAuthToken(req);
    if (!decoded) return Response.json({ error: "Non autorisé." }, { status: 401 });

    const { uid, sommeil, stress, courbatures } = await req.json();
    if (!uid || decoded.uid !== uid)
      return Response.json({ error: "Accès refusé." }, { status: 403 });

    const s = Math.min(5, Math.max(1, parseInt(sommeil) || 3));
    const st = Math.min(5, Math.max(1, parseInt(stress) || 3));
    const c = Math.min(5, Math.max(1, parseInt(courbatures) || 3));

    const score = calcScore(s, st, c);
    const recommandation = getRecommandation(score);
    const today = new Date().toDateString();

    const db = getAdminDb();
    const ref = db.collection("clients").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return Response.json({ error: "Client introuvable." }, { status: 404 });

    const data = snap.data();
    const historique = data.readinessScores || [];

    // Un seul check-in par jour — remplacer si déjà fait
    const filtered = historique.filter(r => r.date !== today);
    const entry = { date: today, dateTs: Date.now(), sommeil: s, stress: st, courbatures: c, score, recommandation };
    const updated = [...filtered, entry].slice(-90); // garder 90 jours

    await ref.update({ readinessScores: updated });

    return Response.json({ ok: true, score, recommandation, entry });
  } catch (e) {
    console.error("readiness POST:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

// ── GET — check-in du jour + historique ───────────────────────────────────────
export async function GET(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!await checkRateLimit(ip, 30, 60_000))
    return Response.json({ error: "Trop de requêtes." }, { status: 429 });

  try {
    const decoded = await verifyAuthToken(req);
    if (!decoded) return Response.json({ error: "Non autorisé." }, { status: 401 });

    const uid = new URL(req.url).searchParams.get("uid");
    if (!uid || decoded.uid !== uid)
      return Response.json({ error: "Accès refusé." }, { status: 403 });

    const db = getAdminDb();
    const snap = await db.collection("clients").doc(uid).get();
    if (!snap.exists) return Response.json({ today: null, historique: [] });

    const historique = snap.data().readinessScores || [];
    const today = new Date().toDateString();
    const todayEntry = historique.find(r => r.date === today) || null;

    return Response.json({ today: todayEntry, historique: historique.slice(-30) });
  } catch (e) {
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

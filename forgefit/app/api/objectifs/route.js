import { getAdminDb, verifyAuthToken } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

// ── GET — récupérer les objectifs de la semaine d'un client ───────────────
export async function GET(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 30, 60_000)) return Response.json({ error: "Trop de requêtes." }, { status: 429 });

  const decoded = await verifyAuthToken(req);
  if (!decoded) return Response.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId") || decoded.uid;

  // Seul le client lui-même ou le coach peut lire
  const db = getAdminDb();
  const coachEmail = process.env.NEXT_PUBLIC_COACH_EMAIL || "coach.apxfitness11@gmail.com";
  if (decoded.uid !== clientId && decoded.email !== coachEmail) {
    return Response.json({ error: "Interdit" }, { status: 403 });
  }

  try {
    const snap = await db.collection("clients").doc(clientId).get();
    if (!snap.exists) return Response.json({ error: "Client introuvable" }, { status: 404 });

    const data = snap.data();
    return Response.json({
      objectifs: data.objectifsHebdo || [],
      coches: data.objectifsCoches || {},
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// ── POST — le coach définit les objectifs d'un client ─────────────────────
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 10, 60_000)) return Response.json({ error: "Trop de requêtes." }, { status: 429 });

  const decoded = await verifyAuthToken(req);
  if (!decoded) return Response.json({ error: "Non autorisé" }, { status: 401 });

  const coachEmail = process.env.NEXT_PUBLIC_COACH_EMAIL || "coach.apxfitness11@gmail.com";
  if (decoded.email !== coachEmail) return Response.json({ error: "Réservé au coach" }, { status: 403 });

  try {
    const { clientId, objectifs } = await req.json();
    if (!clientId) return Response.json({ error: "clientId manquant" }, { status: 400 });
    if (!Array.isArray(objectifs) || objectifs.length === 0 || objectifs.length > 5) {
      return Response.json({ error: "1 à 5 objectifs requis" }, { status: 400 });
    }

    const db = getAdminDb();
    const weekKey = getWeekKey();
    await db.collection("clients").doc(clientId).update({
      objectifsHebdo: objectifs.map(o => ({ id: Math.random().toString(36).slice(2), texte: o, semaine: weekKey })),
      objectifsCoches: {}, // Reset les coches pour la nouvelle semaine
      objectifsSemaine: weekKey,
    });

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// ── PATCH — le client coche/décoche un objectif ──────────────────────────
export async function PATCH(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 20, 60_000)) return Response.json({ error: "Trop de requêtes." }, { status: 429 });

  const decoded = await verifyAuthToken(req);
  if (!decoded) return Response.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { objectifId, done } = await req.json();
    if (!objectifId) return Response.json({ error: "objectifId manquant" }, { status: 400 });

    const db = getAdminDb();
    const snap = await db.collection("clients").doc(decoded.uid).get();
    if (!snap.exists) return Response.json({ error: "Client introuvable" }, { status: 404 });

    const data = snap.data();
    const coches = data.objectifsCoches || {};
    coches[objectifId] = !!done;

    // Vérifier si tous les objectifs sont cochés → badge
    const objectifs = data.objectifsHebdo || [];
    const tousFaits = objectifs.length > 0 && objectifs.every(o => coches[o.id]);

    const update = { objectifsCoches: coches };
    if (tousFaits) {
      const weekKey = getWeekKey();
      const badges = data.badges || [];
      if (!badges.some(b => b.type === "objectifs_semaine" && b.semaine === weekKey)) {
        badges.push({ type: "objectifs_semaine", semaine: weekKey, date: new Date().toISOString() });
        update.badges = badges;
      }
    }

    await db.collection("clients").doc(decoded.uid).update(update);
    return Response.json({ success: true, tousFaits });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

function getWeekKey() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

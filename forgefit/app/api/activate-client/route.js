import { getAdminAuth, getAdminDb } from "../firebase-admin";
export const dynamic = "force-dynamic";

const COACH_EMAIL = process.env.NEXT_PUBLIC_COACH_EMAIL || "coach.apxfitness11@gmail.com";

// Vérifie que le requêteur est bien le coach
async function verifyCoach(req) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    if (decoded.email !== COACH_EMAIL) return null;
    return decoded;
  } catch { return null; }
}

export async function POST(req) {
  const coach = await verifyCoach(req);
  if (!coach) return Response.json({ error: "Non autorisé." }, { status: 403 });

  const { email, nom, plan, orderId } = await req.json();
  if (!email || !plan) return Response.json({ error: "Email et plan requis." }, { status: 400 });

  const safeEmail = email.trim().toLowerCase();
  const safePlan  = (plan || "forge").toLowerCase();
  const safeNom   = (nom || safeEmail.split("@")[0]).trim();

  try {
    const adminAuth = getAdminAuth();
    const db = getAdminDb();

    // Récupérer ou créer le compte Firebase Auth
    let uid;
    let isNew = false;
    try {
      const existing = await adminAuth.getUserByEmail(safeEmail);
      uid = existing.uid;
    } catch (e) {
      if (e.code !== "auth/user-not-found") throw e;
      // Créer le compte
      const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
      const password = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const newUser = await adminAuth.createUser({ email: safeEmail, password, displayName: safeNom });
      uid = newUser.uid;
      isNew = true;
    }

    // Créer/mettre à jour le doc clients/{uid}
    await db.collection("clients").doc(uid).set({
      nom: safeNom,
      email: safeEmail,
      plan: safePlan,
      status: "actif",
      programme: null,
      programmeData: null,
      objectifs: [],
      seances: [],
      readinessScores: [],
      activatedAt: new Date().toISOString(),
      activatedBy: "coach",
    }, { merge: true });

    // Mettre à jour le doc order si orderId fourni
    if (orderId) {
      try {
        await db.collection("orders").doc(orderId).update({
          activated: true,
          activatedAt: new Date().toISOString(),
          clientUid: uid,
        });
      } catch {}
    }

    return Response.json({ success: true, uid, isNew });
  } catch (e) {
    console.error("activate-client error:", e.message);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

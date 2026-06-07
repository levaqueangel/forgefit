import { getAdminAuth, getAdminDb } from "../../firebase-admin";
export const dynamic = "force-dynamic";

const COACH_EMAIL = process.env.COACH_EMAIL || process.env.NEXT_PUBLIC_COACH_EMAIL || "coach.apxfitness11@gmail.com";

async function verifyCoach(req) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(auth.slice(7));
    if (decoded.email !== COACH_EMAIL) return null;
    return decoded;
  } catch { return null; }
}

// GET — liste les docs fantômes (sans suppression)
export async function GET(req) {
  const coach = await verifyCoach(req);
  if (!coach) return Response.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const db = getAdminDb();
    const auth = getAdminAuth();

    const snap = await db.collection("clients").get();
    const phantoms = [];
    const valid = [];

    for (const doc of snap.docs) {
      const uid = doc.id;
      const data = doc.data();

      // Un doc fantôme n'a pas de compte Firebase Auth correspondant
      try {
        await auth.getUser(uid);
        valid.push({ id: uid, email: data.email, nom: data.nom, plan: data.plan });
      } catch (e) {
        if (e.code === "auth/user-not-found") {
          phantoms.push({ id: uid, email: data.email, nom: data.nom, plan: data.plan, createdAt: data.dateInscription || data.createdAt || null });
        } else {
          // Autre erreur Firebase — ignorer
          valid.push({ id: uid, email: data.email, nom: data.nom, note: "vérification impossible" });
        }
      }
    }

    return Response.json({
      total: snap.size,
      validCount: valid.length,
      phantomCount: phantoms.length,
      phantoms,
    });
  } catch (e) {
    console.error("cleanup GET error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — supprime tous les docs fantômes
export async function DELETE(req) {
  const coach = await verifyCoach(req);
  if (!coach) return Response.json({ error: "Non autorisé." }, { status: 403 });

  // Paramètre de sécurité : confirm=true requis
  const { searchParams } = new URL(req.url);
  if (searchParams.get("confirm") !== "true") {
    return Response.json({ error: "Ajoute ?confirm=true pour confirmer la suppression." }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const auth = getAdminAuth();

    const snap = await db.collection("clients").get();
    const deleted = [];
    const kept = [];

    for (const doc of snap.docs) {
      const uid = doc.id;
      const data = doc.data();

      try {
        await auth.getUser(uid);
        kept.push(uid); // doc valide → on garde
      } catch (e) {
        if (e.code === "auth/user-not-found") {
          await db.collection("clients").doc(uid).delete();
          deleted.push({ id: uid, email: data.email, nom: data.nom });
          console.log(`Doc fantôme supprimé: ${uid} (${data.email})`);
        }
      }
    }

    return Response.json({
      success: true,
      deletedCount: deleted.length,
      keptCount: kept.length,
      deleted,
    });
  } catch (e) {
    console.error("cleanup DELETE error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

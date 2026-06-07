import { getAdminAuth, getAdminDb } from "../firebase-admin";
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

export async function POST(req) {
  const coach = await verifyCoach(req);
  if (!coach) return Response.json({ error: "Non autorisé." }, { status: 403 });

  const { clientUid, programmeData, programme, profil } = await req.json();
  if (!clientUid) return Response.json({ error: "clientUid requis." }, { status: 400 });
  if (!programmeData) return Response.json({ error: "programmeData requis." }, { status: 400 });

  // Champs de profil à stocker au niveau du doc client (pour le chatbot IA)
  const profilUpdate = {};
  if (profil?.age)    profilUpdate.age    = profil.age;
  if (profil?.genre)  profilUpdate.genre  = profil.genre;
  if (profil?.poids)  profilUpdate.poids  = profil.poids;
  if (profil?.taille) profilUpdate.taille = profil.taille;

  try {
    await getAdminDb().collection("clients").doc(clientUid).update({
      programmeData,
      programme: programme || `Programme ${programmeData.objectif_principal || "personnalisé"} — ${programmeData.seances_par_semaine || 3} séances/sem.`,
      programmeUpdatedAt: new Date().toISOString(),
      ...profilUpdate,
    });
    return Response.json({ success: true });
  } catch (e) {
    console.error("save-programme error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

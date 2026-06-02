import { getAdminDb } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

// Appelée quand le bilan atteint l'étape 3 (données personnelles saisies)
// sans que le paiement soit complété
export async function POST(req) {
  try {  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 20, 60_000)) {
    return Response.json({ error: "Trop de requêtes. Réessaie dans une minute." }, { status: 429 });
  }

    const { email, prenom, plan, step } = await req.json();
    if (!email || !email.includes("@")) return Response.json({ ok: false });

    const db = getAdminDb();
    const id = email.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    await db.collection("abandons").doc(id).set({
      email, prenom: prenom || "", plan: plan || "forge",
      lastStep: step || 1,
      createdAt: new Date().toISOString(),
      reminded: false,
    }, { merge: true });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("save-abandon:", e.message);
    return Response.json({ ok: false });
  }
}

// Supprimer un abandon quand le paiement est complété
export async function DELETE(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ ok: false });
    const db = getAdminDb();
    const id = email.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    await db.collection("abandons").doc(id).delete();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}

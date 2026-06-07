import { getAdminDb, verifyAuthToken } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

// ── Générer un lien de parrainage unique pour un client ────────────────
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!await checkRateLimit(ip, 15, 60_000)) {
    return Response.json({ error: "Trop de requêtes. Réessaie dans une minute." }, { status: 429 });
  }

  try {
    const decoded = await verifyAuthToken(req);
    if (!decoded) return Response.json({ error: "Non autorisé" }, { status: 401 });
    const { clientId, clientNom } = await req.json();
    if (!clientId) return Response.json({ error: "clientId manquant" }, { status: 400 });
    // Un client ne peut créer que son propre lien de parrainage
    if (decoded.uid !== clientId) return Response.json({ error: "Interdit" }, { status: 403 });

    const db = getAdminDb();
    const clientRef = db.collection("clients").doc(clientId);
    const snap = await clientRef.get();
    if (!snap.exists) return Response.json({ error: "Client introuvable" }, { status: 404 });

    const existing = snap.data();

    // Si un code existe déjà, le réutiliser
    if (existing.referralCode) {
      return Response.json({
        success: true,
        code: existing.referralCode,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app"}/bilan?ref=${existing.referralCode}`,
        stats: {
          totalReferrals: existing.referralCount || 0,
        }
      });
    }

    // Générer un code unique basé sur le nom + random
    const nom = (clientNom || "user").replace(/[^a-z]/gi, "").slice(0, 6).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${nom}${random}`;

    await clientRef.update({
      referralCode: code,
      referralCount: 0,
      referredBy: null,
    });

    const url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app"}/bilan?ref=${code}`;
    return Response.json({ success: true, code, url, stats: { totalReferrals: 0 } });
  } catch (e) {
    console.error("referral POST:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

// ── Vérifier un code de parrainage ────────────────────────────────────
export async function GET(req) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return Response.json({ valid: false });

  try {
    const db = getAdminDb();
    const snap = await db.collection("clients").where("referralCode", "==", code.toUpperCase()).limit(1).get();
    if (snap.empty) return Response.json({ valid: false, message: "Code introuvable" });

    const referrer = snap.docs[0].data();
    return Response.json({
      valid: true,
      referrerNom: referrer.nom?.split(" ")[0] || "ton ami",
      // Réduction possible à afficher (ex: 10%)
      discount: 0, // à implémenter quand Stripe est actif
    });
  } catch (e) {
    console.error("referral GET:", e.message);
    return Response.json({ valid: false, error: "Erreur interne." });
  }
}

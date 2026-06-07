import Stripe from "stripe";
import { getAdminDb, verifyAuthToken } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

// Crée une session Stripe Billing Portal pour le client connecté
// Le client peut gérer son abonnement, voir ses factures, annuler
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!await checkRateLimit(ip, 5, 60_000)) {
    return Response.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const decoded = await verifyAuthToken(req);
  if (!decoded) return Response.json({ error: "Non autorisé." }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe non configuré." }, { status: 503 });
  }

  try {
    const db = getAdminDb();
    const snap = await db.collection("clients").doc(decoded.uid).get();
    if (!snap.exists) return Response.json({ error: "Client introuvable." }, { status: 404 });

    const clientData = snap.data();
    const stripeCustomerId = clientData.stripeCustomerId;

    // Si pas de stripeCustomerId → chercher dans les orders par email
    let customerId = stripeCustomerId;
    if (!customerId && clientData.email) {
      const customers = await stripe.customers.list({ email: clientData.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Sauvegarder pour les prochaines fois
        await db.collection("clients").doc(decoded.uid).update({ stripeCustomerId: customerId });
      }
    }

    if (!customerId) {
      return Response.json({ error: "Aucun compte de paiement trouvé." }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${SITE}/client`,
    });

    return Response.json({ url: session.url });
  } catch (e) {
    console.error("stripe-portal error:", e.message);
    return Response.json({ error: "Erreur lors de l'ouverture du portail." }, { status: 500 });
  }
}

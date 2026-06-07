import Stripe from "stripe";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

// Prix en centimes — configurable via variables d'environnement Vercel
// PRICE_STARTER, PRICE_FORGE, PRICE_ELITE (ex: 4900 = 49€)
// Fallback sur les prix par défaut si non définis
const PRICE_STARTER = parseInt(process.env.PRICE_STARTER || "4900", 10);
const PRICE_FORGE   = parseInt(process.env.PRICE_FORGE   || "12900", 10);
const PRICE_ELITE   = parseInt(process.env.PRICE_ELITE   || "24900", 10);

const PLANS = {
  starter: {
    name: "Plan Starter APXFITNESS",
    description: "Programme musculation personnalisé + plan nutrition. Livraison en 48h.",
    price: PRICE_STARTER,
    images: [`${SITE}/og-image.jpg`],
  },
  forge: {
    name: "Plan Forge APXFITNESS",
    description: "Programme + nutrition + suivi mensuel + accès espace client privé. Livraison en 48h.",
    price: PRICE_FORGE,
    images: [`${SITE}/og-image.jpg`],
  },
  elite: {
    name: "Plan Elite APXFITNESS",
    description: "Coaching haut de gamme : programme, nutrition, suivi, messagerie directe, révisions illimitées.",
    price: PRICE_ELITE,
    images: [`${SITE}/og-image.jpg`],
  },
};

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!await checkRateLimit(ip, 10, 60_000)) {
    return Response.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe non configuré." }, { status: 503 });
  }

  let planId;
  try {
    const body = await req.json();
    planId = body.plan;
  } catch {
    return Response.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const plan = PLANS[planId];
  if (!plan) {
    return Response.json({ error: "Plan invalide." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: plan.price,
            product_data: {
              name: plan.name,
              description: plan.description,
              images: plan.images,
            },
          },
          quantity: 1,
        },
      ],
      // Champs collectés lors du paiement
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      customer_email: undefined, // Stripe demandera l'email
      // Métadonnées pour le webhook
      metadata: {
        plan: planId,
      },
      // Garantie 14 jours mentionnée sur la page
      payment_intent_data: {
        metadata: { plan: planId },
        description: `APXFITNESS — ${plan.name}`,
      },
      // Pages de retour
      success_url: `${SITE}/paiement-succes?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: `${SITE}/tarifs?annule=1`,
      // Localisation
      locale: "fr",
      // Consentement conditions
      consent_collection: {
        terms_of_service: "none",
      },
      // Permettre le code promo si besoin plus tard
      allow_promotion_codes: true,
    });

    return Response.json({ url: session.url });
  } catch (e) {
    console.error("stripe-checkout error:", e.message);
    return Response.json({ error: "Erreur lors de la création du paiement." }, { status: 500 });
  }
}

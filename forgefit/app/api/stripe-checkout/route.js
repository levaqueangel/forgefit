import Stripe from "stripe";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder");
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

const MONTHLY_PRICES = { starter: 1899, forge: 3899, elite: 6899 };
// Annuel = 10 mois (2 mois offerts)
const ANNUAL_PRICES  = { starter: 18990, forge: 38990, elite: 68990 };

const PLAN_META = {
  starter: {
    name: "Plan Starter APXFITNESS",
    description: "Programme musculation personnalisé + plan nutrition. Livraison en 48h.",
    images: [`${SITE}/og-image.jpg`],
  },
  forge: {
    name: "Plan Forge APXFITNESS",
    description: "Programme + nutrition + suivi mensuel + accès espace client privé.",
    images: [`${SITE}/og-image.jpg`],
  },
  elite: {
    name: "Plan Elite APXFITNESS",
    description: "Coaching haut de gamme : programme, nutrition, suivi, messagerie directe, révisions illimitées.",
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

  let planId, billing;
  try {
    const body = await req.json();
    planId  = body.plan;
    billing = body.billing === "annual" ? "annual" : "monthly";
  } catch {
    return Response.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const meta = PLAN_META[planId];
  if (!meta) return Response.json({ error: "Plan invalide." }, { status: 400 });

  const prices   = billing === "annual" ? ANNUAL_PRICES : MONTHLY_PRICES;
  const interval = billing === "annual" ? "year" : "month";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: prices[planId],
            recurring: { interval },
            product_data: {
              name: meta.name,
              description: meta.description,
              images: meta.images,
            },
          },
          quantity: 1,
        },
      ],
      billing_address_collection: "auto",
      subscription_data: {
        metadata: { plan: planId, billing },
      },
      metadata: { plan: planId, billing },
      success_url: `${SITE}/paiement-succes?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&billing=${billing}`,
      cancel_url:  `${SITE}/tarifs?annule=1`,
      locale: "fr",
      allow_promotion_codes: true,
    });

    return Response.json({ url: session.url });
  } catch (e) {
    console.error("stripe-checkout error:", e.message);
    return Response.json({ error: "Erreur lors de la création du paiement." }, { status: 500 });
  }
}

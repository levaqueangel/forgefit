import Stripe from "stripe";
import { getAdminDb } from "../firebase-admin";
import { Resend } from "resend";
export const dynamic = "force-dynamic";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder");
const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";
const COACH_EMAIL = process.env.COACH_EMAIL || process.env.NEXT_PUBLIC_COACH_EMAIL || "coach.apxfitness11@gmail.com";

// Plans qui donnent accès à l'espace client
const PLANS_WITH_ACCESS = ["forge", "elite"];

function esc(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe non configuré.", { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Webhook signature invalide:", e.message);
    return new Response(`Webhook Error: ${e.message}`, { status: 400 });
  }

  // On traite uniquement checkout.session.completed
  if (event.type !== "checkout.session.completed") {
    return new Response("OK", { status: 200 });
  }

  const session = event.data.object;

  // Vérifier que le paiement est bien réussi
  if (session.payment_status !== "paid") {
    return new Response("OK — paiement non finalisé", { status: 200 });
  }

  const plan = session.metadata?.plan || "starter";
  const clientEmail = session.customer_details?.email || "";
  const clientName = session.customer_details?.name || "";
  const amountEur = (session.amount_total / 100).toFixed(2);
  const stripeSessionId = session.id;
  const paymentIntentId = session.payment_intent;

  try {
    const db = getAdminDb();

    // Sauvegarder la commande dans Firestore (collection "orders")
    const orderData = {
      plan,
      email: clientEmail,
      nom: clientName,
      montant: parseFloat(amountEur),
      stripeSessionId,
      paymentIntentId,
      status: "paid",
      createdAt: new Date().toISOString(),
      accessGranted: PLANS_WITH_ACCESS.includes(plan),
    };

    // Idempotency : éviter les doublons si Stripe rejoue l'événement
    const existing = await db.collection("orders").where("stripeSessionId","==",stripeSessionId).limit(1).get();
    if (!existing.empty) {
      console.log(`Commande déjà enregistrée pour session ${stripeSessionId} — skip`);
      return new Response("OK — duplicate skip", { status: 200 });
    }

    const orderRef = await db.collection("orders").add(orderData);
    console.log(`Commande créée: ${orderRef.id} — Plan ${plan} — ${clientEmail}`);

    // NOTE : on ne crée PAS de doc clients ici.
    // Le doc clients/{uid} est créé par /api/activate-client (coach dashboard)
    // qui utilise le vrai Firebase Auth UID comme ID de document.
    // Créer un doc avec un ID aléatoire ici générerait des "fantômes" inutilisables.
    // Le coach voit la commande dans son dashboard et active manuellement le compte.

    // Email de confirmation au client
    if (clientEmail) {
      const planLabels = { starter: "Starter", forge: "Forge", elite: "Elite" };
      const planLabel = planLabels[plan] || plan;

      const starterNote = plan === "starter"
        ? `<p style="margin:14px 0;font-size:14px;color:#888;line-height:1.7;">Angel va analyser ton bilan et te livrer ton programme personnalisé par email dans les <strong style="color:#F0EDE8">48 heures ouvrées</strong>.</p>`
        : `<p style="margin:14px 0;font-size:14px;color:#888;line-height:1.7;">Ton accès à l'espace client privé sera activé par Angel dans les <strong style="color:#F0EDE8">48 heures ouvrées</strong>. Tu recevras un email avec tes identifiants.</p>`;

      await resend.emails.send({
        from: "APXFITNESS <onboarding@resend.dev>",
        to: [clientEmail],
        subject: `✅ Commande confirmée — Plan ${planLabel} APXFITNESS`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="600" style="max-width:100%;width:100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#0D0D0D;border-bottom:2px solid #C9A84C;padding:24px 36px;text-align:center;">
  <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:6px;color:#F0EDE8;">APXFIT<span style="color:#C9A84C">NESS</span></p>
</td></tr>
<tr><td style="background:#111;padding:32px 36px;">
  <p style="margin:0 0 6px;font-size:22px;color:#C9A84C;font-style:italic;font-family:Georgia,serif">Merci ${esc(clientName) || "pour ta commande"} !</p>
  <p style="margin:14px 0;font-size:15px;color:#888;line-height:1.7;">Ton paiement de <strong style="color:#F0EDE8">${amountEur}€</strong> pour le <strong style="color:#C9A84C">Plan ${planLabel}</strong> a bien été reçu.</p>
  ${starterNote}
  <div style="background:#0D0D0D;border-left:3px solid #C9A84C;padding:16px 20px;margin:20px 0;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#555;">Récapitulatif</p>
    <p style="margin:4px 0;font-size:13px;color:#888;">Plan : <strong style="color:#F0EDE8">${planLabel}</strong></p>
    <p style="margin:4px 0;font-size:13px;color:#888;">Montant : <strong style="color:#F0EDE8">${amountEur}€</strong></p>
    <p style="margin:4px 0;font-size:13px;color:#888;">Référence : <span style="font-family:monospace;color:#555;font-size:11px">${stripeSessionId}</span></p>
  </div>
  <p style="margin:20px 0 0;font-size:13px;color:#555;line-height:1.7;">Des questions ? Réponds directement à cet email ou contacte Angel sur Instagram.</p>
</td></tr>
<tr><td style="background:#0A0A0A;padding:20px;text-align:center;">
  <p style="margin:0;font-size:14px;font-weight:900;letter-spacing:5px;color:#F0EDE8;">APXFIT<span style="color:#C9A84C">NESS</span></p>
  <p style="margin:8px 0 0;font-size:11px;color:#333;letter-spacing:1px;">Garantie satisfait ou remboursé 14 jours</p>
</td></tr>
</table></td></tr></table></body></html>`,
      });
    }

    // Notification au coach
    await resend.emails.send({
      from: "APXFITNESS <onboarding@resend.dev>",
      to: [COACH_EMAIL],
      subject: `💰 Nouvelle commande — Plan ${plan.toUpperCase()} — ${clientEmail}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="background:#0A0A0A;font-family:Arial,sans-serif;padding:32px;color:#F0EDE8;">
<h2 style="color:#C9A84C;margin:0 0 16px">💰 Nouvelle commande reçue</h2>
<table style="border-collapse:collapse;width:100%;max-width:500px">
  <tr><td style="padding:8px 0;color:#888;width:140px">Plan</td><td style="padding:8px 0;font-weight:bold;color:#C9A84C;font-size:18px">${plan.toUpperCase()}</td></tr>
  <tr><td style="padding:8px 0;color:#888">Client</td><td style="padding:8px 0">${esc(clientName) || "—"}</td></tr>
  <tr><td style="padding:8px 0;color:#888">Email</td><td style="padding:8px 0"><a href="mailto:${esc(clientEmail)}" style="color:#C9A84C">${esc(clientEmail)}</a></td></tr>
  <tr><td style="padding:8px 0;color:#888">Montant</td><td style="padding:8px 0;font-size:20px;font-weight:bold;color:#5DCAA5">${amountEur}€</td></tr>
  <tr><td style="padding:8px 0;color:#888">Référence</td><td style="padding:8px 0;font-family:monospace;font-size:11px;color:#555">${stripeSessionId}</td></tr>
  <tr><td style="padding:8px 0;color:#888">Accès client</td><td style="padding:8px 0">${PLANS_WITH_ACCESS.includes(plan) ? "✅ À activer (envoyer identifiants)" : "❌ Livraison par email uniquement"}</td></tr>
</table>
<p style="margin:24px 0 0;color:#555;font-size:13px">Action requise : livre le programme en 48h ouvrées.</p>
</body></html>`,
    });

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("stripe-webhook error:", e.code, e.message);
    return new Response("OK — erreur interne loguée", { status: 200 });
  }
}

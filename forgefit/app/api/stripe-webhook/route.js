import Stripe from "stripe";
import { getAdminDb } from "../firebase-admin";
import { Resend } from "resend";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder");
const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";
const COACH_EMAIL = process.env.COACH_EMAIL || process.env.NEXT_PUBLIC_COACH_EMAIL || "coach.apxfitness11@gmail.com";

const PLANS_WITH_ACCESS = ["forge", "elite"];

function esc(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Trouve le doc client par stripeCustomerId
async function findClientByCustomerId(db, customerId) {
  const snap = await db.collection("clients").where("stripeCustomerId", "==", customerId).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// ── checkout.session.completed ─────────────────────────────────────────────
async function handleCheckoutCompleted(db, session) {
  // Pour les abonnements, le status de paiement est "paid" ou "no_payment_required"
  if (session.mode === "subscription" && session.status !== "complete") return;
  if (session.mode === "payment" && session.payment_status !== "paid") return;

  const plan    = session.metadata?.plan || "starter";
  const billing = session.metadata?.billing || "monthly";
  const clientEmail = session.customer_details?.email || "";
  const clientName  = session.customer_details?.name  || "";
  const amountEur   = ((session.amount_total || 0) / 100).toFixed(2);
  const stripeSessionId    = session.id;
  const paymentIntentId    = session.payment_intent || null;
  const stripeCustomerId   = session.customer || null;
  const stripeSubscriptionId = session.subscription || null;

  // Idempotency
  const existing = await db.collection("orders").where("stripeSessionId", "==", stripeSessionId).limit(1).get();
  if (!existing.empty) {
    console.log(`Order already exists for session ${stripeSessionId} — skip`);
    return;
  }

  const orderData = {
    plan,
    billing,
    email: clientEmail,
    nom: clientName,
    montant: parseFloat(amountEur),
    stripeSessionId,
    paymentIntentId,
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionStatus: stripeSubscriptionId ? "active" : null,
    mode: session.mode || "payment",
    status: "paid",
    createdAt: new Date().toISOString(),
    accessGranted: PLANS_WITH_ACCESS.includes(plan),
  };

  const orderRef = await db.collection("orders").add(orderData);
  console.log(`Order created: ${orderRef.id} — Plan ${plan} (${billing}) — ${clientEmail}`);

  // Si client déjà activé (compte existant), mettre à jour ses infos d'abonnement
  if (stripeCustomerId && clientEmail) {
    const clientSnap = await db.collection("clients").where("email", "==", clientEmail).limit(1).get();
    if (!clientSnap.empty) {
      await clientSnap.docs[0].ref.update({
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus: "active",
        billing,
        plan,
      });
    }
  }

  // Email de confirmation au client
  if (clientEmail) {
    const planLabels  = { starter: "Starter", forge: "Forge", elite: "Elite" };
    const planLabel   = planLabels[plan] || plan;
    const billingLabel = billing === "annual" ? "annuel" : "mensuel";

    const accessNote = plan === "starter"
      ? `<p style="margin:14px 0;font-size:14px;color:#888;line-height:1.7;">Angel va analyser ton bilan et te livrer ton programme personnalisé par email dans les <strong style="color:#F0EDE8">48 heures ouvrées</strong>.</p>`
      : `<p style="margin:14px 0;font-size:14px;color:#888;line-height:1.7;">Ton accès à l'espace client privé sera activé par Angel dans les <strong style="color:#F0EDE8">48 heures ouvrées</strong>. Tu recevras un email avec tes identifiants de connexion.</p>`;

    await resend.emails.send({
      from: "APXFITNESS <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `✅ Abonnement confirmé — Plan ${planLabel} APXFITNESS`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="600" style="max-width:100%;width:100%" cellpadding="0" cellspacing="0">
<tr><td style="background:#0D0D0D;border-bottom:2px solid #C9A84C;padding:24px 36px;text-align:center;">
  <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:6px;color:#F0EDE8;">APXFIT<span style="color:#C9A84C">NESS</span></p>
</td></tr>
<tr><td style="background:#111;padding:32px 36px;">
  <p style="margin:0 0 6px;font-size:22px;color:#C9A84C;font-style:italic;font-family:Georgia,serif">Merci ${esc(clientName) || "pour ton abonnement"} !</p>
  <p style="margin:14px 0;font-size:15px;color:#888;line-height:1.7;">Ton abonnement <strong style="color:#C9A84C">Plan ${planLabel}</strong> (${billingLabel}) est confirmé.</p>
  ${accessNote}
  <div style="background:#0D0D0D;border-left:3px solid #C9A84C;padding:16px 20px;margin:20px 0;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#555;">Récapitulatif</p>
    <p style="margin:4px 0;font-size:13px;color:#888;">Plan : <strong style="color:#F0EDE8">${planLabel}</strong></p>
    <p style="margin:4px 0;font-size:13px;color:#888;">Facturation : <strong style="color:#F0EDE8">${billingLabel}</strong></p>
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
    }).catch(e => console.error("Client email error:", e.message));
  }

  // Notification au coach
  const billingLabel = billing === "annual" ? "Annuel" : "Mensuel";
  await resend.emails.send({
    from: "APXFITNESS <onboarding@resend.dev>",
    to: [COACH_EMAIL],
    subject: `💰 Nouvel abonnement — Plan ${plan.toUpperCase()} ${billingLabel} — ${clientEmail}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="background:#0A0A0A;font-family:Arial,sans-serif;padding:32px;color:#F0EDE8;">
<h2 style="color:#C9A84C;margin:0 0 16px">💰 Nouvel abonnement reçu</h2>
<table style="border-collapse:collapse;width:100%;max-width:500px">
  <tr><td style="padding:8px 0;color:#888;width:160px">Plan</td><td style="padding:8px 0;font-weight:bold;color:#C9A84C;font-size:18px">${plan.toUpperCase()}</td></tr>
  <tr><td style="padding:8px 0;color:#888">Facturation</td><td style="padding:8px 0">${billingLabel}</td></tr>
  <tr><td style="padding:8px 0;color:#888">Client</td><td style="padding:8px 0">${esc(clientName) || "—"}</td></tr>
  <tr><td style="padding:8px 0;color:#888">Email</td><td style="padding:8px 0"><a href="mailto:${esc(clientEmail)}" style="color:#C9A84C">${esc(clientEmail)}</a></td></tr>
  <tr><td style="padding:8px 0;color:#888">Montant 1er paiement</td><td style="padding:8px 0;font-size:20px;font-weight:bold;color:#5DCAA5">${amountEur}€</td></tr>
  <tr><td style="padding:8px 0;color:#888">Accès client</td><td style="padding:8px 0">${PLANS_WITH_ACCESS.includes(plan) ? "✅ À activer (envoyer identifiants)" : "❌ Livraison par email uniquement"}</td></tr>
</table>
<p style="margin:24px 0 0;color:#555;font-size:13px">Action requise : livre le programme en 48h ouvrées.</p>
</body></html>`,
  }).catch(e => console.error("Coach email error:", e.message));
}

// ── customer.subscription.updated / deleted ────────────────────────────────
async function handleSubscriptionChange(db, subscription) {
  const customerId = subscription.customer;
  const client = await findClientByCustomerId(db, customerId);
  if (!client) {
    console.log(`No client found for customer ${customerId} — subscription event ignored`);
    return;
  }

  const status = subscription.status; // "active" | "past_due" | "canceled" | "unpaid" | ...
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const update = {
    subscriptionStatus: status,
    stripeSubscriptionId: subscription.id,
  };
  if (periodEnd) update.subscriptionPeriodEnd = periodEnd;

  // Si annulé, noter la date de fin d'accès
  if (status === "canceled") {
    update.canceledAt = new Date().toISOString();
    console.log(`Subscription canceled for client ${client.id} (${client.email})`);
  }

  await db.collection("clients").doc(client.id).update(update);
  console.log(`Subscription ${subscription.id} → status ${status} for client ${client.id}`);
}

// ── invoice.payment_failed ─────────────────────────────────────────────────
async function handlePaymentFailed(db, invoice) {
  const customerId = invoice.customer;
  const client = await findClientByCustomerId(db, customerId);
  if (!client) return;

  await db.collection("clients").doc(client.id).update({
    subscriptionStatus: "past_due",
  });
  console.log(`Payment failed → past_due for client ${client.id} (${client.email})`);
}

// ── invoice.payment_succeeded ──────────────────────────────────────────────
async function handlePaymentSucceeded(db, invoice) {
  // Ignorer la facture zéro (setup)
  if ((invoice.amount_paid || 0) === 0) return;
  const customerId = invoice.customer;
  const client = await findClientByCustomerId(db, customerId);
  if (!client) return;

  await db.collection("clients").doc(client.id).update({
    subscriptionStatus: "active",
  });
  console.log(`Payment succeeded → active for client ${client.id} (${client.email})`);
}

// ── Handler principal ──────────────────────────────────────────────────────
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

  const db = getAdminDb();

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(db, event.data.object);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(db, event.data.object);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(db, event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(db, event.data.object);
        break;
      default:
        // Ignorer silencieusement les autres événements
        break;
    }
  } catch (e) {
    console.error(`stripe-webhook error on ${event.type}:`, e.message);
    // Retourner 200 pour éviter que Stripe rejoue à l'infini
    return new Response("OK — erreur interne loguée", { status: 200 });
  }

  return new Response("OK", { status: 200 });
}

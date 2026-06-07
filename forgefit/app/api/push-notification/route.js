import webpushLib from "web-push";
import { getAdminDb } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

// Envoyer une notification push à un client spécifique
// Appelé automatiquement depuis notify-client après envoi de message coach
export async function POST(req) {
  // Lire le body UNE SEULE FOIS avant le try/catch pour pouvoir y accéder partout
  let parsedBody = {};
  try { parsedBody = await req.json(); } catch {}

  const { clientId, title, body, url } = parsedBody;

  try {
    const internalKey = req.headers.get("x-internal-key");
    if (internalKey !== process.env.CRON_SECRET) {
      return Response.json({ error: "Non autorise" }, { status: 401 });
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    if (!checkRateLimit(ip, 10, 60_000)) {
      return Response.json({ error: "Trop de requêtes. Réessaie dans une minute." }, { status: 429 });
    }

    if (!clientId) return Response.json({ error: "clientId manquant" }, { status: 400 });

    const db = getAdminDb();
    const clientDoc = await db.collection("clients").doc(clientId).get();
    if (!clientDoc.exists) return Response.json({ error: "Client introuvable" }, { status: 404 });

    const client = clientDoc.data();
    const subscription = client.pushSubscription;

    if (!subscription) {
      return Response.json({ success: false, reason: "Pas d'abonnement push enregistré" });
    }

    const webpush = webpushLib;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || "mailto:coach.apxfitness11@gmail.com";

    if (!vapidPublicKey || !vapidPrivateKey) {
      return Response.json({ success: false, reason: "VAPID keys non configurées" });
    }

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

    const payload = JSON.stringify({
      title: title || "APXFITNESS",
      body: body || "Ton coach t'a envoyé un message.",
      icon: "/icon-192.png",
      badge: "/icon-72.png",
      url: url || "/client",
      tag: "coach-message",
    });

    await webpush.sendNotification(subscription, payload);
    return Response.json({ success: true });
  } catch (e) {
    // Subscription invalide/expirée — supprimer (clientId disponible car lu avant le try)
    if (e.statusCode === 410 || e.statusCode === 404) {
      try {
        if (clientId) {
          const db = getAdminDb();
          await db.collection("clients").doc(clientId).update({ pushSubscription: null });
        }
      } catch {}
    }
    console.error("Push notification error:", e.message);
    return Response.json({ success: false, error: e.message });
  }
}

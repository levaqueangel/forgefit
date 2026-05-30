import { getAdminDb } from "../firebase-admin";
export const dynamic = "force-dynamic";

// Envoyer une notification push à un client spécifique
// Appelé automatiquement depuis notify-client après envoi de message coach
export async function POST(req) {
  try {
    const { clientId, title, body, url } = await req.json();
    if (!clientId) return Response.json({ error: "clientId manquant" }, { status: 400 });

    const db = getAdminDb();
    const clientDoc = await db.collection("clients").doc(clientId).get();
    if (!clientDoc.exists) return Response.json({ error: "Client introuvable" }, { status: 404 });

    const client = clientDoc.data();
    const subscription = client.pushSubscription;

    if (!subscription) {
      return Response.json({ success: false, reason: "Pas d'abonnement push enregistré" });
    }

    // Utiliser l'API Web Push via la librairie web-push
    // Note: nécessite VAPID keys dans les env vars
    const webpush = (await import("web-push")).default;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || "mailto:levaqueangel@gmail.com";

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
    // Subscription invalide/expirée — supprimer
    if (e.statusCode === 410 || e.statusCode === 404) {
      try {
        const { clientId } = await req.json().catch(() => ({}));
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

import { Resend } from "resend";
import { getAdminDb } from "../../firebase-admin";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

// Cette route est appelée par un cron (Vercel Cron Jobs ou appel externe)
// Elle envoie un email de relance aux clients inactifs depuis 7 jours
export async function GET(req) {
  // Vérifier la clé secrète pour sécuriser le cron
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "apxfitness-cron-secret";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 3600 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 3600 * 1000).toISOString();

    // Clients qui ne se sont pas connectés depuis 7-14 jours
    // et qui n'ont pas déjà reçu la relance
    const snapshot = await db.collection("clients").get();
    const clients = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const toRemind = clients.filter(c => {
      if (!c.email || !c.createdAt) return false;
      const lastActive = c.lastActiveDate
        ? new Date(c.lastActiveDate).toISOString()
        : c.createdAt;
      const alreadySent = c.relanceJ7SentAt;
      // Inactif depuis 7+ jours, relance pas encore envoyée
      return lastActive < sevenDaysAgo && !alreadySent;
    });

    let sent = 0;
    for (const client of toRemind) {
      try {
        await resend.emails.send({
          from: "APXFITNESS <onboarding@resend.dev>",
          replyTo: "coach.apxfitness11@gmail.com",
          to: [client.email],
          subject: `${client.nom?.split(" ")[0] || "Toi"}, ton programme t'attend 💪`,
          html: generateRelanceHtml(client.nom?.split(" ")[0] || "là", client.plan || "forge", SITE),
        });

        // Marquer comme envoyé
        await db.collection("clients").doc(client.id).update({
          relanceJ7SentAt: new Date().toISOString(),
        });
        sent++;
      } catch (e) {
        console.error(`Erreur relance pour ${client.email}:`, e.message);
      }
    }

    return Response.json({ success: true, sent, total: toRemind.length });
  } catch (e) {
    console.error("Cron relance error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// Email de relance — ton + motivation
function generateRelanceHtml(prenom, plan, site) {
  const planColor = plan === "elite" ? "#E8C87A" : plan === "forge" ? "#C9A84C" : "#888";
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Ton programme t'attend</title></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="background:#0D0D0D;border-bottom:2px solid ${planColor};padding:28px 36px;text-align:center;">
    <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:6px;color:#F0EDE8;">
      APXFIT<span style="color:${planColor}">NESS</span>
    </p>
  </td></tr>

  <!-- Message -->
  <tr><td style="background:#111;padding:40px;">
    <p style="margin:0 0 8px;font-size:28px;color:#C9A84C;font-style:italic;font-family:Georgia,serif;">
      Hé ${prenom} 👋
    </p>
    <p style="margin:20px 0 0;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
      Ça fait quelques jours qu'on ne t'a pas vu dans ton espace. Les résultats arrivent avec la régularité — c'est maintenant que ça se joue.
    </p>
    <p style="margin:20px 0;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
      Ton programme t'attend. Chaque séance compte, même les courtes.
    </p>
    <div style="height:1px;background:linear-gradient(90deg,transparent,${planColor},transparent);margin:28px 0;"></div>
    <p style="margin:0;font-size:13px;color:#555;font-style:italic;font-family:Georgia,serif;">
      "La progression n'est pas linéaire, mais elle nécessite la constance."
    </p>
  </td></tr>

  <!-- CTA -->
  <tr><td style="background:#111;padding:0 40px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="background:linear-gradient(135deg,#C9A84C,#A67C2E);mso-padding-alt:0;border-radius:2px;"><a href="${site}/client" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#A67C2E);color:#0A0A0A;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:16px 36px;text-decoration:none;border-radius:2px;">
      Reprendre mon programme →
    </a></td></tr></table>
    <p style="margin:16px 0 0;font-size:12px;color:#333;font-family:Arial,sans-serif;">
      Des questions ? Réponds directement à cet email.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#0A0A0A;padding:20px;text-align:center;border-top:0.5px solid #1A1A1A;">
    <p style="margin:0;font-size:14px;font-weight:900;letter-spacing:5px;color:#F0EDE8;font-family:Arial,sans-serif;">
      APXFIT<span style="color:#C9A84C">NESS</span>
    </p>
    <p style="margin:8px 0 0;font-size:11px;color:#333;font-family:Arial,sans-serif;">
      © 2026 APXFITNESS — Pour ne plus recevoir ces emails, réponds "désinscription".
    </p>
  </td></tr>

</table></td></tr></table>
</body></html>`;
}

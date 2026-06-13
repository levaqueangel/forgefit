import { Resend } from "resend";
import { getAdminDb } from "../../firebase-admin";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

// Winback J+30 : première relance après annulation — angle "tu nous manques",
// sans promotion. But : rouvrir le dialogue, pas vendre.
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 3600 * 1000).toISOString();
    const thirtyOneDaysAgo = new Date(now - 31 * 24 * 3600 * 1000).toISOString();

    const snap = await db.collection("clients").get();
    const eligible = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => {
        if (!c.email || !c.canceledAt) return false;
        if (c.winbackJ30SentAt) return false;
        return c.canceledAt < thirtyDaysAgo && c.canceledAt > thirtyOneDaysAgo;
      });

    let sent = 0;
    for (const client of eligible) {
      const prenom = client.nom?.split(" ")[0] || "là";
      const plan = client.plan?.toLowerCase() || "forge";
      const planColor = plan === "elite" ? "#E8C87A" : plan === "forge" ? "#C9A84C" : "#7AE07A";
      const seancesTotal = Array.isArray(client.seanceHistorique) ? client.seanceHistorique.length : 0;

      try {
        await resend.emails.send({
          from: "APXFITNESS <onboarding@resend.dev>",
          replyTo: "coach.apxfitness11@gmail.com",
          to: [client.email],
          subject: `${prenom}, un mois déjà — comment tu vas ?`,
          html: buildJ30Html(prenom, plan, planColor, seancesTotal, SITE),
        });

        await db.collection("clients").doc(client.id).update({
          winbackJ30SentAt: new Date().toISOString(),
        });
        sent++;
      } catch (e) {
        console.error(`Winback J30 error ${client.email}:`, e.message);
      }
    }

    return Response.json({ ok: true, sent, total: eligible.length });
  } catch (e) {
    console.error("Cron winback-j30 error:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

function buildJ30Html(prenom, plan, color, seancesTotal, site) {
  const planUp = plan.charAt(0).toUpperCase() + plan.slice(1);
  const seancesNote = seancesTotal > 0
    ? `<p style="margin:20px 0 0;font-size:15px;color:#555;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
        Tu avais complété ${seancesTotal} séance${seancesTotal > 1 ? "s" : ""} avec nous. C'est une base solide — elle ne disparaît pas.
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="600" style="max-width:100%;width:100%" cellpadding="0" cellspacing="0">

  <tr><td style="background:#0D0D0D;border-bottom:2px solid ${color};padding:24px 36px;text-align:center;">
    <p style="margin:0;font-size:18px;font-weight:900;letter-spacing:6px;color:#F0EDE8;font-family:Arial,sans-serif;">
      APXFIT<span style="color:${color}">NESS</span>
    </p>
  </td></tr>

  <tr><td style="background:#111;padding:40px;">
    <p style="margin:0 0 6px;font-size:28px;color:${color};font-style:italic;font-family:Georgia,serif;">
      ${prenom},
    </p>
    <div style="height:1px;background:linear-gradient(90deg,${color},transparent);margin:16px 0;"></div>
    <p style="margin:0;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
      Ça fait un mois que tu as quitté le Plan ${planUp}. On ne va pas te harceler — juste te demander honnêtement : comment ça se passe de ton côté ?
    </p>
    <p style="margin:20px 0 0;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
      Si tu as repris l'entraînement tout seul, bravo. Si quelque chose t'a bloqué — le prix, le temps, autre chose — réponds à cet email. Angel lit chaque réponse.
    </p>
    ${seancesNote}
  </td></tr>

  <tr><td style="background:#111;padding:0 40px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr><td style="background:linear-gradient(135deg,${color},#A67C2E);border-radius:2px;">
        <a href="${site}/tarifs" style="display:inline-block;color:#0A0A0A;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:14px 32px;text-decoration:none;">
          Voir les formules →
        </a>
      </td></tr>
    </table>
    <p style="margin:14px 0 0;font-size:12px;color:#333;font-family:Arial,sans-serif;">
      Ou réponds directement à cet email — aucun engagement.
    </p>
  </td></tr>

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

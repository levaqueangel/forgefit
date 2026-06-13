import { Resend } from "resend";
import { getAdminDb } from "../../firebase-admin";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

// Winback J+90 : dernier email de la séquence — angle "dernier message, pas de pression".
// Fermeture propre de la relation. Certains reviennent 6-12 mois plus tard sur ce souvenir.
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const now = Date.now();
    const ninetyDaysAgo = new Date(now - 90 * 24 * 3600 * 1000).toISOString();
    const ninetyOneDaysAgo = new Date(now - 91 * 24 * 3600 * 1000).toISOString();

    const snap = await db.collection("clients").get();
    const eligible = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => {
        if (!c.email || !c.canceledAt) return false;
        if (c.winbackJ90SentAt) return false;
        if (!c.winbackJ60SentAt) return false; // J60 doit être passé avant
        return c.canceledAt < ninetyDaysAgo && c.canceledAt > ninetyOneDaysAgo;
      });

    let sent = 0;
    for (const client of eligible) {
      const prenom = client.nom?.split(" ")[0] || "là";
      const plan = client.plan?.toLowerCase() || "forge";
      const planColor = plan === "elite" ? "#E8C87A" : plan === "forge" ? "#C9A84C" : "#7AE07A";

      try {
        await resend.emails.send({
          from: "APXFITNESS <onboarding@resend.dev>",
          replyTo: "coach.apxfitness11@gmail.com",
          to: [client.email],
          subject: `${prenom}, dernier message de notre part`,
          html: buildJ90Html(prenom, plan, planColor, SITE),
        });

        await db.collection("clients").doc(client.id).update({
          winbackJ90SentAt: new Date().toISOString(),
        });
        sent++;
      } catch (e) {
        console.error(`Winback J90 error ${client.email}:`, e.message);
      }
    }

    return Response.json({ ok: true, sent, total: eligible.length });
  } catch (e) {
    console.error("Cron winback-j90 error:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

function buildJ90Html(prenom, plan, color, site) {
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
      C'est notre dernier email. Pas parce qu'on abandonne — juste parce qu'on respecte ton choix et ton temps.
    </p>
    <p style="margin:20px 0;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
      Si un jour tu veux reprendre — dans 3 mois, dans 6 mois, l'année prochaine — le programme sera là. Ton bilan sera là. Angel sera là.
    </p>
    <p style="margin:0;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
      Prends soin de toi.
    </p>
    <p style="margin:28px 0 0;font-size:15px;color:#555;font-family:Arial,sans-serif;">
      — Angel, APXFITNESS
    </p>
  </td></tr>

  <tr><td style="background:#111;padding:0 40px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr><td style="border:0.5px solid #333;border-radius:2px;">
        <a href="${site}/bilan" style="display:inline-block;color:#888;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:14px 32px;text-decoration:none;">
          Reprendre un jour →
        </a>
      </td></tr>
    </table>
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

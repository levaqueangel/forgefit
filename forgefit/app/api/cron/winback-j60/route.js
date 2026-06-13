import { Resend } from "resend";
import { getAdminDb } from "../../firebase-admin";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

// Winback J+60 : deuxième relance — angle résultats concrets + offre de retour
// avec réduction (−1 mois offert sur annuel). But : convertir les hésitants au prix.
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const now = Date.now();
    const sixtyDaysAgo = new Date(now - 60 * 24 * 3600 * 1000).toISOString();
    const sixtyOneDaysAgo = new Date(now - 61 * 24 * 3600 * 1000).toISOString();

    const snap = await db.collection("clients").get();
    const eligible = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => {
        if (!c.email || !c.canceledAt) return false;
        if (c.winbackJ60SentAt) return false;
        if (!c.winbackJ30SentAt) return false; // J30 doit être passé avant
        return c.canceledAt < sixtyDaysAgo && c.canceledAt > sixtyOneDaysAgo;
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
          subject: `${prenom}, une offre de retour — valable 7 jours`,
          html: buildJ60Html(prenom, plan, planColor, SITE),
        });

        await db.collection("clients").doc(client.id).update({
          winbackJ60SentAt: new Date().toISOString(),
        });
        sent++;
      } catch (e) {
        console.error(`Winback J60 error ${client.email}:`, e.message);
      }
    }

    return Response.json({ ok: true, sent, total: eligible.length });
  } catch (e) {
    console.error("Cron winback-j60 error:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

function buildJ60Html(prenom, plan, color, site) {
  const planUp = plan.charAt(0).toUpperCase() + plan.slice(1);
  const annualPrices = { starter: "189,90€", forge: "389,90€", elite: "689,90€" };
  const annualPrice = annualPrices[plan] || "389,90€";
  const monthlyPrices = { starter: "18,99€", forge: "38,99€", elite: "68,99€" };
  const monthlyPrice = monthlyPrices[plan] || "38,99€";

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
    <p style="margin:6px 0 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#555;font-family:Arial,sans-serif;">
      Offre de retour — 7 jours
    </p>
  </td></tr>

  <tr><td style="background:#111;padding:40px;">
    <p style="margin:0 0 6px;font-size:28px;color:${color};font-style:italic;font-family:Georgia,serif;">
      ${prenom},
    </p>
    <div style="height:1px;background:linear-gradient(90deg,${color},transparent);margin:16px 0;"></div>
    <p style="margin:0;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
      2 mois sans programme structuré. Le corps s'adapte vite à l'absence de stimulation — et désadapte encore plus vite.
    </p>
    <p style="margin:20px 0 0;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
      Si le prix était un frein, voilà une porte de retour : l'abonnement annuel ${planUp} à <strong style="color:#F0EDE8">${annualPrice}/an</strong> — soit moins de ${monthlyPrice}/mois, et 2 mois offerts par rapport au mensuel.
    </p>
  </td></tr>

  <!-- Bloc offre -->
  <tr><td style="background:#111;padding:0 40px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;border:0.5px solid ${color};">
      <tr>
        <td style="padding:20px 24px;border-right:0.5px solid #242424;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#555;font-family:Arial,sans-serif;">Mensuel</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#555;font-family:Arial,sans-serif;text-decoration:line-through;">${monthlyPrice}/mois</p>
        </td>
        <td style="padding:20px 24px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${color};font-family:Arial,sans-serif;">Annuel — 2 mois offerts</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:${color};font-family:Arial,sans-serif;">${annualPrice}/an</p>
        </td>
      </tr>
    </table>
    <p style="margin:10px 0 0;font-size:11px;color:#333;font-family:Arial,sans-serif;text-align:center;">
      Offre valable 7 jours à partir de cet email.
    </p>
  </td></tr>

  <tr><td style="background:#111;padding:0 40px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr><td style="background:linear-gradient(135deg,${color},#A67C2E);border-radius:2px;">
        <a href="${site}/tarifs" style="display:inline-block;color:#0A0A0A;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:14px 32px;text-decoration:none;">
          Reprendre mon programme →
        </a>
      </td></tr>
    </table>
    <p style="margin:14px 0 0;font-size:12px;color:#333;font-family:Arial,sans-serif;">
      Ou réponds à cet email si tu veux discuter d'autre chose.
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

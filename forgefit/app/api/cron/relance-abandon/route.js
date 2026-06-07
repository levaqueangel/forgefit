import { Resend } from "resend";
import { getAdminDb } from "../../firebase-admin";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const now = Date.now();
    const oneDayAgo = new Date(now - 23 * 3600 * 1000).toISOString();
    const twoDaysAgo = new Date(now - 48 * 3600 * 1000).toISOString();

    const snap = await db.collection("abandons")
      .where("reminded", "==", false)
      .get();

    const eligible = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(a => a.createdAt > twoDaysAgo && a.createdAt < oneDayAgo);
    let sent = 0;

    for (const abandon of eligible) {
      const planColors = { starter:"#7AE07A", forge:"#C9A84C", elite:"#E8C87A" };
      const planColor = planColors[abandon.plan?.toLowerCase()] || "#C9A84C";
      const prenom = abandon.prenom || "là";
      const planName = abandon.plan ? abandon.plan.charAt(0).toUpperCase() + abandon.plan.slice(1) : "Forge";
      const planPrices = { starter:49, forge:129, elite:249 };
      const price = planPrices[abandon.plan?.toLowerCase()] || 129;

      try {
        await resend.emails.send({
          from: "APXFITNESS <onboarding@resend.dev>",
          to: [abandon.email],
          subject: `${prenom}, tu as laissé quelque chose en chemin`,
          html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <tr><td style="background:#0D0D0D;border-bottom:2px solid ${planColor};padding:28px 36px;text-align:center;">
    <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:6px;color:#F0EDE8;font-family:Arial,sans-serif;">
      APXFIT<span style="color:${planColor}">NESS</span>
    </p>
  </td></tr>

  <tr><td style="background:#111;padding:36px 40px;">
    <p style="margin:0 0 6px;font-size:30px;color:#C9A84C;font-style:italic;font-family:Georgia,serif;">
      Hé ${prenom}...
    </p>
    <div style="height:1px;background:linear-gradient(90deg,${planColor},transparent);margin:16px 0;"></div>
    <p style="margin:0;font-size:16px;color:#888;line-height:1.9;font-family:Georgia,serif;font-style:italic;">
      Tu as commencé ton bilan hier mais tu ne l'as pas terminé. 
      Ton programme ${planName} t'attend — il ne manque plus que toi.
    </p>
    <p style="margin:20px 0 0;font-size:16px;color:#888;line-height:1.9;font-family:Georgia,serif;font-style:italic;">
      En 5 minutes, tu reçois un programme complet : séances, exercices, nutrition. 
      Tout calculé pour ton objectif spécifique.
    </p>
  </td></tr>

  <tr><td style="background:#111;padding:0 40px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;border:0.5px solid #242424;">
      <tr>
        <td style="padding:16px 20px;border-right:0.5px solid #242424;text-align:center;">
          <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:${planColor};font-family:Arial,sans-serif;">${price}€</p>
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#444;font-family:Arial,sans-serif;">paiement unique</p>
        </td>
        <td style="padding:16px 20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:#7AE07A;font-family:Arial,sans-serif;">48h</p>
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#444;font-family:Arial,sans-serif;">délai livraison</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="background:#111;padding:0 40px 40px;text-align:center;">
    <a href="${SITE}/bilan?plan=${abandon.plan || "forge"}&email=${encodeURIComponent(abandon.email)}"
      style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#A67C2E);color:#0A0A0A;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:16px 36px;text-decoration:none;font-family:Arial,sans-serif;">
      Reprendre mon bilan →
    </a>
    <p style="margin:14px 0 0;font-size:12px;color:#333;font-family:Arial,sans-serif;">
      Des questions ? Réponds directement à cet email.
    </p>
  </td></tr>

  <tr><td style="background:#0A0A0A;padding:20px;text-align:center;border-top:0.5px solid #1A1A1A;">
    <p style="margin:0;font-size:14px;font-weight:900;letter-spacing:5px;color:#F0EDE8;font-family:Arial,sans-serif;">
      APXFIT<span style="color:#C9A84C">NESS</span>
    </p>
    <p style="margin:6px 0 0;font-size:11px;color:#333;font-family:Arial,sans-serif;">
      © 2026 APXFITNESS — Pour ne plus recevoir ces emails, réponds "désinscription".
    </p>
  </td></tr>

</table></td></tr></table>
</body></html>`,
        });

        await db.collection("abandons").doc(abandon.id).update({ reminded: true });
        sent++;
      } catch (e) {
        console.error(`Abandon email error ${abandon.email}:`, e.message);
      }
    }

    return Response.json({ ok: true, sent, total: eligible.length });
  } catch (e) {
    console.error("Cron relance-abandon error:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

import { Resend } from "resend";
import { getAdminDb } from "../../firebase-admin";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
const SITE   = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snap = await db.collection("clients").get();
    const clients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const activeClients = clients.filter(c => c.email && c.plan);

    console.log(`Check-in hebdo: ${activeClients.length} clients`);
    let sent = 0;

    for (const client of activeClients) {
      const prenom = client.nom?.split(" ")[0] || "là";
      const planColors = { starter:"#7AE07A", forge:"#C9A84C", elite:"#E8C87A" };
      const color = planColors[client.plan?.toLowerCase()] || "#C9A84C";

      // Ne pas renvoyer si déjà reçu cette semaine
      const lastCheckin = client.lastCheckinAt ? new Date(client.lastCheckinAt) : null;
      const daysSince = lastCheckin ? Math.floor((Date.now() - lastCheckin.getTime()) / 86400000) : 999;
      if (daysSince < 6) continue;

      try {
        await resend.emails.send({
          from: "APXFITNESS <onboarding@resend.dev>",
          to: [client.email],
          subject: `${prenom}, comment tu te sens cette semaine ?`,
          html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="600" style="max-width:100%;width:100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:#0D0D0D;border-bottom:2px solid ${color};padding:24px 36px;text-align:center;">
    <p style="margin:0;font-size:18px;font-weight:900;letter-spacing:6px;color:#F0EDE8;font-family:Arial,sans-serif;">
      APXFIT<span style="color:${color}">NESS</span>
    </p>
  </td></tr>
  <tr><td style="background:#111;padding:32px 40px;">
    <p style="margin:0 0 6px;font-size:26px;color:#C9A84C;font-style:italic;font-family:Georgia,serif;">
      Hey ${prenom} 👋
    </p>
    <div style="height:1px;background:linear-gradient(90deg,${color},transparent);margin:14px 0;"></div>
    <p style="margin:0 0 20px;font-size:15px;color:#888;line-height:1.9;font-family:Georgia,serif;font-style:italic;">
      On est lundi — comment tu te sens après cette semaine d'entraînement ?
      Réponds en un clic, ça prend 5 secondes.
    </p>
    <table width="100%" cellpadding="0" cellspacing="8">
      <tr>
        ${["🔥 En forme","😊 Bien","😐 Moyen","😴 Fatigué"].map((label, i) => `
        <td width="25%" style="text-align:center;">
          <a href="${SITE}/api/checkin-response?uid=${client.id}&response=${i+1}"
            style="display:block;background:rgba(255,255,255,0.04);border:0.5px solid #242424;color:#F0EDE8;font-size:13px;padding:12px 8px;text-decoration:none;font-family:Arial,sans-serif;">
            ${label}
          </a>
        </td>`).join("")}
      </tr>
    </table>
  </td></tr>
  <tr><td style="background:#0D0D0D;padding:20px 40px;text-align:center;border-top:0.5px solid #1A1A1A;">
    <a href="${SITE}/client" style="color:#C9A84C;font-size:12px;font-family:Arial,sans-serif;text-decoration:none;">
      Voir mon espace client →
    </a>
  </td></tr>
</table></td></tr></table>
</body></html>`,
        });
        await db.collection("clients").doc(client.id).update({ lastCheckinAt: new Date().toISOString() });
        sent++;
      } catch (e) {
        console.error(`Checkin error ${client.email}:`, e.message);
      }
    }

    return Response.json({ ok: true, sent, total: activeClients.length });
  } catch (e) {
    console.error("Cron checkin-hebdo error:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

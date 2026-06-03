import { Resend } from "resend";
import { getAdminDb } from "../../firebase-admin";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

// Envoi du bilan J+28 : résumé de progression + invitation renouvellement
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "apxfitness-cron-secret";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const now = Date.now();
    const twentyEightDaysAgo = new Date(now - 28 * 24 * 3600 * 1000).toISOString();
    const twentyNineDaysAgo = new Date(now - 29 * 24 * 3600 * 1000).toISOString();

    const snapshot = await db.collection("clients").get();
    const clients = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Clients dont le programme date de 28-29 jours et qui n'ont pas reçu l'email J28
    const eligible = clients.filter(c => {
      if (!c.email || !c.createdAt) return false;
      const created = c.createdAt;
      return created < twentyEightDaysAgo && created > twentyNineDaysAgo && !c.recapJ28SentAt;
    });
    let sent = 0;

    for (const client of eligible) {
      try {
        // Calculer le streak actuel
        const streak = client.streakDays || 0;
        const seancesDone = Object.values(client.seanceDone || {}).filter(Boolean).length;

        await resend.emails.send({
          from: "APXFITNESS <onboarding@resend.dev>",
          to: [client.email],
          subject: `🏆 ${client.nom?.split(" ")[0] || "Ton"} bilan 4 semaines APXFITNESS`,
          html: generateRecapHtml(
            client.nom?.split(" ")[0] || "là",
            client.plan || "forge",
            streak,
            seancesDone,
            SITE
          ),
        });

        await db.collection("clients").doc(client.id).update({
          recapJ28SentAt: new Date().toISOString(),
        });
        sent++;
      } catch (e) {
        console.error(`Erreur récap J28 pour ${client.email}:`, e.message);
      }
    }

    return Response.json({ success: true, sent, total: eligible.length });
  } catch (e) {
    console.error("Cron recap J28 error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

function generateRecapHtml(prenom, plan, streak, seances, site) {
  const planColor = plan === "elite" ? "#E8C87A" : plan === "forge" ? "#C9A84C" : "#888888";
  const planUp = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Forge";

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Ton bilan 4 semaines</title></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="background:#0D0D0D;border-bottom:2px solid ${planColor};padding:32px 40px;text-align:center;">
    <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:6px;color:#F0EDE8;font-family:Arial,sans-serif;">
      APXFIT<span style="color:${planColor}">NESS</span>
    </p>
    <p style="margin:8px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#555;font-family:Arial,sans-serif;">
      Bilan 4 semaines — Plan ${planUp}
    </p>
  </td></tr>

  <!-- Titre -->
  <tr><td style="background:#111;padding:40px 40px 20px;">
    <p style="margin:0 0 8px;font-size:32px;color:#C9A84C;font-style:italic;font-family:Georgia,serif;">
      Bravo ${prenom} ! 🏆
    </p>
    <p style="margin:16px 0 0;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
      4 semaines se sont écoulées depuis le début de ton programme. C'est le moment de faire le bilan.
    </p>
  </td></tr>

  <!-- Stats -->
  <tr><td style="background:#111;padding:0 40px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:0.5px solid #242424;">
      <tr>
        <td style="padding:20px;text-align:center;border-right:0.5px solid #242424;">
          <p style="margin:0 0 4px;font-size:32px;font-weight:700;color:${planColor};font-family:Arial,sans-serif;">${streak}</p>
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#555;font-family:Arial,sans-serif;">Jours streak</p>
        </td>
        <td style="padding:20px;text-align:center;border-right:0.5px solid #242424;">
          <p style="margin:0 0 4px;font-size:32px;font-weight:700;color:#7AE07A;font-family:Arial,sans-serif;">28</p>
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#555;font-family:Arial,sans-serif;">Jours programme</p>
        </td>
        <td style="padding:20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:32px;font-weight:700;color:#5DCAA5;font-family:Arial,sans-serif;">4</p>
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#555;font-family:Arial,sans-serif;">Semaines complètes</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Séparateur -->
  <tr><td style="background:#111;padding:0 40px;">
    <div style="height:1px;background:linear-gradient(90deg,transparent,${planColor},transparent);"></div>
  </td></tr>

  <!-- Message -->
  <tr><td style="background:#111;padding:32px 40px;">
    <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${planColor};font-family:Arial,sans-serif;">— La suite</p>
    <p style="margin:16px 0;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
      Tu as posé les bases. Le corps commence à peine à s'adapter. Les 4 prochaines semaines sont celles où les changements deviennent vraiment visibles.
    </p>
    <p style="margin:0;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
      Un nouveau bilan te permettra d'ajuster le programme selon tes progrès et d'aller encore plus loin.
    </p>
  </td></tr>

  <!-- CTA double -->
  <tr><td style="background:#111;padding:0 40px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="background:linear-gradient(135deg,#C9A84C,#A67C2E);mso-padding-alt:0;border-radius:2px;"><a href="${site}/bilan" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#A67C2E);color:#0A0A0A;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:16px 36px;text-decoration:none;border-radius:2px;">
      Renouveler mon programme →
    </a></td></tr></table>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="background:transparent;mso-padding-alt:0;border-radius:2px;"><a href="${site}/client" style="display:inline-block;background:transparent;color:#888;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:16px 36px;text-decoration:none;border-radius:2px;">
      Mon espace client
    </a></td></tr></table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#0A0A0A;padding:24px 40px;text-align:center;border-top:0.5px solid #1A1A1A;">
    <p style="margin:0;font-size:14px;font-weight:900;letter-spacing:5px;color:#F0EDE8;font-family:Arial,sans-serif;">
      APXFIT<span style="color:#C9A84C">NESS</span>
    </p>
    <p style="margin:8px 0 0;font-size:11px;color:#333;font-family:Arial,sans-serif;">
      © 2026 APXFITNESS — Pour vous désabonner, répondez "désinscription" à cet email.
    </p>
  </td></tr>

</table></td></tr></table>
</body></html>`;
}

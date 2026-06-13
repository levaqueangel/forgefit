import { Resend } from "resend";
import { getAdminDb } from "../../firebase-admin";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
const SITE   = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

function seancesCettesSemaine(client) {
  const hist = Array.isArray(client.seanceHistorique) ? client.seanceHistorique : [];
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  return hist.filter(s => {
    const t = s?.dateTs || (s?.date ? Date.parse(s.date) : NaN);
    return t >= weekAgo;
  }).length;
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snap = await db.collection("clients").get();
    const clients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const active = clients.filter(c => c.email && c.plan);

    let sent = 0;

    for (const client of active) {
      // Ne pas renvoyer si déjà reçu cette semaine
      const lastCheckin = client.lastCheckinAt ? new Date(client.lastCheckinAt) : null;
      const daysSince = lastCheckin ? Math.floor((Date.now() - lastCheckin.getTime()) / 86400000) : 999;
      if (daysSince < 6) continue;

      const prenom = client.nom?.split(" ")[0] || "là";
      const plan = client.plan?.toLowerCase() || "forge";
      const planColor = plan === "elite" ? "#E8C87A" : plan === "forge" ? "#C9A84C" : "#7AE07A";
      const seances = seancesCettesSemaine(client);
      const streak = client.streakDays || 0;

      // Segment comportemental
      let segment;
      if (seances >= 2) segment = "actif";
      else if (seances === 1) segment = "partiel";
      else segment = "inactif";

      try {
        await resend.emails.send({
          from: "APXFITNESS <onboarding@resend.dev>",
          replyTo: "coach.apxfitness11@gmail.com",
          to: [client.email],
          subject: buildSubject(segment, prenom, seances, streak),
          html: buildHtml(segment, prenom, plan, planColor, seances, streak, client.id, SITE),
        });
        await db.collection("clients").doc(client.id).update({ lastCheckinAt: new Date().toISOString() });
        sent++;
      } catch (e) {
        console.error(`Checkin error ${client.email}:`, e.message);
      }
    }

    return Response.json({ ok: true, sent, total: active.length });
  } catch (e) {
    console.error("Cron checkin-hebdo error:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

function buildSubject(segment, prenom, seances, streak) {
  if (segment === "actif") {
    if (streak >= 14) return `${prenom}, ${streak} jours de streak 🔥 — continue comme ça`;
    return `${prenom}, ${seances} séances cette semaine — beau boulot 💪`;
  }
  if (segment === "partiel") {
    return `${prenom}, une séance de plus et tu boucles ta semaine 🎯`;
  }
  return `${prenom}, comment tu te sens cette semaine ?`;
}

function buildHtml(segment, prenom, plan, color, seances, streak, uid, site) {
  const checkinButtons = ["🔥 En forme", "😊 Bien", "😐 Moyen", "😴 Fatigué"]
    .map((label, i) => `
    <td width="25%" style="text-align:center;">
      <a href="${site}/api/checkin-response?uid=${uid}&response=${i + 1}"
        style="display:block;background:rgba(255,255,255,0.04);border:0.5px solid #242424;color:#F0EDE8;font-size:13px;padding:12px 8px;text-decoration:none;font-family:Arial,sans-serif;">
        ${label}
      </a>
    </td>`)
    .join("");

  let titre, message, cta, ctaLabel;

  if (segment === "actif") {
    titre = streak >= 14
      ? `${streak} jours de suite ! 🔥`
      : `${seances} séances cette semaine 💪`;
    message = streak >= 14
      ? `<p style="margin:0 0 16px;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
          ${streak} jours consécutifs, ${prenom}. C'est de la régularité réelle, pas un hasard — c'est de la discipline. Continue sur cette lancée et les résultats vont s'accumuler.
        </p>`
      : `<p style="margin:0 0 16px;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
          ${seances} séances en 7 jours, ${prenom}. Tu es exactement là où il faut être. Le corps progresse quand la régularité est là — et tu l'as.
        </p>`;
    cta = `${site}/client`;
    ctaLabel = "Voir ma progression →";
  } else if (segment === "partiel") {
    titre = `Il manque une séance 🎯`;
    message = `<p style="margin:0 0 16px;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
        Tu as fait 1 séance cette semaine. C'est bien — vraiment. Mais une deuxième avant dimanche ferait toute la différence : le corps a besoin de 2 stimulations minimum par semaine pour progresser.
      </p>
      <p style="margin:0;font-size:15px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
        30 minutes suffisent. Ton programme t'attend.
      </p>`;
    cta = `${site}/client`;
    ctaLabel = "Faire ma séance maintenant →";
  } else {
    titre = `Comment tu te sens, ${prenom} ?`;
    message = `<p style="margin:0 0 16px;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
        On est lundi. La semaine dernière est passée — peu importe comment elle s'est passée. Ce qui compte, c'est la séance que tu peux faire aujourd'hui.
      </p>
      <p style="margin:0;font-size:15px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
        Réponds en un clic pour dire comment tu vas. Angel lit chaque réponse.
      </p>`;
    cta = `${site}/client`;
    ctaLabel = "Ouvrir mon programme →";
  }

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
      Check-in hebdomadaire
    </p>
  </td></tr>

  <tr><td style="background:#111;padding:36px 40px;">
    <p style="margin:0 0 16px;font-size:28px;color:${color};font-style:italic;font-family:Georgia,serif;">
      ${titre}
    </p>
    <div style="height:1px;background:linear-gradient(90deg,${color},transparent);margin:16px 0 24px;"></div>
    ${message}
  </td></tr>

  <tr><td style="background:#111;padding:0 40px 16px;">
    <table width="100%" cellpadding="0" cellspacing="8"><tr>${checkinButtons}</tr></table>
  </td></tr>

  <tr><td style="background:#111;padding:16px 40px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr><td style="background:linear-gradient(135deg,${color},#A67C2E);border-radius:2px;">
        <a href="${cta}" style="display:inline-block;color:#0A0A0A;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:14px 32px;text-decoration:none;">
          ${ctaLabel}
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

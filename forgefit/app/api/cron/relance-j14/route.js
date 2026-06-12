import { Resend } from "resend";
import { getAdminDb } from "../../firebase-admin";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

const TARGET = 3;
const WINDOW_DAYS = 14;

// Relance d'activation J14 : cible les clients arrivés au bout de leur fenêtre
// d'activation (14 jours) qui n'ont PAS atteint 3 séances — le levier anti-churn
// n°1 du secteur. Envoyée une seule fois (flag relanceJ14SentAt).
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const now = Date.now();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 3600 * 1000).toISOString();
    const sixteenDaysAgo = new Date(now - 16 * 24 * 3600 * 1000).toISOString();

    const snapshot = await db.collection("clients").get();
    const clients = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Clients dont l'inscription date de 14-16 jours, pas encore relancés J14
    const eligible = clients.filter(c => {
      if (!c.email || !c.createdAt) return false;
      if (c.relanceJ14SentAt) return false;
      if (c.createdAt >= fourteenDaysAgo || c.createdAt <= sixteenDaysAgo) return false;

      // Séances réellement loggées dans la fenêtre d'activation
      const start = new Date(c.createdAt).getTime();
      const windowEnd = start + WINDOW_DAYS * 86400000;
      const hist = Array.isArray(c.seanceHistorique) ? c.seanceHistorique : [];
      const done = hist.filter(s => {
        const t = s?.dateTs || (s?.date ? Date.parse(s.date) : NaN);
        return t >= start && t <= windowEnd;
      }).length;

      // On ne relance QUE ceux qui n'ont pas activé (<3 séances)
      return done < TARGET;
    });

    let sent = 0;
    for (const client of eligible) {
      try {
        const start = new Date(client.createdAt).getTime();
        const windowEnd = start + WINDOW_DAYS * 86400000;
        const hist = Array.isArray(client.seanceHistorique) ? client.seanceHistorique : [];
        const done = hist.filter(s => {
          const t = s?.dateTs || (s?.date ? Date.parse(s.date) : NaN);
          return t >= start && t <= windowEnd;
        }).length;

        await resend.emails.send({
          from: "APXFITNESS <onboarding@resend.dev>",
          replyTo: "coach.apxfitness11@gmail.com",
          to: [client.email],
          subject: `${client.nom?.split(" ")[0] || "Toi"}, ton corps attend ta prochaine séance 💪`,
          html: generateJ14Html(client.nom?.split(" ")[0] || "là", client.plan || "forge", done, SITE),
        });

        await db.collection("clients").doc(client.id).update({
          relanceJ14SentAt: new Date().toISOString(),
        });
        sent++;
      } catch (e) {
        console.error(`Erreur relance J14 pour ${client.email}:`, e.message);
      }
    }

    return Response.json({ success: true, sent, total: eligible.length });
  } catch (e) {
    console.error("Cron relance-j14 error:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

// Email d'activation J14 — ton : encourageant, sans culpabiliser, réamorce l'élan
function generateJ14Html(prenom, plan, done, site) {
  const planColor = plan === "elite" ? "#E8C87A" : plan === "forge" ? "#C9A84C" : "#888";
  const remaining = Math.max(1, 3 - done);
  const accroche = done === 0
    ? "Ta toute première séance est la plus importante — c'est elle qui lance tout."
    : `Tu as déjà commencé (${done} séance${done > 1 ? "s" : ""}). Il ne manque que ${remaining} séance${remaining > 1 ? "s" : ""} pour vraiment ancrer l'habitude.`;

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Ta prochaine séance t'attend</title></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="600" style="max-width:100%;width:100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="background:#0D0D0D;border-bottom:2px solid ${planColor};padding:28px 36px;text-align:center;">
    <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:6px;color:#F0EDE8;">
      APXFIT<span style="color:${planColor}">NESS</span>
    </p>
    <p style="margin:8px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#555;font-family:Arial,sans-serif;">
      Tes 2 premières semaines
    </p>
  </td></tr>

  <!-- Message -->
  <tr><td style="background:#111;padding:40px;">
    <p style="margin:0 0 8px;font-size:28px;color:#C9A84C;font-style:italic;font-family:Georgia,serif;">
      Hé ${prenom} 👋
    </p>
    <p style="margin:20px 0 0;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
      ${accroche}
    </p>
    <p style="margin:20px 0;font-size:16px;color:#888;line-height:1.8;font-family:Georgia,serif;font-style:italic;">
      Pas besoin d'une séance parfaite — juste une séance. 30 minutes suffisent à relancer la machine et à transformer une intention en habitude.
    </p>
    <div style="height:1px;background:linear-gradient(90deg,transparent,${planColor},transparent);margin:28px 0;"></div>
    <p style="margin:0;font-size:13px;color:#555;font-style:italic;font-family:Georgia,serif;">
      "Le plus dur n'est pas la séance — c'est de l'ouvrir. Le reste suit."
    </p>
  </td></tr>

  <!-- CTA -->
  <tr><td style="background:#111;padding:0 40px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="background:linear-gradient(135deg,#C9A84C,#A67C2E);mso-padding-alt:0;border-radius:2px;"><a href="${site}/client" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#A67C2E);color:#0A0A0A;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:16px 36px;text-decoration:none;border-radius:2px;">
      Faire ma séance maintenant →
    </a></td></tr></table>
    <p style="margin:16px 0 0;font-size:12px;color:#333;font-family:Arial,sans-serif;">
      Des questions ou un blocage ? Réponds directement à cet email, ton coach te répond.
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

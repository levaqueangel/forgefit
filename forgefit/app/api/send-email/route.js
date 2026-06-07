import { Resend } from "resend";

import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateHtml(nom, plan, programme) {
  const planColors = {
    starter: "#888888",
    forge: "#C9A84C",
    elite: "#E8C87A",
  };
  const planColor = planColors[plan?.toLowerCase()] || "#C9A84C";
  const planName = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Personnalisé";

  // Convertir le programme texte en HTML lisible
  const progHtml = programme
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n")
    .map(line => {
      if (line.match(/^[0-9]+\./)) return `<p style="font-weight:700;color:#E8C87A;margin:16px 0 4px;">${line}</p>`;
      if (line.match(/^[-•·]/)) return `<p style="margin:4px 0 4px 16px;color:#C8C4BC;">${line}</p>`;
      if (line.trim() === "") return `<br/>`;
      return `<p style="margin:6px 0;color:#C8C4BC;">${line}</p>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Ton programme APXFITNESS</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0D0D0D;border-bottom:2px solid ${planColor};padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:24px;font-weight:900;letter-spacing:6px;color:#F0EDE8;">
              APXFIT<span style="color:${planColor}">NESS</span>
            </p>
            <p style="margin:8px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#555;">
              Coaching personnalisé
            </p>
          </td>
        </tr>

        <!-- Badge plan -->
        <tr>
          <td style="background:#111;padding:20px 40px;text-align:center;border-bottom:0.5px solid #242424;">
            <span style="display:inline-block;background:rgba(201,168,76,0.1);border:0.5px solid ${planColor};color:${planColor};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:6px 18px;">
              PLAN ${planName.toUpperCase()}
            </span>
          </td>
        </tr>

        <!-- Message personnalisé -->
        <tr>
          <td style="background:#111;padding:40px;border-bottom:0.5px solid #242424;">
            <p style="margin:0 0 8px;font-size:28px;font-weight:300;color:#C9A84C;font-style:italic;font-family:Georgia,serif;">
              Bonjour ${nom},
            </p>
            <p style="margin:16px 0 0;font-size:16px;color:#888;line-height:1.7;font-family:Georgia,serif;font-style:italic;">
              Ton programme personnalisé est prêt. Il a été conçu spécifiquement pour toi, selon ton profil, tes objectifs et tes contraintes. C'est maintenant à toi de jouer.
            </p>
          </td>
        </tr>

        <!-- Séparateur doré -->
        <tr>
          <td style="background:#111;padding:0 40px;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,${planColor},transparent);"></div>
          </td>
        </tr>

        <!-- Programme -->
        <tr>
          <td style="background:#111;padding:40px;">
            <p style="margin:0 0 20px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${planColor};">
              — Ton programme
            </p>
            <div style="background:#0D0D0D;border:0.5px solid #242424;padding:28px;font-size:13px;line-height:1.8;">
              ${progHtml}
            </div>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#111;padding:0 40px 40px;text-align:center;">
            <p style="margin:0 0 20px;font-size:14px;color:#555;font-family:Georgia,serif;font-style:italic;">
              Des questions sur ton programme ?
            </p>
            <a href="mailto:coach.apxfitness11@gmail.com" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#A67C2E);color:#0A0A0A;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:14px 32px;text-decoration:none;">
              Contacter le coach →
            </a>
          </td>
        </tr>

        <!-- Garanties -->
        <tr>
          <td style="background:#0D0D0D;padding:28px 40px;border-top:0.5px solid #242424;border-bottom:0.5px solid #242424;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" style="text-align:center;padding:0 8px;">
                  <p style="margin:0 0 6px;font-size:20px;">🔒</p>
                  <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#555;">Paiement sécurisé</p>
                </td>
                <td width="33%" style="text-align:center;padding:0 8px;border-left:0.5px solid #242424;border-right:0.5px solid #242424;">
                  <p style="margin:0 0 6px;font-size:20px;">⚡</p>
                  <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#555;">Livraison 48h</p>
                </td>
                <td width="33%" style="text-align:center;padding:0 8px;">
                  <p style="margin:0 0 6px;font-size:20px;">↩️</p>
                  <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#555;">Satisfait ou remboursé</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0A0A0A;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:16px;font-weight:900;letter-spacing:5px;color:#F0EDE8;">
              APXFIT<span style="color:#C9A84C">NESS</span>
            </p>
            <p style="margin:0;font-size:11px;color:#333;letter-spacing:1px;">
              © 2026 APXFITNESS — Coaching personnalisé
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#333;">
              Pour vous désabonner, répondez à cet email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

function generateCoachHtml(nom, email, plan, programme) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
    <div style="background:#0A0A0A;padding:20px;text-align:center;">
      <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:4px;color:#F0EDE8;">
        APXFIT<span style="color:#C9A84C">NESS</span>
      </p>
    </div>
    <div style="padding:24px;">
      <h2 style="margin:0 0 16px;color:#0A0A0A;">📥 Nouveau client — ${nom}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="background:#f9f9f9;"><td style="padding:10px;border:1px solid #eee;font-weight:bold;">Nom</td><td style="padding:10px;border:1px solid #eee;">${nom}</td></tr>
        <tr><td style="padding:10px;border:1px solid #eee;font-weight:bold;">Email</td><td style="padding:10px;border:1px solid #eee;">${email}</td></tr>
        <tr style="background:#f9f9f9;"><td style="padding:10px;border:1px solid #eee;font-weight:bold;">Plan</td><td style="padding:10px;border:1px solid #eee;">${plan}</td></tr>
      </table>
      <div style="margin-top:20px;background:#0A0A0A;border-radius:4px;padding:20px;">
        <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;">Programme généré</p>
        <pre style="margin:0;font-size:12px;color:#C8C4BC;white-space:pre-wrap;font-family:monospace;">${programme}</pre>
      </div>
    </div>
  </div>
</body></html>`;
}

export async function POST(req) {
  // Rate limiting — pas d'auth requise (route publique appelée depuis /bilan)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!await checkRateLimit(ip, 5, 60_000)) {
    return Response.json({ error: "Trop de requêtes. Réessaie dans une minute." }, { status: 429 });
  }
  const { to, nom, plan, programme } = await req.json();

  try {
    // Email au client — HTML soigné
    await resend.emails.send({
      from: "APXFITNESS <onboarding@resend.dev>",
      replyTo: "coach.apxfitness11@gmail.com",
      to: [to],
      subject: `⚡ APXFITNESS — Ton programme ${plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : ""} est prêt, ${nom} !`,
      html: generateHtml(nom, plan, programme),
    });

    // Notif coach — HTML propre
    await resend.emails.send({
      from: "APXFITNESS <onboarding@resend.dev>",
      to: [process.env.EMAIL_COACH],
      subject: `📥 Nouveau client APXFITNESS — ${nom} (Plan ${plan})`,
      html: generateCoachHtml(nom, to, plan, programme),
    });

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

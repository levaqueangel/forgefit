import { Resend } from "resend";
import { verifyAuthToken } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";
const COACH_EMAIL = process.env.NEXT_PUBLIC_COACH_EMAIL || "coach.apxfitness11@gmail.com";

function esc(str) {
  return String(str || "")
    .slice(0, 2000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(email) {
  return typeof email === "string" &&
    /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/.test(email.trim());
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 10, 60_000)) {
    return Response.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  // Seul le coach peut envoyer des messages aux clients
  const decoded = await verifyAuthToken(req);
  if (!decoded || decoded.email !== COACH_EMAIL) {
    return Response.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { to, nom, message, clientId } = await req.json();

  // Validation
  if (!isValidEmail(to))
    return Response.json({ error: "Destinataire invalide." }, { status: 400 });
  if (!message || typeof message !== "string" || message.trim().length < 1)
    return Response.json({ error: "Message vide." }, { status: 400 });
  if (message.length > 3000)
    return Response.json({ error: "Message trop long." }, { status: 400 });

  const safeNom     = esc(nom || "Toi");
  const safeMessage = esc(message);

  try {
    await resend.emails.send({
      from: "APXFITNESS <onboarding@resend.dev>",
      to: [to],
      subject: "💬 APXFITNESS — Ton coach t'a répondu",
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#0D0D0D;border-bottom:2px solid #C9A84C;padding:24px 36px;text-align:center;">
  <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:6px;color:#F0EDE8;">APXFIT<span style="color:#C9A84C">NESS</span></p>
</td></tr>
<tr><td style="background:#111;padding:32px 36px;">
  <p style="margin:0 0 6px;font-size:22px;color:#C9A84C;font-style:italic;font-family:Georgia,serif">Bonjour ${safeNom},</p>
  <p style="margin:14px 0 20px;font-size:15px;color:#888;line-height:1.7;font-family:Georgia,serif;font-style:italic">Ton coach t'a envoyé un message.</p>
  <div style="background:#0D0D0D;border-left:3px solid #C9A84C;padding:16px 20px;margin-bottom:24px;">
    <p style="margin:0;font-size:14px;color:#C8C4BC;line-height:1.7;font-family:Arial,sans-serif;white-space:pre-wrap;">${safeMessage}</p>
  </div>
  <div style="text-align:center;">
    <a href="${SITE}/client" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#A67C2E);color:#0A0A0A;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:13px 28px;text-decoration:none;">
      Voir mon espace →
    </a>
  </div>
</td></tr>
<tr><td style="background:#0A0A0A;padding:20px;text-align:center;">
  <p style="margin:0;font-size:14px;font-weight:900;letter-spacing:5px;color:#F0EDE8;">APXFIT<span style="color:#C9A84C">NESS</span></p>
</td></tr>
</table></td></tr></table></body></html>`,
    });

    // Notification push silencieuse (best-effort)
    try {
      await fetch(`${SITE}/api/push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": process.env.CRON_SECRET || "",
        },
        body: JSON.stringify({
          clientId,
          title: "APXFITNESS — Message du coach",
          body: message.slice(0, 100),
          url: "/client",
        }),
      });
    } catch {}

    return Response.json({ success: true });
  } catch (e) {
    console.error("notify-client error:", e.message);
    return Response.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}

import { Resend } from "resend";
import { verifyAuthToken } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

// Échapper les caractères HTML pour éviter l'injection dans les emails
function esc(str) {
  return String(str || "")
    .slice(0, 1000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!await checkRateLimit(ip, 5, 60_000)) {
    return Response.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  // Auth requise — seul un client connecté peut envoyer un message au coach
  const decoded = await verifyAuthToken(req);
  if (!decoded) return Response.json({ error: "Non autorisé." }, { status: 401 });

  const { nom, email, message } = await req.json();

  // Validation des champs
  if (!nom || typeof nom !== "string" || nom.trim().length < 1)
    return Response.json({ error: "Nom manquant." }, { status: 400 });
  if (!message || typeof message !== "string" || message.trim().length < 5)
    return Response.json({ error: "Message trop court." }, { status: 400 });
  if (message.length > 2000)
    return Response.json({ error: "Message trop long (2000 caractères max)." }, { status: 400 });

  const safeNom     = esc(nom);
  const safeEmail   = esc(decoded.email || email || "");
  const safeMessage = esc(message);

  try {
    await resend.emails.send({
      from: "APXFITNESS <onboarding@resend.dev>",
      replyTo: decoded.email || "coach.apxfitness11@gmail.com",
      to: [process.env.EMAIL_COACH],
      subject: `💬 APXFITNESS — Nouveau message de ${safeNom}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;">
  <div style="background:#0A0A0A;padding:20px;text-align:center;">
    <p style="margin:0;font-size:18px;font-weight:900;letter-spacing:4px;color:#F0EDE8;">APXFIT<span style="color:#C9A84C">NESS</span></p>
  </div>
  <div style="padding:28px;">
    <h2 style="margin:0 0 16px;color:#0A0A0A;">💬 Nouveau message client</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr style="background:#f9f9f9;"><td style="padding:10px;border:1px solid #eee;font-weight:bold;">Client</td><td style="padding:10px;border:1px solid #eee;">${safeNom}</td></tr>
      <tr><td style="padding:10px;border:1px solid #eee;font-weight:bold;">Email</td><td style="padding:10px;border:1px solid #eee;">${safeEmail}</td></tr>
    </table>
    <div style="background:#0A0A0A;border-radius:4px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;">Message</p>
      <p style="margin:0;font-size:14px;color:#C8C4BC;line-height:1.7;white-space:pre-wrap;">${safeMessage}</p>
    </div>
    <div style="text-align:center;">
      <a href="${SITE}/coach" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#A67C2E);color:#0A0A0A;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:13px 28px;text-decoration:none;border-radius:2px;">
        Répondre dans le tableau de bord →
      </a>
    </div>
  </div>
</div>
</body></html>`,
    });
    return Response.json({ success: true });
  } catch (e) {
    console.error("notify-coach error:", e.message);
    return Response.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}

import { Resend } from "resend";

import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const { nom, email, message } = await req.json();
  try {
    await resend.emails.send({
      from: "APXFITNESS <onboarding@resend.dev>",
      to: [process.env.EMAIL_COACH],
      subject: `💬 APXFITNESS — Nouveau message de ${nom}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;">
  <div style="background:#0A0A0A;padding:20px;text-align:center;">
    <p style="margin:0;font-size:18px;font-weight:900;letter-spacing:4px;color:#F0EDE8;">APXFIT<span style="color:#C9A84C">NESS</span></p>
  </div>
  <div style="padding:28px;">
    <h2 style="margin:0 0 16px;color:#0A0A0A;">💬 Nouveau message client</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr style="background:#f9f9f9;"><td style="padding:10px;border:1px solid #eee;font-weight:bold;">Client</td><td style="padding:10px;border:1px solid #eee;">${nom}</td></tr>
      <tr><td style="padding:10px;border:1px solid #eee;font-weight:bold;">Email</td><td style="padding:10px;border:1px solid #eee;">${email}</td></tr>
    </table>
    <div style="background:#0A0A0A;border-radius:4px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;">Message</p>
      <p style="margin:0;font-size:14px;color:#C8C4BC;line-height:1.7;">${message}</p>
    </div>
    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app"}/coach" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#A67C2E);color:#0A0A0A;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:13px 28px;text-decoration:none;border-radius:2px;">
        Répondre dans le tableau de bord →
      </a>
    </div>
  </div>
</div>
</body></html>`,
    });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

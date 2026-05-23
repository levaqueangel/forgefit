import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const { to, nom, plan, programme } = await req.json();

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{background:#0A0A0A;color:#F0EDE8;font-family:Georgia,serif;margin:0;padding:0}
  .wrap{max-width:600px;margin:0 auto;padding:40px 32px}
  .logo{font-size:22px;font-weight:800;letter-spacing:6px;margin-bottom:32px;font-family:sans-serif}
  .logo span{color:#C9A84C}
  .badge{display:inline-block;background:rgba(201,168,76,0.1);border:0.5px solid #C9A84C;color:#C9A84C;padding:4px 14px;font-size:11px;letter-spacing:2px;margin-bottom:20px;font-family:sans-serif}
  .title{font-size:28px;font-style:italic;color:#C9A84C;margin-bottom:8px}
  .sub{font-size:14px;color:#666;margin-bottom:32px;font-family:sans-serif}
  .prog{background:#111;border:0.5px solid #222;padding:28px;font-size:13px;line-height:2;color:#C8C4BC;white-space:pre-wrap;font-family:'Courier New',monospace}
  .footer{margin-top:40px;padding-top:20px;border-top:0.5px solid #222;font-size:11px;color:#444;letter-spacing:1px;font-family:sans-serif}
</style></head><body>
<div class="wrap">
  <div class="logo">FORGE<span>FIT</span></div>
  <div class="badge">PLAN ${plan.toUpperCase()}</div>
  <div class="title">Ton programme personnalisé</div>
  <div class="sub">Bonjour ${nom}, voici ton plan sur mesure — conçu uniquement pour toi.</div>
  <div class="prog">${programme.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
  <div class="footer">
    <p>Des questions ? Réponds directement à cet email.</p>
    <p style="margin-top:8px">© 2026 ForgeFit — Coaching personnalisé</p>
  </div>
</div></body></html>`;

  try {
    // Email au client
    await resend.emails.send({
      from: "ForgeFit <onboarding@resend.dev>",
      to: [to],
      subject: `🏋️ ForgeFit — Ton programme est prêt, ${nom} !`,
      html,
    });

    // Notif coach
    await resend.emails.send({
      from: "ForgeFit <onboarding@resend.dev>",
      to: [process.env.EMAIL_COACH],
      subject: `📥 Nouveau client ForgeFit — ${nom} (${plan})`,
      html: `<div style="font-family:sans-serif;padding:20px">
        <h2>Nouveau bilan reçu</h2>
        <p><strong>${nom}</strong> (${to}) — Plan <strong>${plan}</strong></p>
        <p>Programme généré et envoyé automatiquement.</p>
        <hr/>
        <pre style="background:#f5f5f5;padding:20px;font-size:12px;white-space:pre-wrap">${programme}</pre>
      </div>`,
    });

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

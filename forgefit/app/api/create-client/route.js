import { getAdminAuth, getAdminDb } from "../firebase-admin";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Validation de format email RFC5322 simplifiée
function isValidEmail(email) {
  return typeof email === "string" &&
    /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/.test(email.trim());
}

export async function POST(req) {
  const { email, nom, plan, programme, programmeData } = await req.json();

  // ── Validation des inputs ───────────────────────────────────────
  if (!isValidEmail(email)) {
    return Response.json({ success: false, error: "Email invalide." }, { status: 400 });
  }
  if (!nom || typeof nom !== "string" || nom.trim().length < 1 || nom.trim().length > 100) {
    return Response.json({ success: false, error: "Nom manquant ou invalide." }, { status: 400 });
  }
  const validPlans = ["starter", "forge", "elite"];
  if (!plan || !validPlans.includes(plan.toLowerCase())) {
    return Response.json({ success: false, error: `Plan invalide. Valeurs acceptées : ${validPlans.join(", ")}.` }, { status: 400 });
  }
  if (!programme || typeof programme !== "string" || programme.trim().length < 10) {
    return Response.json({ success: false, error: "Programme manquant." }, { status: 400 });
  }

  // Normaliser
  const safeEmail = email.trim().toLowerCase();
  const safePlan  = plan.trim().toLowerCase();

  const password = generatePassword();

  try {
    let uid;
    try {
      const existing = await getAdminAuth().getUserByEmail(safeEmail);
      uid = existing.uid;
      await getAdminAuth().updateUser(uid, { password });
    } catch {
      const newUser = await getAdminAuth().createUser({ email: safeEmail, password, displayName: nom.trim() });
      uid = newUser.uid;
    }

    // Sauvegarder dans Firestore
    await getAdminDb().collection("clients").doc(uid).set({ nom: nom.trim(), email: safeEmail, plan: safePlan, programme, createdAt: new Date().toISOString() }, { merge: true });

    // Email d'accès à l'espace client
    await resend.emails.send({
      from: "APXFITNESS <onboarding@resend.dev>",
      to: [safeEmail],
      subject: "🔐 APXFITNESS — Accès à ton espace client",
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#0D0D0D;border-bottom:2px solid #C9A84C;padding:28px 36px;text-align:center;">
  <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:6px;color:#F0EDE8;font-family:Arial,sans-serif">APXFIT<span style="color:#C9A84C">NESS</span></p>
  <p style="margin:6px 0 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#555;font-family:Arial,sans-serif">Espace client</p>
</td></tr>
<tr><td style="background:#111;padding:36px;">
  <p style="margin:0 0 8px;font-size:24px;color:#C9A84C;font-style:italic;font-family:Georgia,serif">Bonjour ${nom},</p>
  <p style="margin:16px 0;font-size:15px;color:#888;line-height:1.7;font-family:Georgia,serif;font-style:italic">Ton espace client est prêt. Tu peux y retrouver ton programme et échanger directement avec le coach.</p>
  <div style="background:#0D0D0D;border:0.5px solid #242424;padding:24px;margin:24px 0;">
    <p style="margin:0 0 12px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;font-family:Arial,sans-serif">— Tes identifiants</p>
    <table style="width:100%;">
      <tr><td style="padding:8px 0;border-bottom:0.5px solid #242424;font-size:13px;color:#555;font-family:Arial,sans-serif;">Email</td><td style="padding:8px 0;border-bottom:0.5px solid #242424;font-size:13px;color:#E8C87A;font-family:Arial,sans-serif;text-align:right;">${safeEmail}</td></tr>
      <tr><td style="padding:8px 0;font-size:13px;color:#555;font-family:Arial,sans-serif;">Mot de passe</td><td style="padding:8px 0;font-size:16px;color:#E8C87A;font-family:'Courier New',monospace;text-align:right;font-weight:700;letter-spacing:2px;">${password}</td></tr>
    </table>
  </div>
  <div style="text-align:center;">
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app"}/client" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#A67C2E);color:#0A0A0A;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:14px 32px;text-decoration:none;font-family:Arial,sans-serif;">
      Accéder à mon espace →
    </a>
  </div>
  <p style="margin:20px 0 0;font-size:12px;color:#333;text-align:center;font-family:Arial,sans-serif;">Change ton mot de passe à ta première connexion.</p>
</td></tr>
<tr><td style="background:#0A0A0A;padding:20px;text-align:center;">
  <p style="margin:0;font-size:14px;font-weight:900;letter-spacing:5px;color:#F0EDE8;font-family:Arial,sans-serif">APXFIT<span style="color:#C9A84C">NESS</span></p>
</td></tr>
</table></td></tr></table></body></html>`,
    });

    return Response.json({ success: true, uid });
  } catch (e) {
    console.error("create-client error:", e.message);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

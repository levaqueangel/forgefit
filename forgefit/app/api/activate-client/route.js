import { getAdminAuth, getAdminDb } from "../firebase-admin";
import { Resend } from "resend";
export const dynamic = "force-dynamic";

const COACH_EMAIL = process.env.COACH_EMAIL || process.env.NEXT_PUBLIC_COACH_EMAIL || "coach.apxfitness11@gmail.com";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";
const resend = new Resend(process.env.RESEND_API_KEY);

// Vérifie que le requêteur est bien le coach
async function verifyCoach(req) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    if (decoded.email !== COACH_EMAIL) return null;
    return decoded;
  } catch { return null; }
}

export async function POST(req) {
  const coach = await verifyCoach(req);
  if (!coach) return Response.json({ error: "Non autorisé." }, { status: 403 });

  const { email, nom, plan, orderId } = await req.json();
  if (!email || !plan) return Response.json({ error: "Email et plan requis." }, { status: 400 });

  const safeEmail = email.trim().toLowerCase();
  const safePlan  = (plan || "forge").toLowerCase();
  const safeNom   = (nom || safeEmail.split("@")[0]).trim();

  try {
    const adminAuth = getAdminAuth();
    const db = getAdminDb();

    // Générer un mot de passe (utilisé seulement si nouveau compte)
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    const password = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

    // Récupérer ou créer le compte Firebase Auth
    let uid;
    let isNew = false;
    try {
      const existing = await adminAuth.getUserByEmail(safeEmail);
      uid = existing.uid;
    } catch (e) {
      if (e.code !== "auth/user-not-found") throw e;
      // Créer le compte
      const newUser = await adminAuth.createUser({ email: safeEmail, password, displayName: safeNom });
      uid = newUser.uid;
      isNew = true;
    }

    // Créer/mettre à jour le doc clients/{uid}
    await db.collection("clients").doc(uid).set({
      nom: safeNom,
      email: safeEmail,
      plan: safePlan,
      status: "actif",
      programme: null,
      programmeData: null,
      objectifs: [],
      seances: [],
      readinessScores: [],
      activatedAt: new Date().toISOString(),
      activatedBy: "coach",
    }, { merge: true });

    // Mettre à jour le doc order si orderId fourni
    if (orderId) {
      try {
        await db.collection("orders").doc(orderId).update({
          activated: true,
          activatedAt: new Date().toISOString(),
          clientUid: uid,
        });
      } catch {}
    }

    // Envoyer email d'accès au client
    const planName = safePlan.charAt(0).toUpperCase() + safePlan.slice(1);
    const prenom = safeNom.split(" ")[0];
    const planColor = safePlan === "elite" ? "#E8C87A" : safePlan === "forge" ? "#C9A84C" : "#7AE07A";

    try {
      await resend.emails.send({
        from: "APXFITNESS <onboarding@resend.dev>",
        replyTo: COACH_EMAIL,
        to: [safeEmail],
        subject: `🎉 ${prenom}, ton espace client APXFITNESS est prêt !`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#0D0D0D;border-bottom:2px solid ${planColor};padding:28px 36px;text-align:center;">
  <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:6px;color:#F0EDE8;">APXFIT<span style="color:${planColor}">NESS</span></p>
  <p style="margin:6px 0 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#555;">Plan ${planName} — Espace client activé</p>
</td></tr>
<tr><td style="background:#111;padding:36px;">
  <p style="margin:0 0 8px;font-size:28px;color:${planColor};font-style:italic;font-family:Georgia,serif;">Bienvenue ${prenom} ! 🎉</p>
  <p style="margin:16px 0;font-size:14px;color:#888;line-height:1.8;">Ton espace client privé <strong style="color:#F0EDE8">Plan ${planName}</strong> est maintenant activé. Connecte-toi dès maintenant pour accéder à ton programme.</p>

  <div style="background:#0A0A0A;border:0.5px solid #242424;padding:20px 24px;margin:24px 0;">
    <p style="margin:0 0 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#555;">Tes identifiants</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;border-bottom:0.5px solid #1A1A1A;font-size:12px;color:#555;">Email</td>
        <td style="padding:8px 0;border-bottom:0.5px solid #1A1A1A;font-size:13px;color:#E8C87A;font-family:'Courier New',monospace;text-align:right;">${safeEmail}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:12px;color:#555;">Mot de passe</td>
        <td style="padding:8px 0;font-size:13px;color:#E8C87A;font-family:'Courier New',monospace;text-align:right;">${isNew ? password : "Ton mot de passe habituel"}</td>
      </tr>
    </table>
  </div>

  <table cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 0;"><tr><td style="background:linear-gradient(135deg,${planColor},#A67C2E);border-radius:2px;">
    <a href="${SITE}/client" style="display:inline-block;color:#0A0A0A;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:16px 36px;text-decoration:none;">
      Accéder à mon espace →
    </a>
  </td></tr></table>
</td></tr>
<tr><td style="background:#0A0A0A;padding:20px 36px;text-align:center;border-top:0.5px solid #1A1A1A;">
  <p style="margin:0;font-size:11px;color:#333;">Des questions ? Réponds à cet email — Angel te répond sous 24h.</p>
</td></tr>
</table></td></tr></table>
</body></html>`,
      });
    } catch (emailErr) {
      console.error("Email non envoyé:", emailErr.message);
      // On ne bloque pas l'activation si l'email échoue
    }

    return Response.json({ success: true, uid, isNew });
  } catch (e) {
    console.error("activate-client error:", e.message);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

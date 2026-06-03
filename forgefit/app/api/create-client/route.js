import { Resend } from "resend";
import { getAdminAuth, getAdminDb, verifyAuthToken } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

function isValidEmail(email) {
  return typeof email === "string" &&
    /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/.test(email.trim());
}

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req) {
  // Vérifier l'authentification — le coach doit être connecté OU clé interne
  const internalKey = req.headers.get("x-internal-key");
  const isInternalCall = internalKey === process.env.CRON_SECRET;
  if (!isInternalCall) {
    const decoded = await verifyAuthToken(req);
    const COACH_EMAIL = process.env.NEXT_PUBLIC_COACH_EMAIL || "levaqueangel@gmail.com";
    if (!decoded || decoded.email !== COACH_EMAIL) {
      return Response.json({ error: "Non autorisé" }, { status: 401 });
    }
  }
  const { email, nom, plan, programme, programmeData } = await req.json();

  if (!isValidEmail(email))
    return Response.json({ success: false, error: "Email invalide." }, { status: 400 });
  if (!nom || typeof nom !== "string" || nom.trim().length < 1)
    return Response.json({ success: false, error: "Nom manquant." }, { status: 400 });
  const validPlans = ["starter", "forge", "elite"];
  if (!plan || !validPlans.includes(plan.toLowerCase()))
    return Response.json({ success: false, error: "Plan invalide." }, { status: 400 });
  if (!programme || typeof programme !== "string" || programme.trim().length < 10)
    return Response.json({ success: false, error: "Programme manquant." }, { status: 400 });

  const safeEmail = email.trim().toLowerCase();
  const safePlan  = plan.trim().toLowerCase();
  const password  = generatePassword();

  try {
    // Vérifier si le client existe déjà
    try {
      await getAdminAuth().getUserByEmail(safeEmail);
      return Response.json({ success: false, error: "Un compte existe déjà pour cet email." }, { status: 409 });
    } catch (e) {
      if (e.code !== "auth/user-not-found") throw e;
    }

    const newUser = await getAdminAuth().createUser({
      email: safeEmail, password, displayName: nom.trim()
    });
    const uid = newUser.uid;

    await getAdminDb().collection("clients").doc(uid).set({
      nom: nom.trim(), email: safeEmail, plan: safePlan,
      programme, programmeData: programmeData || null,
      createdAt: new Date().toISOString(),
    }, { merge: true });

    // Déterminer la couleur selon le plan
    const planColors = { starter: "#7AE07A", forge: "#C9A84C", elite: "#E8C87A" };
    const planColor = planColors[safePlan] || "#C9A84C";
    const planName = safePlan.charAt(0).toUpperCase() + safePlan.slice(1);
    const prenom = nom.trim().split(" ")[0];

    // Calculer les macros pour les afficher dans l'email
    const macros = programmeData?.nutrition;
    const objectif = programmeData?.objectif_principal || "";
    const seancesParSem = programmeData?.seances_par_semaine || 3;
    const duree = programmeData?.duree_programme_semaines || 4;

    // Extraire les 3 premiers exercices pour un aperçu
    const firstSeance = programmeData?.seances?.[0];
    const aperçuExos = firstSeance?.exercices?.slice(0, 3)
      .map(e => `${e.nom} — ${e.series}×${e.reps}`)
      .join("<br/>") || "";

    await resend.emails.send({
      from: "APXFITNESS <onboarding@resend.dev>",
      to: [safeEmail],
      subject: `🎉 ${prenom}, ton programme APXFITNESS est prêt !`,
      html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Bienvenue chez APXFITNESS</title></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="background:#0D0D0D;border-bottom:2px solid ${planColor};padding:32px 40px;text-align:center;">
    <p style="margin:0 0 6px;font-size:22px;font-weight:900;letter-spacing:6px;color:#F0EDE8;font-family:Arial,sans-serif;">
      APXFIT<span style="color:${planColor}">NESS</span>
    </p>
    <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#555;font-family:Arial,sans-serif;">
      Plan ${planName} — Coaching personnalisé
    </p>
  </td></tr>

  <!-- Hero message -->
  <tr><td style="background:#111;padding:40px 40px 28px;">
    <p style="margin:0 0 6px;font-size:32px;color:${planColor};font-style:italic;font-family:Georgia,serif;">
      Bienvenue ${prenom} ! 🎉
    </p>
    <div style="height:1px;background:linear-gradient(90deg,${planColor},transparent);margin:16px 0;"></div>
    <p style="margin:0;font-size:16px;color:#888;line-height:1.9;font-family:Georgia,serif;font-style:italic;">
      Ton programme a été généré et ton espace client est prêt. Tout est calibré pour toi —
      tes séances, ta nutrition, tes temps de repos.
    </p>
  </td></tr>

  ${objectif ? `
  <!-- Ton objectif -->
  <tr><td style="background:#111;padding:0 40px 28px;">
    <div style="background:rgba(${planColor === '#C9A84C' ? '201,168,76' : planColor === '#7AE07A' ? '122,224,122' : '232,200,122'},0.06);border:0.5px solid rgba(${planColor === '#C9A84C' ? '201,168,76' : '122,224,122'},0.25);padding:20px 24px;">
      <p style="margin:0 0 6px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${planColor};font-family:Arial,sans-serif;">— Ton objectif</p>
      <p style="margin:0;font-size:18px;color:#F0EDE8;font-family:Georgia,serif;font-style:italic;">${objectif}</p>
    </div>
  </td></tr>
  ` : ''}

  <!-- Résumé programme -->
  <tr><td style="background:#111;padding:0 40px 28px;">
    <p style="margin:0 0 14px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${planColor};font-family:Arial,sans-serif;">— Ton programme en un coup d'œil</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="33%" style="text-align:center;padding:16px 8px;background:#0D0D0D;border-right:0.5px solid #1A1A1A;">
          <p style="margin:0 0 6px;font-size:28px;font-weight:700;color:${planColor};font-family:Arial,sans-serif;">${seancesParSem}</p>
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#444;font-family:Arial,sans-serif;">séances/sem.</p>
        </td>
        <td width="33%" style="text-align:center;padding:16px 8px;background:#0D0D0D;border-right:0.5px solid #1A1A1A;">
          <p style="margin:0 0 6px;font-size:28px;font-weight:700;color:#7AE07A;font-family:Arial,sans-serif;">${duree}</p>
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#444;font-family:Arial,sans-serif;">semaines</p>
        </td>
        <td width="33%" style="text-align:center;padding:16px 8px;background:#0D0D0D;">
          <p style="margin:0 0 6px;font-size:28px;font-weight:700;color:#5DCAA5;font-family:Arial,sans-serif;">${macros?.calories_jour || "—"}</p>
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#444;font-family:Arial,sans-serif;">kcal/jour</p>
        </td>
      </tr>
    </table>
  </td></tr>

  ${macros ? `
  <!-- Macros -->
  <tr><td style="background:#111;padding:0 40px 28px;">
    <p style="margin:0 0 14px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${planColor};font-family:Arial,sans-serif;">— Tes macros quotidiens</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="33%" style="text-align:center;padding:14px 8px;background:#0D0D0D;border-right:0.5px solid #1A1A1A;">
          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#7AE07A;font-family:Arial,sans-serif;">${macros.proteines_g}g</p>
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#444;font-family:Arial,sans-serif;">Protéines</p>
        </td>
        <td width="33%" style="text-align:center;padding:14px 8px;background:#0D0D0D;border-right:0.5px solid #1A1A1A;">
          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#C9A84C;font-family:Arial,sans-serif;">${macros.glucides_g}g</p>
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#444;font-family:Arial,sans-serif;">Glucides</p>
        </td>
        <td width="33%" style="text-align:center;padding:14px 8px;background:#0D0D0D;">
          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#5DCAA5;font-family:Arial,sans-serif;">${macros.lipides_g}g</p>
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#444;font-family:Arial,sans-serif;">Lipides</p>
        </td>
      </tr>
    </table>
  </td></tr>
  ` : ''}

  ${aperçuExos ? `
  <!-- Aperçu séance -->
  <tr><td style="background:#111;padding:0 40px 28px;">
    <p style="margin:0 0 14px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${planColor};font-family:Arial,sans-serif;">— Aperçu — ${firstSeance?.nom || "Séance 1"}</p>
    <div style="background:#0D0D0D;border:0.5px solid #1A1A1A;padding:16px 20px;">
      <p style="margin:0;font-size:13px;color:#666;line-height:2.2;font-family:'Courier New',monospace;">${aperçuExos}</p>
      <p style="margin:12px 0 0;font-size:11px;color:#444;font-family:Arial,sans-serif;">+ ${Math.max(0,(firstSeance?.exercices?.length || 0) - 3)} autres exercices dans ton espace...</p>
    </div>
  </td></tr>
  ` : ''}

  <!-- Accès compte -->
  <tr><td style="background:#111;padding:0 40px 28px;">
    <p style="margin:0 0 14px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${planColor};font-family:Arial,sans-serif;">— Tes identifiants de connexion</p>
    <div style="background:#0A0A0A;border:0.5px solid #242424;padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:10px 0;border-bottom:0.5px solid #1A1A1A;font-size:12px;color:#555;font-family:Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;">Email</td>
          <td style="padding:10px 0;border-bottom:0.5px solid #1A1A1A;font-size:13px;color:#E8C87A;font-family:'Courier New',monospace;text-align:right;">${safeEmail}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:12px;color:#555;font-family:Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;">Mot de passe</td>
          <td style="padding:10px 0;font-size:13px;color:#E8C87A;font-family:'Courier New',monospace;text-align:right;letter-spacing:2px;">${password}</td>
        </tr>
      </table>
      <p style="margin:14px 0 0;font-size:11px;color:#333;font-family:Arial,sans-serif;text-align:center;">
        Change ton mot de passe lors de ta première connexion
      </p>
    </div>
  </td></tr>

  <!-- CTA -->
  <tr><td style="background:#111;padding:0 40px 40px;text-align:center;">
    <a href="${SITE}/client" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#A67C2E);color:#0A0A0A;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:18px 44px;text-decoration:none;font-family:Arial,sans-serif;">
      Accéder à mon espace →
    </a>
    <p style="margin:16px 0 0;font-size:12px;color:#333;font-family:Arial,sans-serif;">
      Des questions ? Réponds directement à cet email — Angel te répondra sous 24h.
    </p>
  </td></tr>

  <!-- Étapes suivantes -->
  <tr><td style="background:#0D0D0D;border-top:0.5px solid #1A1A1A;padding:28px 40px;">
    <p style="margin:0 0 16px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#555;font-family:Arial,sans-serif;">— Les 3 prochaines étapes</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${[
        ["1", "Connecte-toi à ton espace", "Utilise tes identifiants ci-dessus"],
        ["2", "Découvre ton programme complet", "Séances, exercices et nutrition détaillés"],
        ["3", "Démarre ta première séance", "Lance le mode Focus pour rester concentré"],
      ].map(([num, title, desc]) => `
      <tr><td style="padding:10px 0;border-bottom:0.5px solid #1A1A1A;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="32" style="vertical-align:top;">
              <div style="width:24px;height:24px;background:linear-gradient(135deg,${planColor},#A67C2E);display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#0A0A0A;font-family:Arial,sans-serif;">${num}</div>
            </td>
            <td style="padding-left:12px;">
              <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#F0EDE8;font-family:Arial,sans-serif;">${title}</p>
              <p style="margin:0;font-size:12px;color:#444;font-family:Arial,sans-serif;">${desc}</p>
            </td>
          </tr>
        </table>
      </td></tr>`).join('')}
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#0A0A0A;padding:24px 40px;text-align:center;border-top:0.5px solid #1A1A1A;">
    <p style="margin:0 0 8px;font-size:16px;font-weight:900;letter-spacing:5px;color:#F0EDE8;font-family:Arial,sans-serif;">
      APXFIT<span style="color:${planColor}">NESS</span>
    </p>
    <p style="margin:0;font-size:11px;color:#333;font-family:Arial,sans-serif;">
      © 2026 APXFITNESS — <a href="${SITE}" style="color:#444;text-decoration:none;">${SITE.replace('https://','')}</a>
    </p>
  </td></tr>

</table></td></tr></table>
</body></html>`,
    });

    return Response.json({ success: true, uid });
  } catch (e) {
    console.error("create-client error:", e.message);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

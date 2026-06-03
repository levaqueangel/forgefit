import { getAdminDb } from "../../firebase-admin";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const uid      = searchParams.get("uid");
  const response = parseInt(searchParams.get("response") || "0");
  const labels   = ["", "🔥 En forme", "😊 Bien", "😐 Moyen", "😴 Fatigué"];

  if (!uid || !response || response < 1 || response > 4) {
    return new Response("<html><body style='background:#0A0A0A;color:#F0EDE8;font-family:Arial;text-align:center;padding:3rem'><h2 style='color:#E07070'>Lien invalide</h2></body></html>",
      { headers: { "Content-Type": "text/html" } });
  }

  try {
    const db = getAdminDb();
    await db.collection("clients").doc(uid).update({
      lastCheckinResponse: labels[response],
      lastCheckinResponseAt: new Date().toISOString(),
    });
  } catch {}

  const emoji = ["🔥","😊","😐","😴"][response - 1];
  return new Response(
    `<html><head><meta charset="utf-8"/><meta http-equiv="refresh" content="3;url=https://apxfitness-brown.vercel.app/client"></head>
    <body style="background:#0A0A0A;color:#F0EDE8;font-family:Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem">
      <div style="font-size:48px;margin-bottom:1rem">${emoji}</div>
      <h2 style="font-size:28px;font-family:Georgia,serif;font-style:italic;color:#C9A84C;margin-bottom:0.5rem">Réponse enregistrée !</h2>
      <p style="color:#555;font-size:14px;margin-bottom:1.5rem">Tu as répondu : ${labels[response]}</p>
      <p style="color:#333;font-size:12px">Redirection vers ton espace dans 3 secondes...</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

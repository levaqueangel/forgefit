import { getAdminDb } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

// Recevoir et stocker les erreurs runtime des clients
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!await checkRateLimit(ip, 20, 60_000)) return Response.json({ ok: false }, { status: 429 });

  try {
    const { uid, error, page, userAgent, timestamp } = await req.json();
    if (!error) return Response.json({ ok: false });

    const db = getAdminDb();
    const logEntry = {
      uid: uid || "anonymous",
      error: String(error).slice(0, 500), // Limiter la taille
      page: page || "unknown",
      userAgent: (userAgent || "").slice(0, 200),
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("error_logs").add(logEntry);
    return Response.json({ ok: true });
  } catch (e) {
    // Ne pas faire de bruit si le logging echoue
    return Response.json({ ok: false });
  }
}

// Lire les logs (coach seulement)
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const db = getAdminDb();
    const snap = await db.collection("error_logs")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return Response.json({ logs });
  } catch (e) {
    console.error("error-log GET:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

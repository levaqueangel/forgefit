import { getAdminAuth } from "../firebase-admin";
import { getAdminDb } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

const COACH_EMAIL = process.env.COACH_EMAIL || process.env.NEXT_PUBLIC_COACH_EMAIL || "coach.apxfitness11@gmail.com";

export async function GET(req) {
  // Rate limit — même pour admin : évite les exports répétés accidentels
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 5, 60_000))
    return new Response("Too Many Requests", { status: 429 });

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = await getAdminAuth().verifyIdToken(token);

    // Seul le coach peut exporter
    if (decoded.email !== COACH_EMAIL) {
      return new Response("Forbidden", { status: 403 });
    }

    const db = getAdminDb();
    // On récupère TOUS les docs sans orderBy pour éviter d'exclure les docs
    // qui n'ont pas createdAt (créés par activate-client → champ activatedAt)
    const snapshot = await db.collection("clients").get();
    const clients = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        // Fallback : activatedAt si createdAt absent
        const dateA = a.createdAt || a.activatedAt || "";
        const dateB = b.createdAt || b.activatedAt || "";
        return dateB.localeCompare(dateA); // desc
      });

    // Construire le CSV
    const headers = [
      "Nom",
      "Email",
      "Plan",
      "Date inscription",
      "Streak (jours)",
      "Dernière connexion",
      "Objectif",
      "Programme envoyé",
      "Bilan J28 envoyé",
      "Relance J7 envoyée",
      "Dernier check-in",
      "Notation séance",
      "Calories/j",
      "Protéines/j (g)",
    ];

    const rows = clients.map(c => [
      escapeCsv(c.nom || ""),
      escapeCsv(c.email || ""),
      escapeCsv(c.plan || ""),
      escapeCsv((c.createdAt || c.activatedAt) ? new Date(c.createdAt || c.activatedAt).toLocaleDateString("fr-FR") : ""),
      c.streakDays || 0,
      escapeCsv(c.lastActiveDate ? new Date(c.lastActiveDate).toLocaleDateString("fr-FR") : ""),
      escapeCsv(c.programmeData?.objectif_principal || ""),
      c.programme ? "Oui" : "Non",
      c.recapJ28SentAt ? new Date(c.recapJ28SentAt).toLocaleDateString("fr-FR") : "Non",
      c.relanceJ7SentAt ? new Date(c.relanceJ7SentAt).toLocaleDateString("fr-FR") : "Non",
      escapeCsv(c.lastCheckinResponse || ""),
      c.lastSessionRating ? `${c.lastSessionRating.difficulte}/5 - ${c.lastSessionRating.energie}` : "",
      c.programmeData?.nutrition?.calories_jour || c.nutrition?.calories_jour || "",
      c.programmeData?.nutrition?.proteines_g || c.nutrition?.proteines_g || "",
    ]);

    const csv = [
      headers.join(";"),
      ...rows.map(r => r.join(";")),
    ].join("\n");

    const date = new Date().toISOString().split("T")[0];
    return new Response("\uFEFF" + csv, { // BOM UTF-8 pour Excel
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="apxfitness-clients-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("CSV export error:", e.message);
    return new Response("Erreur interne.", { status: 500 });
  }
}

function escapeCsv(value) {
  const str = String(value);
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

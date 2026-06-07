import Anthropic from "@anthropic-ai/sdk";
import { getAdminDb, verifyAuthToken } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── POST — analyser un repas en texte libre avec Claude ──────────────────
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 10, 60_000)) return Response.json({ error: "Trop de requêtes." }, { status: 429 });

  const decoded = await verifyAuthToken(req);
  if (!decoded) return Response.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { description, save, override } = await req.json();

    // Si on a déjà les valeurs nutritionnelles (venant du scan photo), on bypasse l'IA
    let analyse = override || null;

    if (!analyse) {
      if (!description || description.trim().length < 3) {
        return Response.json({ error: "Description trop courte" }, { status: 400 });
      }
      if (description.length > 300) {
        return Response.json({ error: "Description trop longue (300 caractères max)" }, { status: 400 });
      }
    }

    if (!analyse) {
    // Analyser avec Claude Haiku (rapide + pas cher)
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Analyse ce repas et estime les macronutriments. Réponds UNIQUEMENT avec un JSON valide, sans markdown.

Repas: "${description.trim()}"

Format JSON attendu:
{"nom":"nom court du repas","calories":350,"proteines":25,"glucides":40,"lipides":10,"heure":"${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2,"0")}","fiable":true}

Si tu n'es pas sûr, mets fiable:false. Estime au mieux même si vague.`,
      }],
    });

    try {
      const raw = response.content[0]?.text || "";
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      analyse = JSON.parse(cleaned);
    } catch {
      return Response.json({ error: "Impossible d'analyser ce repas. Sois plus précis." }, { status: 422 });
    }
    } // fin if(!analyse)

    // Sauvegarder dans Firestore si demandé
    if (save) {
      const db = getAdminDb();
      const snap = await db.collection("clients").doc(decoded.uid).get();
      if (snap.exists) {
        const data = snap.data();
        const today = new Date().toDateString();
        const journal = data.repasJournal || [];

        // description = texte libre ou result.nom (depuis scan photo)
        // analyse.nom = nom détecté par l'IA (photo ou texte)
        // Fallback "Repas scanné" si les deux sont vides (edge case)
        const descFinal = (description?.trim() || analyse?.nom?.trim() || "Repas scanné");
        const entry = {
          ...analyse,
          description: descFinal,
          date: new Date().toISOString(),
          jour: today,
          viaPhoto: !!override,
        };

        // Garder 90 jours d'historique max (3 repas/jour × 90 = 270)
        const newJournal = [...journal, entry].slice(-270);

        // Vérifier badge journal alimentaire (7 jours distincts)
        const jours = [...new Set(newJournal.map(r => r.jour))];
        const badges = data.badges || [];
        const milestones = [7, 14, 30];
        for (const milestone of milestones) {
          if (jours.length >= milestone && !badges.some(b => b.type === "journal_repas" && b.jours === milestone)) {
            badges.push({ type: "journal_repas", jours: milestone, date: new Date().toISOString() });
          }
        }

        await db.collection("clients").doc(decoded.uid).update({
          repasJournal: newJournal,
          ...(badges.length > (data.badges || []).length ? { badges } : {}),
        });
      }
    }

    return Response.json({ success: true, analyse });
  } catch (e) {
    console.error("repas error:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

// ── GET — récupérer le journal du jour ────────────────────────────────────
export async function GET(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 30, 60_000)) return Response.json({ error: "Trop de requêtes." }, { status: 429 });

  const decoded = await verifyAuthToken(req);
  if (!decoded) return Response.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const db = getAdminDb();
    const snap = await db.collection("clients").doc(decoded.uid).get();
    if (!snap.exists) return Response.json({ repas: [] });

    const data = snap.data();
    const journal = data.repasJournal || [];

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "today";

    if (mode === "today") {
      const today = new Date().toDateString();
      return Response.json({ repas: journal.filter(r => r.jour === today) });
    }
    // Retourner les 7 derniers jours
    const cutoff = new Date(Date.now() - 7 * 86400000).toDateString();
    return Response.json({ repas: journal.filter(r => new Date(r.date) >= new Date(cutoff)) });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

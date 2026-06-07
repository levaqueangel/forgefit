import Anthropic from "@anthropic-ai/sdk";
import { getAdminDb, verifyAuthToken } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Utilitaires ───────────────────────────────────────────────────────────────
function getWeekDates() {
  const now = new Date();
  const day = now.getDay(); // 0=dim … 6=sam
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function inWeek(dateStr, monday, sunday) {
  const d = new Date(dateStr);
  return d >= monday && d <= sunday;
}

// ── GET — générer le rapport hebdomadaire d'un client ────────────────────────
export async function GET(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!await checkRateLimit(ip, 10, 60_000))
    return Response.json({ error: "Trop de requêtes." }, { status: 429 });

  try {
    const decoded = await verifyAuthToken(req);
    if (!decoded) return Response.json({ error: "Non autorisé." }, { status: 401 });

    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId");
    if (!clientId) return Response.json({ error: "clientId manquant." }, { status: 400 });

    // Coach OU client lui-même
    const db = getAdminDb();
    const coachSnap = await db.collection("coaches").doc(decoded.uid).get();
    const isCoach = coachSnap.exists;
    const isClient = decoded.uid === clientId;
    if (!isCoach && !isClient)
      return Response.json({ error: "Accès refusé." }, { status: 403 });

    const clientSnap = await db.collection("clients").doc(clientId).get();
    if (!clientSnap.exists) return Response.json({ error: "Client introuvable." }, { status: 404 });

    const d = clientSnap.data();
    const pd = d.programmeData || {};
    const { monday, sunday } = getWeekDates();

    // ── 1. Séances ───────────────────────────────────────────────────────────
    const seancesHisto = (d.seanceHistorique || []).filter(s =>
      inWeek(s.date || s.dateTs, monday, sunday)
    );
    const seancesCount = seancesHisto.length;
    const seancesPrevues = pd.seances_par_semaine || 3;
    const dureeTotal = seancesHisto.reduce((sum, s) => sum + (s.dureeMin || 0), 0);

    // Volume total soulevé (kg × reps)
    const volumeTotal = seancesHisto.reduce((sum, s) =>
      sum + (s.exercices || []).reduce((es, e) =>
        es + (e.series || []).filter(sr => sr.done && sr.poidsActuel > 0)
          .reduce((ss, sr) => ss + sr.poidsActuel * (sr.repsActuel || 1), 0)
      , 0)
    , 0);

    // Notations
    const ratings = (d.sessionRatings || []).filter(r => inWeek(r.date, monday, sunday));
    const avgDiff = ratings.length
      ? Math.round(ratings.reduce((s, r) => s + (r.difficulte || 3), 0) / ratings.length * 10) / 10
      : null;

    // ── 2. Nutrition ─────────────────────────────────────────────────────────
    const repasWeek = (d.repasJournal || []).filter(r =>
      inWeek(r.date || r.jour, monday, sunday)
    );
    const jourNutrition = [...new Set(repasWeek.map(r => r.jour))].length;
    const caloTotal = repasWeek.reduce((s, r) => s + (r.calories || 0), 0);
    const protTotal = repasWeek.reduce((s, r) => s + (r.proteines || 0), 0);
    const avgCalo = jourNutrition > 0 ? Math.round(caloTotal / jourNutrition) : 0;
    const avgProt = jourNutrition > 0 ? Math.round(protTotal / jourNutrition) : 0;
    const caloCible = pd.nutrition?.calories_jour || 0;
    const protCible = pd.nutrition?.proteines_g || 0;

    // ── 3. Score de forme ────────────────────────────────────────────────────
    const readWeek = (d.readinessScores || []).filter(r => inWeek(r.date, monday, sunday));
    const avgScore = readWeek.length
      ? Math.round(readWeek.reduce((s, r) => s + r.score, 0) / readWeek.length)
      : null;
    const scoresTrend = readWeek.map(r => r.score);

    // ── 4. Objectifs ─────────────────────────────────────────────────────────
    const objectifs = d.objectifsHebdo || [];
    const coches = d.objectifsCoches || {};
    const objCoches = objectifs.filter(o => coches[o.id]).length;

    // ── 5. Streak & badges ───────────────────────────────────────────────────
    const streak = d.streakDays || 0;
    const badgesWeek = (d.badges || []).filter(b => {
      try { return inWeek(b.date, monday, sunday); } catch { return false; }
    });

    // ── Résumé pour Claude ────────────────────────────────────────────────────
    const dataContext = `
Client : ${d.nom || "Inconnu"} | Plan : ${d.plan || "Standard"}
Objectif : ${pd.objectif_principal || "Non défini"} | Niveau : ${pd.niveau || "N/A"}
Semaine du ${monday.toLocaleDateString("fr-FR")} au ${sunday.toLocaleDateString("fr-FR")}

ENTRAÎNEMENT :
- Séances complétées : ${seancesCount}/${seancesPrevues} prévues
- Durée totale : ${dureeTotal} min
- Volume total soulevé : ${Math.round(volumeTotal / 1000)} tonnes
${avgDiff !== null ? `- Difficulté perçue moyenne : ${avgDiff}/5` : ""}
${seancesHisto.map(s => `  • ${s.seanceNom} (${s.dureeMin}min)`).join("\n")}

NUTRITION :
- Jours loggés : ${jourNutrition}/7
- Calories moyennes/jour : ${avgCalo} kcal (cible : ${caloCible} kcal)
- Protéines moyennes/jour : ${avgProt}g (cible : ${protCible}g)

FORME QUOTIDIENNE :
- Check-ins réalisés : ${readWeek.length}/7
${avgScore !== null ? `- Score moyen : ${avgScore}/100` : "- Pas de données"}
${scoresTrend.length ? `- Évolution : ${scoresTrend.join(" → ")}` : ""}

OBJECTIFS HEBDOMADAIRES :
- Cochés : ${objCoches}/${objectifs.length}
${objectifs.map(o => `  ${coches[o.id] ? "✓" : "○"} ${o.texte}`).join("\n")}

STREAK : ${streak} jours consécutifs
BADGES débloqués cette semaine : ${badgesWeek.length > 0 ? badgesWeek.map(b => b.label).join(", ") : "Aucun"}
`.trim();

    // ── Génération narrative Claude ───────────────────────────────────────────
    let narrative = "";
    try {
      const aiRes = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Tu es un coach sportif expert. Génère un bilan hebdomadaire concis et bienveillant pour ce client.

${dataContext}

Format OBLIGATOIRE — réponds uniquement avec ce JSON, sans markdown :
{
  "titre": "Titre accrocheur du bilan (max 60 chars)",
  "intro": "1 phrase de résumé global (positif et motivant)",
  "points_forts": ["point fort 1", "point fort 2"],
  "points_attention": ["point à améliorer 1"],
  "conseil_semaine": "1 conseil concret et actionnable pour la semaine suivante",
  "note_globale": 7
}

La note_globale est sur 10 (entier). Sois honnête mais encourageant.`,
        }],
      });

      const raw = aiRes.content[0]?.text || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) narrative = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn("rapport narrative:", e.message);
    }

    return Response.json({
      ok: true,
      semaine: {
        debut: monday.toLocaleDateString("fr-FR"),
        fin: sunday.toLocaleDateString("fr-FR"),
      },
      client: {
        nom: d.nom || "Client",
        plan: d.plan || "Standard",
        objectif: pd.objectif_principal || "",
        streak,
      },
      entrainement: {
        seancesCount, seancesPrevues, dureeTotal,
        volumeTotal: Math.round(volumeTotal / 1000),
        avgDiff, seances: seancesHisto.map(s => ({ nom: s.seanceNom, duree: s.dureeMin })),
      },
      nutrition: { jourNutrition, avgCalo, avgProt, caloCible, protCible },
      forme: { readCount: readWeek.length, avgScore, scoresTrend },
      objectifs: { total: objectifs.length, coches: objCoches, liste: objectifs.map(o => ({ texte: o.texte, coche: !!coches[o.id] })) },
      badges: badgesWeek,
      narrative: narrative || null,
    });
  } catch (e) {
    console.error("rapport GET:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

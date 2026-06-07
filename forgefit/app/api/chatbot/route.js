import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "../rateLimit";
import { getAdminDb, verifyAuthToken } from "../firebase-admin";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function sanitizeUserInput(raw) {
  // Sécurité : nettoie l'input utilisateur (max 800 chars, retire les injections de rôle)
  if (typeof raw !== "string") return "";
  let msg = raw.slice(0, 800).trim();
  msg = msg.replace(/\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/gi, "");
  msg = msg.replace(/^(system|assistant|human|user)\s*:/gim, "");
  msg = msg.replace(/\n{4,}/g, "\n\n\n");
  return msg.trim();
}

function sanitizeAssistantMessage(raw) {
  // Les réponses IA peuvent être longues — on ne les tronque pas mais on nettoie
  if (typeof raw !== "string") return "";
  return raw.slice(0, 5000).replace(/\n{5,}/g, "\n\n\n").trim();
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 30, 60_000)) {
    return Response.json({ error: "Trop de requêtes. Réessaie dans une minute." }, { status: 429 });
  }

  try {
    const { message, history = [], uid } = await req.json();
    const clean = sanitizeUserInput(message);
    if (!clean) return Response.json({ error: "Message vide." }, { status: 400 });

    // ── Contexte client enrichi ──────────────────────────────────────────────
    let clientContext = "";
    if (uid) {
      try {
        const decoded = await verifyAuthToken(req);
        if (decoded?.uid === uid) {
          const db = getAdminDb();
          const snap = await db.collection("clients").doc(uid).get();
          if (snap.exists) {
            const d = snap.data();
            const pd = d.programmeData;

            // Programme & nutrition
            const seances = pd?.seances?.slice(0, 4)
              .map(s => `  • ${s.nom} (${s.duree_min || "~50"}min) : ${
                s.exercices?.slice(0, 4).map(e => `${e.nom} ${e.series}×${e.reps} @${e.charge}`).join(", ")
              }`)
              .join("\n") || "";

            const nutrition = pd?.nutrition
              ? `${pd.nutrition.calories_jour} kcal/j — P:${pd.nutrition.proteines_g}g G:${pd.nutrition.glucides_g}g L:${pd.nutrition.lipides_g}g`
              : "";

            // Mesures corporelles récentes
            const mesures = d.corpsMesures?.slice(-1)[0];
            const mesuresStr = mesures
              ? `Poids: ${mesures.poids || "?"}kg${mesures.taille_tour ? `, taille: ${mesures.taille_tour}cm` : ""}${mesures.bras ? `, bras: ${mesures.bras}cm` : ""}`
              : "";

            // Notations séances récentes
            const ratings = (d.sessionRatings || []).slice(-3);
            const ratingsStr = ratings.length
              ? ratings.map(r => `${r.seance}: difficulté ${r.difficulte}/5, énergie ${r.energie}`).join(" | ")
              : "";

            // Objectifs semaine en cours
            const objectifs = (d.objectifsHebdo || []).map(o => o.texte).join(", ");

            // Journal repas d'aujourd'hui
            const today = new Date().toDateString();
            const repasToday = (d.repasJournal || []).filter(r => r.jour === today);
            const repasStr = repasToday.length
              ? `${repasToday.reduce((s, r) => s + (r.calories || 0), 0)} kcal mangées (${repasToday.length} repas loggés)`
              : "";

            // Check-in bien-être le plus récent
            const checkinStr = d.lastCheckinResponse
              ? `Dernière humeur déclarée: ${d.lastCheckinResponse}${d.lastCheckinResponseAt ? ` (${new Date(d.lastCheckinResponseAt).toLocaleDateString("fr-FR")})` : ""}`
              : "";

            // Séances complétées cette semaine
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const seancesWeek = (d.seancesCompletees || []).filter(s => new Date(s.date || s) >= weekStart).length;
            const seancesWeekStr = seancesWeek > 0 ? `Séances complétées cette semaine: ${seancesWeek}` : "";

            // Progression dans le programme
            const totalSeancesTotal = (d.seancesCompletees || []).length;
            const semaineProg = pd?.duree_programme_semaines
              ? `Semaine ~${Math.min(Math.ceil(totalSeancesTotal / (pd.seances_par_semaine || 3) + 1), pd.duree_programme_semaines)}/${pd.duree_programme_semaines}`
              : "";

            clientContext = [
              d.nom           ? `Prénom: ${d.nom.split(" ")[0]}`                 : "",
              d.plan          ? `Plan: ${d.plan}`                                 : "",
              pd?.objectif_principal ? `Objectif: ${pd.objectif_principal}`       : "",
              pd?.niveau      ? `Niveau: ${pd.niveau}`                            : "",
              d.age           ? `Âge: ${d.age} ans`                               : "",
              d.genre         ? `Genre: ${d.genre}`                               : "",
              pd?.seances_par_semaine ? `Séances/sem: ${pd.seances_par_semaine}`  : "",
              semaineProg     ? `Avancement programme: ${semaineProg}`            : "",
              nutrition       ? `Nutrition cible: ${nutrition}`                   : "",
              mesuresStr      ? `Mensurations récentes: ${mesuresStr}`            : "",
              d.streakDays    ? `Streak: ${d.streakDays} jours consécutifs`       : "",
              checkinStr      ? checkinStr                                         : "",
              seancesWeekStr  ? seancesWeekStr                                    : "",
              ratingsStr      ? `Dernières séances notées: ${ratingsStr}`         : "",
              objectifs       ? `Objectifs cette semaine: ${objectifs}`           : "",
              repasStr        ? `Alimentation aujourd'hui: ${repasStr}`           : "",
              seances         ? `Programme d'entraînement:\n${seances}`           : "",
            ].filter(Boolean).join("\n");
          }
        }
      } catch {}
    }

    // Construire les instructions de personnalisation selon les données disponibles
    const clientInstructions = clientContext ? `

--- Données du client (utilise-les pour personnaliser tes réponses) ---
${clientContext}
---

Consignes de personnalisation :
- Si tu connais son prénom, utilise-le de façon naturelle (pas à chaque phrase)
- Si son streak > 7 jours et que c'est pertinent dans la conversation, mentionne-le pour encourager
- Si ses calories du jour sont loggées, tu peux commenter ou encourager sur sa nutrition
- Fais référence à ses exercices réels quand on te pose des questions techniques
- Si on te pose une question qui touche directement son programme, réponds en tenant compte de ses données spécifiques` : `

Note : Ce client n'est pas encore identifié — réponds de façon générale et professionnelle.`;

    const systemPrompt = `Tu es Alex, l'assistant IA fitness d'APXFITNESS — expert en musculation, nutrition sportive et récupération.

## Règles de format (non négociables)
- JAMAIS de phrases d'introduction vides : interdit d'écrire "Bien sûr !", "Absolument !", "Bien entendu !", "C'est une excellente question !", "En effet,", "Évidemment !" — commence toujours directement par la réponse
- **Gras** uniquement pour les points vraiment essentiels (max 2-3 par réponse), pas pour décorer
- Listes à puces (3+ éléments distincts seulement) ou texte fluide — jamais de liste pour 1-2 points
- Questions simples/factuelles → 2-4 phrases directes
- Explications techniques → titre bref en gras + liste structurée si besoin
- Ton : direct, motivant, sans bullshit — comme un vrai coach, pas un chatbot générique

## Tes connaissances clés
**Nutrition :** besoins protéiques 1.6-2.2g/kg pour hypertrophie, déficit modéré -300 à -500 kcal/j pour sèche préservant le muscle, surplus +200 à +400 kcal/j pour prise de masse maîtrisée, fenêtre anabolique flexible (0-2h post-séance)
**Musculation :** volume optimal 10-20 séries par groupe musculaire/semaine, progression de charge recommandée quand objectif de reps atteint 2 séances consécutives (+2.5kg exercices du bas, +1.25kg exercices du haut), RIR (Reps In Reserve) 1-3 pour les dernières séries
**Récupération :** 7-9h de sommeil pour optimiser les hormones anaboliques, décharge toutes les 4-8 semaines selon les signaux de fatigue, 48-72h de récupération par groupe musculaire

## Limites absolues
- Ne génère JAMAIS un programme d'entraînement complet → "Parle directement à Angel (ton coach) pour ça"
- Ne modifie JAMAIS le programme actuel du client → redirige vers le coach
- Ne diagnostique JAMAIS une douleur physique → conseille de consulter un kiné ou médecin du sport
- Ne promets jamais des résultats garantis${clientInstructions}`;


    const messages = [
      ...history.slice(-10).map(m => ({
        role: m.role,
        content: m.role === "user"
          ? sanitizeUserInput(String(m.content))
          : sanitizeAssistantMessage(String(m.content)),
      })),
      { role: "user", content: clean },
    ];

    // ── Streaming SSE ─────────────────────────────────────────────────────────
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await anthropic.messages.stream({
            model: "claude-haiku-4-5",
            max_tokens: 1200,
            system: systemPrompt,
            messages,
          });

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta?.type === "text_delta" &&
              chunk.delta.text
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          console.error("chatbot stream error:", e.message);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Erreur lors de la génération." })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("chatbot error:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

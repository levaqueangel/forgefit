import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, checkRateLimitDouble } from "../rateLimit";
import { getAdminDb, verifyAuthToken } from "../firebase-admin";
import { checkAndIncrementDailyQuota } from "../dailyQuota";
export const dynamic = "force-dynamic";

// Beta header activé une fois au niveau du client pour tout caching
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: { "anthropic-beta": "prompt-caching-2024-07-31" },
});

function sanitizeUserInput(raw) {
  if (typeof raw !== "string") return "";
  let msg = raw.slice(0, 800).trim();
  msg = msg.replace(/\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/gi, "");
  msg = msg.replace(/^(system|assistant|human|user)\s*:/gim, "");
  msg = msg.replace(/\n{4,}/g, "\n\n\n");
  return msg.trim();
}

function sanitizeAssistantMessage(raw) {
  if (typeof raw !== "string") return "";
  return raw.slice(0, 5000).replace(/\n{5,}/g, "\n\n\n").trim();
}

// Prompt statique (caché entre toutes les requêtes — ne change JAMAIS)
const STATIC_SYSTEM = `Tu es Alex, l'assistant IA fitness d'APXFITNESS — expert en musculation, nutrition sportive et récupération.

## Règles de format (non négociables)
- JAMAIS de phrases d'introduction vides : interdit d'écrire "Bien sûr !", "Absolument !", "Bien entendu !", "C'est une excellente question !", "En effet,", "Évidemment !" — commence toujours directement par la réponse
- **Gras** uniquement pour les points vraiment essentiels (max 2-3 par réponse), pas pour décorer
- Listes à puces (3+ éléments distincts seulement) ou texte fluide — jamais de liste pour 1-2 points
- Questions simples/factuelles → 2-3 phrases directes maximum, sois bref et précis
- Explications techniques → titre bref en gras + liste structurée si besoin
- Ton : direct, motivant, sans bullshit — comme un vrai coach, pas un chatbot générique
- Sois TOUJOURS concis : une bonne réponse courte vaut mieux qu'une longue vague

## Tes connaissances clés
**Nutrition :** besoins protéiques 1.6-2.2g/kg pour hypertrophie, déficit modéré -300 à -500 kcal/j pour sèche préservant le muscle, surplus +200 à +400 kcal/j pour prise de masse maîtrisée, fenêtre anabolique flexible (0-2h post-séance)
**Musculation :** volume optimal 10-20 séries par groupe musculaire/semaine, progression de charge recommandée quand objectif de reps atteint 2 séances consécutives (+2.5kg exercices du bas, +1.25kg exercices du haut), RIR (Reps In Reserve) 1-3 pour les dernières séries
**Récupération :** 7-9h de sommeil pour optimiser les hormones anaboliques, décharge toutes les 4-8 semaines selon les signaux de fatigue, 48-72h de récupération par groupe musculaire

## Limites absolues
- Ne génère JAMAIS un programme d'entraînement complet → "Parle directement à Angel (ton coach) pour ça"
- Ne modifie JAMAIS le programme actuel du client → redirige vers le coach
- Ne diagnostique JAMAIS une douleur physique → conseille de consulter un kiné ou médecin du sport
- Ne promets jamais des résultats garantis`;

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

  try {
    const { message, history = [], uid } = await req.json();

    const allowed = uid
      ? await checkRateLimitDouble(ip, uid, 30, 20, 60_000)
      : await checkRateLimit(ip, 30, 60_000);
    if (!allowed) {
      return Response.json({ error: "Trop de requêtes. Réessaie dans une minute." }, { status: 429 });
    }

    const clean = sanitizeUserInput(message);
    if (!clean) return Response.json({ error: "Message vide." }, { status: 400 });

    // ── Quota journalier ─────────────────────────────────────────────────────
    let decoded = null;
    let quotaRemaining = null;
    if (uid) {
      try {
        decoded = await verifyAuthToken(req);
        if (decoded?.uid !== uid) decoded = null;
      } catch {}
      if (decoded) {
        const quota = await checkAndIncrementDailyQuota(uid, "chat");
        if (!quota.allowed) {
          return Response.json({
            error: `Limite journalière atteinte (${quota.limit} messages/jour). Tes quotas se réinitialisent à minuit.`,
            quotaExceeded: true,
            limit: quota.limit,
          }, { status: 429 });
        }
        quotaRemaining = quota.remaining;
      }
    }

    // ── Contexte client dynamique (non caché — spécifique à chaque utilisateur) ──
    let clientContext = "";
    if (uid && decoded) {
      try {
        const db = getAdminDb();
        const snap = await db.collection("clients").doc(uid).get();
        if (snap.exists) {
          const d = snap.data();
          const pd = d.programmeData;

          const seances = pd?.seances?.slice(0, 4)
            .map(s => `  • ${s.nom} (${s.duree_min || "~50"}min) : ${
              s.exercices?.slice(0, 4).map(e => `${e.nom} ${e.series}×${e.reps} @${e.charge}`).join(", ")
            }`)
            .join("\n") || "";

          const nutrition = pd?.nutrition
            ? `${pd.nutrition.calories_jour} kcal/j — P:${pd.nutrition.proteines_g}g G:${pd.nutrition.glucides_g}g L:${pd.nutrition.lipides_g}g`
            : "";

          const mesures = d.corpsMesures?.slice(-1)[0];
          const mesuresStr = mesures
            ? `Poids: ${mesures.poids || "?"}kg${mesures.taille_tour ? `, taille: ${mesures.taille_tour}cm` : ""}${mesures.bras ? `, bras: ${mesures.bras}cm` : ""}`
            : "";

          const ratings = (d.sessionRatings || []).slice(-3);
          const ratingsStr = ratings.length
            ? ratings.map(r => `${r.seance}: difficulté ${r.difficulte}/5, énergie ${r.energie}`).join(" | ")
            : "";

          const objectifs = (d.objectifsHebdo || []).map(o => o.texte).join(", ");

          const today = new Date().toDateString();
          const repasToday = (d.repasJournal || []).filter(r => r.jour === today);
          const repasStr = repasToday.length
            ? `${repasToday.reduce((s, r) => s + (r.calories || 0), 0)} kcal mangées (${repasToday.length} repas loggés)`
            : "";

          const checkinStr = d.lastCheckinResponse
            ? `Dernière humeur déclarée: ${d.lastCheckinResponse}${d.lastCheckinResponseAt ? ` (${new Date(d.lastCheckinResponseAt).toLocaleDateString("fr-FR")})` : ""}`
            : "";

          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const seancesWeek = (d.seancesCompletees || []).filter(s => new Date(s.date || s) >= weekStart).length;
          const seancesWeekStr = seancesWeek > 0 ? `Séances complétées cette semaine: ${seancesWeek}` : "";

          const totalSeancesTotal = (d.seancesCompletees || []).length;
          const semaineProg = pd?.duree_programme_semaines
            ? `Semaine ~${Math.min(Math.ceil(totalSeancesTotal / (pd.seances_par_semaine || 3) + 1), pd.duree_programme_semaines)}/${pd.duree_programme_semaines}`
            : "";

          clientContext = [
            d.nom              ? `Prénom: ${d.nom.split(" ")[0]}`               : "",
            d.plan             ? `Plan: ${d.plan}`                               : "",
            pd?.objectif_principal ? `Objectif: ${pd.objectif_principal}`        : "",
            pd?.niveau         ? `Niveau: ${pd.niveau}`                          : "",
            d.age              ? `Âge: ${d.age} ans`                             : "",
            d.genre            ? `Genre: ${d.genre}`                             : "",
            pd?.seances_par_semaine ? `Séances/sem: ${pd.seances_par_semaine}`   : "",
            semaineProg        ? `Avancement programme: ${semaineProg}`          : "",
            nutrition          ? `Nutrition cible: ${nutrition}`                 : "",
            mesuresStr         ? `Mensurations récentes: ${mesuresStr}`          : "",
            d.streakDays       ? `Streak: ${d.streakDays} jours consécutifs`     : "",
            checkinStr         ? checkinStr                                       : "",
            seancesWeekStr     ? seancesWeekStr                                  : "",
            ratingsStr         ? `Dernières séances notées: ${ratingsStr}`       : "",
            objectifs          ? `Objectifs cette semaine: ${objectifs}`         : "",
            repasStr           ? `Alimentation aujourd'hui: ${repasStr}`         : "",
            seances            ? `Programme d'entraînement:\n${seances}`         : "",
          ].filter(Boolean).join("\n");
        }
      } catch {}
    }

    const dynamicBlock = clientContext
      ? `--- Données du client (personnalise tes réponses) ---\n${clientContext}\n---\n\nConsignes : utilise le prénom naturellement, fais référence à ses données quand c'est pertinent, reste bref.`
      : `Note : client non identifié — réponds de façon générale et professionnelle.`;

    // ── Routing : Sonnet uniquement si vraiment complexe ─────────────────────
    // Seuil relevé à 400 chars + uniquement keywords véritablement complexes
    const COMPLEX_KEYWORDS = ["calcul", "compare", "analyse", "différence entre", "explique-moi en détail"];
    const isComplex = clean.length > 400 || COMPLEX_KEYWORDS.some(k => clean.toLowerCase().includes(k));
    const model = isComplex ? "claude-sonnet-4-6" : "claude-haiku-4-5";

    // max_tokens réduit : Haiku 400, Sonnet 800 (les réponses courtes coûtent moins cher)
    const maxTokens = isComplex ? 800 : 400;

    const messages = [
      ...history.slice(-8).map(m => ({
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
            model,
            max_tokens: maxTokens,
            // system comme tableau : bloc statique caché + bloc dynamique non caché
            system: [
              {
                type: "text",
                text: STATIC_SYSTEM,
                cache_control: { type: "ephemeral" }, // caché ~5 min, partagé entre tous les users
              },
              {
                type: "text",
                text: dynamicBlock,
                // pas de cache_control : contexte spécifique à chaque utilisateur
              },
            ],
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
        ...(quotaRemaining !== null ? { "X-Quota-Remaining": String(quotaRemaining) } : {}),
      },
    });
  } catch (e) {
    console.error("chatbot error:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

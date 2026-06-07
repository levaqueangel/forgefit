import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "../rateLimit";
import { getAdminDb, verifyAuthToken } from "../firebase-admin";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function sanitizeMessage(raw) {
  if (typeof raw !== "string") return "";
  let msg = raw.slice(0, 800).trim();
  msg = msg.replace(/\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/gi, "");
  msg = msg.replace(/^(system|assistant|human|user)\s*:/gim, "");
  msg = msg.replace(/\n{4,}/g, "\n\n\n");
  return msg.trim();
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 20, 60_000)) {
    return Response.json({ error: "Trop de requêtes. Réessaie dans une minute." }, { status: 429 });
  }

  try {
    const { message, history = [], uid } = await req.json();
    const clean = sanitizeMessage(message);
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

            clientContext = [
              d.nom           ? `Prénom: ${d.nom.split(" ")[0]}`                 : "",
              d.plan          ? `Plan: ${d.plan}`                                 : "",
              pd?.objectif_principal ? `Objectif: ${pd.objectif_principal}`       : "",
              pd?.niveau      ? `Niveau: ${pd.niveau}`                            : "",
              pd?.age         ? `Âge: ${pd.age} ans`                              : "",
              pd?.genre       ? `Genre: ${pd.genre}`                              : "",
              pd?.seances_par_semaine ? `Séances/sem: ${pd.seances_par_semaine}`  : "",
              pd?.duree_programme_semaines ? `Programme: ${pd.duree_programme_semaines} semaines` : "",
              nutrition       ? `Nutrition cible: ${nutrition}`                   : "",
              mesuresStr      ? `Mensurations récentes: ${mesuresStr}`            : "",
              d.streakDays    ? `Streak: ${d.streakDays} jours consécutifs`       : "",
              ratingsStr      ? `Dernières séances notées: ${ratingsStr}`         : "",
              objectifs       ? `Objectifs cette semaine: ${objectifs}`           : "",
              repasStr        ? `Alimentation aujourd'hui: ${repasStr}`           : "",
              seances         ? `Programme d'entraînement:\n${seances}`           : "",
            ].filter(Boolean).join("\n");
          }
        }
      } catch {}
    }

    const systemPrompt = `Tu es l'assistant IA d'APXFITNESS, expert en musculation, nutrition sportive et récupération.

Ton rôle :
- Répondre aux questions sur l'entraînement, la nutrition, la récupération, le sommeil, la motivation
- Expliquer les exercices du programme du client en détail (technique, muscles ciblés, erreurs communes)
- Donner des conseils personnalisés basés sur les données du client
- Être concis (3-6 phrases max) sauf si une réponse longue est vraiment nécessaire
- Utiliser **du gras** pour les points importants, et des listes à puces quand c'est utile
- Toujours répondre en français, avec un ton motivant et bienveillant mais direct

Tu NE dois PAS :
- Générer un nouveau programme complet (c'est le rôle du coach humain)
- Donner des conseils médicaux ou diagnostiquer des douleurs sérieuses
- Promettre des résultats garantis${clientContext ? `

--- Profil du client ---
${clientContext}
---` : ""}`;

    const messages = [
      ...history.slice(-10).map(m => ({
        role: m.role,
        content: sanitizeMessage(String(m.content)),
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
            max_tokens: 1000,
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
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`)
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

import Anthropic from "@anthropic-ai/sdk";
export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { message, programmeData, history } = await req.json();
    if (!message?.trim()) return Response.json({ error: "Message vide" }, { status: 400 });

    // Contexte programme du client
    const progContext = programmeData
      ? `Le client a un programme personnalisé :
- Objectif : ${programmeData.objectif_principal || "non défini"}
- Niveau : ${programmeData.niveau || "non défini"}
- Séances/semaine : ${programmeData.seances_par_semaine || "non défini"}
- Calories cible : ${programmeData.nutrition?.calories_jour || "non défini"} kcal/jour
- Protéines : ${programmeData.nutrition?.proteines_g || "non défini"}g/jour`
      : "Le client n'a pas encore de programme APXFITNESS.";

    const systemPrompt = `Tu es l'assistant fitness d'APXFITNESS, un coach IA bienveillant et expert.

CONTEXTE CLIENT :
${progContext}

RÈGLES IMPORTANTES :
- Réponds en français, de façon concise (max 150 mots par réponse)
- Tu peux répondre aux questions sur : musculation, nutrition, récupération, technique des exercices, motivation
- Si la question est très personnalisée ou médicale, encourage à contacter directement le coach Angel
- Tu n'es PAS un médecin — pour tout symptôme ou douleur, recommande de consulter un professionnel
- Ne génère PAS de nouveaux programmes complets — oriente vers le bilan APXFITNESS pour ça
- Reste dans le domaine fitness/nutrition, refuse poliment les sujets hors sujet
- Sois chaleureux et motivant, utilise des emojis avec parcimonie`;

    const messages = [
      ...(history || []).slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message.trim() },
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const reply = response.content.map(b => b.text || "").join("").trim();
    return Response.json({ reply });
  } catch (e) {
    console.error("chatbot error:", e);
    return Response.json({ error: "Erreur. Réessaie." }, { status: 500 });
  }
}

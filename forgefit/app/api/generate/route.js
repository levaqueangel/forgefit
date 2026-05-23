import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  const data = await req.json();

  const prompt = `Tu es un coach fitness expert. Génère un programme d'entraînement personnalisé complet en français.

PROFIL CLIENT :
- Prénom : ${data.prenom}
- Âge : ${data.age} ans, ${data.genre}
- Poids : ${data.poids} kg / Taille : ${data.taille} cm
- Objectif : ${data.obj}
- Niveau : ${data.niv}
- Lieu : ${data.lieu}
- Fréquence : ${data.seances} séances/sem, ${data.duree}/séance
- Régime : ${data.regime}
- Contraintes : ${data.contraintes || "aucune"}
- Motivation : ${data.motivation || "non renseignée"}

FORMAT EXACT :
1. MESSAGE PERSONNALISÉ pour ${data.prenom} (3 phrases motivantes et chaleureuses)
2. PROGRAMME 4 SEMAINES
   Semaine 1-2 (adaptation) : liste des séances avec exercices, séries × reps × repos
   Semaine 3-4 (progression) : intensification progressive
3. CONSEILS NUTRITIONNELS (5 points concrets adaptés à l'objectif et au régime)
4. RÉCUPÉRATION & BIEN-ÊTRE (3 conseils sur le sommeil, le stress, la mobilité)
5. PROGRESSION (comment évoluer après 4 semaines)

Sois précis, bienveillant, et adapte chaque détail au profil.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const programme = message.content.map((b) => b.text || "").join("");
    return Response.json({ programme });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

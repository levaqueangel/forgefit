import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "../rateLimit";
import { verifyAuthToken } from "../firebase-admin";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Taille max image acceptée : 4 Mo en base64
const MAX_B64_SIZE = 4 * 1024 * 1024 * 1.37; // base64 overhead ~1.37×

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 10, 60_000))
    return Response.json({ error: "Trop de requêtes. Réessaie dans une minute." }, { status: 429 });

  try {
    const decoded = await verifyAuthToken(req);
    if (!decoded) return Response.json({ error: "Non autorisé." }, { status: 401 });

    const { image, mediaType } = await req.json();

    if (!image) return Response.json({ error: "Image manquante." }, { status: 400 });
    if (image.length > MAX_B64_SIZE)
      return Response.json({ error: "Image trop lourde (max 4 Mo)." }, { status: 413 });

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const mType = validTypes.includes(mediaType) ? mediaType : "image/jpeg";

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mType, data: image },
            },
            {
              type: "text",
              text: `Tu es un expert en nutrition sportive. Analyse ce repas visible sur la photo et estime ses valeurs nutritionnelles pour la portion visible.

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication, exactement dans ce format :
{
  "nom": "Nom du plat en français",
  "calories": 000,
  "proteines": 00,
  "glucides": 00,
  "lipides": 00,
  "heure": "12:30",
  "fiable": true,
  "details": "Courte note sur la composition estimée"
}

Règles :
- Si tu ne vois pas clairement de nourriture, mets fiable: false et calories/macros à 0
- Estime pour la portion visible dans l'assiette/bol
- Arrondis les macros à l'entier le plus proche
- L'heure doit être l'heure actuelle approximative (repas du matin/midi/soir)
- Ne jamais mettre de texte hors du JSON`,
            },
          ],
        },
      ],
    });

    const raw = response.content[0]?.text?.trim() || "";

    // Extraire le JSON même si le modèle ajoute du texte autour
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({
        nom: "Repas non reconnu",
        calories: 0, proteines: 0, glucides: 0, lipides: 0,
        fiable: false,
        details: "Impossible d'analyser l'image.",
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validation des champs
    const result = {
      nom: String(parsed.nom || "Repas").slice(0, 80),
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      proteines: Math.max(0, Math.round(Number(parsed.proteines) || 0)),
      glucides: Math.max(0, Math.round(Number(parsed.glucides) || 0)),
      lipides: Math.max(0, Math.round(Number(parsed.lipides) || 0)),
      heure: String(parsed.heure || new Date().toTimeString().slice(0, 5)),
      fiable: Boolean(parsed.fiable),
      details: String(parsed.details || "").slice(0, 200),
    };

    return Response.json(result);
  } catch (e) {
    console.error("repas-photo error:", e.message);
    if (e instanceof SyntaxError)
      return Response.json({ error: "Impossible de parser la réponse IA." }, { status: 500 });
    return Response.json({ error: "Erreur lors de l'analyse." }, { status: 500 });
  }
}

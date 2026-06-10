import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "../rateLimit";
import { verifyAuthToken } from "../firebase-admin";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Taille max image acceptée : 4 Mo en base64
const MAX_B64_SIZE = 4 * 1024 * 1024 * 1.37; // base64 overhead ~1.37×

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!await checkRateLimit(ip, 10, 60_000))
    return Response.json({ error: "Trop de requêtes. Réessaie dans une minute." }, { status: 429 });

  try {
    const decoded = await verifyAuthToken(req);
    if (!decoded) return Response.json({ error: "Non autorisé." }, { status: 401 });

    const { image, mediaType, description } = await req.json();

    if (!image) return Response.json({ error: "Image manquante." }, { status: 400 });
    if (image.length > MAX_B64_SIZE)
      return Response.json({ error: "Image trop lourde (max 4 Mo)." }, { status: 413 });

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const mType = validTypes.includes(mediaType) ? mediaType : "image/jpeg";

    // Contexte texte optionnel fourni par l'utilisateur
    const userContext = description?.trim()
      ? `\nL'utilisateur précise : "${description.slice(0, 200)}"`
      : "";

    const prompt = `Tu es un expert en nutrition sportive avec 15 ans d'expérience. Analyse précisément ce repas visible sur la photo et estime ses valeurs nutritionnelles pour la portion visible.${userContext}

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication, exactement dans ce format :
{
  "nom": "Nom du plat en français (ex: Poulet grillé avec riz basmati et légumes)",
  "calories": 000,
  "proteines": 00,
  "glucides": 00,
  "lipides": 00,
  "heure": "12:30",
  "fiable": true,
  "confiance": 85,
  "ingredients": ["Poulet grillé ~150g", "Riz basmati ~100g cuit", "Brocolis ~80g"],
  "details": "Estimation basée sur les proportions visibles dans l'assiette"
}

Règles strictes :
- Si tu ne vois pas clairement de nourriture ou si l'image est floue/sombre : mets fiable: false, calories/macros à 0, confiance à 0
- Estime la portion visible dans l'assiette/bol (pas pour plusieurs personnes)
- "confiance" : 0-100 (80+ = bonne visibilité et aliments identifiés avec certitude, 50-79 = estimation approximative, <50 = peu fiable)
- "ingredients" : liste de 2 à 6 éléments détectés avec leur quantité estimée en grammes
- Arrondis calories à 10 près, macros à l'entier le plus proche
- "heure" : heure réelle approximative (matin 8h-11h → petit-déj, midi 12h-14h → déjeuner, soir 19h-21h → dîner)
- Les macros doivent être cohérentes avec les calories (1g protéines=4kcal, 1g glucides=4kcal, 1g lipides=9kcal)
- Ne jamais mettre de texte hors du JSON`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mType, data: image },
            },
            { type: "text", text: prompt },
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
        fiable: false, confiance: 0, ingredients: [], details: "Impossible d'analyser l'image.",
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validation et nettoyage
    const calories = Math.max(0, Math.round(Number(parsed.calories) || 0));
    const proteines = Math.max(0, Math.round(Number(parsed.proteines) || 0));
    const glucides  = Math.max(0, Math.round(Number(parsed.glucides)  || 0));
    const lipides   = Math.max(0, Math.round(Number(parsed.lipides)   || 0));
    const confiance = Math.min(100, Math.max(0, Math.round(Number(parsed.confiance) || 0)));

    // Vérification cohérence macros/calories (tolérance 15%)
    const caloriesFromMacros = proteines * 4 + glucides * 4 + lipides * 9;
    const coherent = calories === 0 || Math.abs(caloriesFromMacros - calories) / Math.max(calories, 1) < 0.20;

    const result = {
      nom:       String(parsed.nom || "Repas").slice(0, 100),
      calories:  coherent ? calories : Math.round(caloriesFromMacros),
      proteines,
      glucides,
      lipides,
      heure:     String(parsed.heure || new Date().toTimeString().slice(0, 5)),
      fiable:    Boolean(parsed.fiable),
      confiance,
      ingredients: Array.isArray(parsed.ingredients)
        ? parsed.ingredients.slice(0, 6).map(i => String(i).slice(0, 60))
        : [],
      details:   String(parsed.details || "").slice(0, 250),
      _coherenceFixed: !coherent,
    };

    return Response.json(result);
  } catch (e) {
    console.error("repas-photo error:", e.message);
    if (e instanceof SyntaxError)
      return Response.json({ error: "Impossible de parser la réponse IA." }, { status: 500 });
    return Response.json({ error: "Erreur lors de l'analyse." }, { status: 500 });
  }
}

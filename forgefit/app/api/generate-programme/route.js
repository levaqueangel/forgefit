import Anthropic from "@anthropic-ai/sdk";
import { getAdminAuth } from "../firebase-admin";
export const dynamic = "force-dynamic";

const COACH_EMAIL = process.env.NEXT_PUBLIC_COACH_EMAIL || "coach.apxfitness11@gmail.com";

async function verifyCoach(req) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(auth.slice(7));
    if (decoded.email !== COACH_EMAIL) return null;
    return decoded;
  } catch { return null; }
}

export async function POST(req) {
  const coach = await verifyCoach(req);
  if (!coach) return Response.json({ error: "Non autorisé." }, { status: 403 });

  const body = await req.json();
  const {
    nom, age, poids, taille, sexe = "homme",
    objectif = "prise de masse",
    niveau = "intermédiaire",
    seances_par_semaine = 3,
    duree_semaines = 8,
    materiel = "salle complète",
    blessures = "aucune",
    regime = "standard",
    calories_objectif = null,
  } = body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Clé API Anthropic manquante." }, { status: 503 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Tu es un coach sportif expert. Génère un programme d'entraînement complet et personnalisé en JSON strict.

Profil client :
- Nom : ${nom || "Client"}
- Sexe : ${sexe}
- Âge : ${age || "??"} ans
- Poids : ${poids || "??"} kg
- Taille : ${taille || "??"} cm
- Objectif : ${objectif}
- Niveau : ${niveau}
- Séances par semaine : ${seances_par_semaine}
- Durée programme : ${duree_semaines} semaines
- Matériel : ${materiel}
- Blessures / contre-indications : ${blessures}
- Régime alimentaire : ${regime}
${calories_objectif ? `- Calories cibles : ${calories_objectif} kcal/jour` : ""}

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après, respectant exactement cette structure :

{
  "objectif_principal": "Description courte de l'objectif",
  "niveau": "${niveau}",
  "seances_par_semaine": ${seances_par_semaine},
  "duree_programme_semaines": ${duree_semaines},
  "regime": "${regime}",
  "seances": [
    {
      "nom": "Séance A — Push",
      "semaines": "1-4",
      "jour_type": "Lundi",
      "duree_min": 55,
      "exercices": [
        {
          "nom": "Développé couché",
          "series": 4,
          "reps": "8-10",
          "charge": "70% 1RM",
          "repos": "90 secondes",
          "conseil": "Descente contrôlée en 3 secondes"
        }
      ]
    }
  ],
  "nutrition": {
    "calories_jour": 2500,
    "proteines_g": 180,
    "glucides_g": 280,
    "lipides_g": 75,
    "conseil_nutrition": "Conseil nutritionnel personnalisé court"
  },
  "conseils_generaux": "Deux ou trois conseils généraux pour ce client"
}

Génère ${seances_par_semaine} séances différentes et équilibrées. Chaque séance doit avoir 5 à 8 exercices adaptés au niveau ${niveau} avec le matériel disponible (${materiel}). Adapte les macros au poids, à l'objectif et au sexe du client.`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0]?.text || "";

    // Extraire le JSON de la réponse
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "L'IA n'a pas retourné un JSON valide." }, { status: 500 });
    }

    const programmeData = JSON.parse(jsonMatch[0]);
    return Response.json({ success: true, programmeData });
  } catch (e) {
    console.error("generate-programme error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

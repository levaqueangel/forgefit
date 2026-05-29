import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "../rateLimit";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 60;

const LANG_LABELS = {
  fr: { jours: ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"] },
  en: { jours: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] },
  de: { jours: ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"] },
  es: { jours: ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"] },
};

function buildPrompt(data, lang) {
  const profiles = {
    fr: `Tu es un coach fitness expert. Génère un programme d'entraînement personnalisé pour ce client.

PROFIL CLIENT :
- Prénom : ${data.prenom}
- Âge : ${data.age} ans, ${data.genre}
- Poids / Taille : ${data.poids} kg / ${data.taille} cm
- Objectif : ${data.obj}
- Niveau : ${data.niv}
- Lieu : ${data.lieu}
- Fréquence : ${data.seances} séances/semaine — ${data.duree} par séance
- Alimentation : ${data.regime}
- Contraintes : ${data.contraintes || "aucune"}
- Motivation : ${data.motivation || "non renseignée"}

IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans markdown, sans backticks.
Le JSON doit respecter EXACTEMENT cette structure :

{
  "message_perso": "3 phrases motivantes et chaleureuses pour ce client spécifiquement",
  "objectif_principal": "${data.obj}",
  "niveau": "${data.niv}",
  "seances_par_semaine": ${parseInt(data.seances) || 3},
  "duree_programme_semaines": 4,
  "seances": [
    {
      "semaines": "1-2",
      "phase": "Adaptation",
      "nom": "Nom de la séance ex: Poitrine / Triceps",
      "jour_suggere": "Lundi",
      "duree_min": 50,
      "exercices": [
        {
          "nom": "Nom de l'exercice",
          "series": 4,
          "reps": "8-10",
          "charge": "description charge ex: 70% 1RM ou Poids de corps",
          "repos": "2 min",
          "conseil": "conseil technique court"
        }
      ]
    }
  ],
  "nutrition": {
    "calories_jour": 2800,
    "proteines_g": 175,
    "glucides_g": 350,
    "lipides_g": 78,
    "repas": [
      { "nom": "Petit-déjeuner", "exemples": "exemple concret" },
      { "nom": "Déjeuner", "exemples": "exemple concret" },
      { "nom": "Collation", "exemples": "exemple concret" },
      { "nom": "Dîner", "exemples": "exemple concret" }
    ],
    "conseils": ["conseil 1", "conseil 2", "conseil 3"]
  },
  "recuperation": ["conseil récup 1", "conseil récup 2"],
  "progression_apres_4_semaines": "Explication courte de comment progresser"
}

Génère ${parseInt(data.seances) || 3} séances différentes pour les semaines 1-2 (adaptation) et les mêmes séances intensifiées pour les semaines 3-4 (progression). Adapte tout au profil du client.`,

    en: `You are an expert fitness coach. Generate a personalized training program for this client.

CLIENT PROFILE:
- Name: ${data.prenom}
- Age: ${data.age} years, ${data.genre}
- Weight/Height: ${data.poids} kg / ${data.taille} cm
- Goal: ${data.obj}
- Level: ${data.niv}
- Location: ${data.lieu}
- Frequency: ${data.seances} sessions/week — ${data.duree} per session
- Diet: ${data.regime}
- Constraints: ${data.contraintes || "none"}
- Motivation: ${data.motivation || "not specified"}

IMPORTANT: Reply ONLY with a valid JSON object, no text before or after, no markdown, no backticks.
The JSON must follow EXACTLY this structure:

{
  "message_perso": "3 motivating and warm sentences for this specific client",
  "objectif_principal": "${data.obj}",
  "niveau": "${data.niv}",
  "seances_par_semaine": ${parseInt(data.seances) || 3},
  "duree_programme_semaines": 4,
  "seances": [
    {
      "semaines": "1-2",
      "phase": "Adaptation",
      "nom": "Session name e.g.: Chest / Triceps",
      "jour_suggere": "Monday",
      "duree_min": 50,
      "exercices": [
        {
          "nom": "Exercise name",
          "series": 4,
          "reps": "8-10",
          "charge": "load description e.g.: 70% 1RM or Bodyweight",
          "repos": "2 min",
          "conseil": "short technical tip"
        }
      ]
    }
  ],
  "nutrition": {
    "calories_jour": 2800,
    "proteines_g": 175,
    "glucides_g": 350,
    "lipides_g": 78,
    "repas": [
      { "nom": "Breakfast", "exemples": "concrete example" },
      { "nom": "Lunch", "exemples": "concrete example" },
      { "nom": "Snack", "exemples": "concrete example" },
      { "nom": "Dinner", "exemples": "concrete example" }
    ],
    "conseils": ["tip 1", "tip 2", "tip 3"]
  },
  "recuperation": ["recovery tip 1", "recovery tip 2"],
  "progression_apres_4_semaines": "Short explanation of how to progress"
}

Generate ${parseInt(data.seances) || 3} different sessions for weeks 1-2 (adaptation) and the same sessions intensified for weeks 3-4 (progression). Adapt everything to the client profile.`,

    de: `Du bist ein Experten-Fitness-Coach. Erstelle ein personalisiertes Trainingsprogramm für diesen Kunden.

KUNDENPROFIL:
- Vorname: ${data.prenom}
- Alter: ${data.age} Jahre, ${data.genre}
- Gewicht/Größe: ${data.poids} kg / ${data.taille} cm
- Ziel: ${data.obj}
- Level: ${data.niv}
- Trainingsort: ${data.lieu}
- Frequenz: ${data.seances} Einheiten/Woche — ${data.duree} pro Einheit
- Ernährung: ${data.regime}
- Einschränkungen: ${data.contraintes || "keine"}
- Motivation: ${data.motivation || "nicht angegeben"}

WICHTIG: Antworte NUR mit einem gültigen JSON-Objekt, kein Text davor oder danach, kein Markdown, keine Backticks.
Das JSON muss GENAU dieser Struktur folgen (gleiche Feldnamen auf Englisch, Inhalte auf Deutsch):

{
  "message_perso": "3 motivierende und herzliche Sätze für diesen spezifischen Kunden",
  "objectif_principal": "${data.obj}",
  "niveau": "${data.niv}",
  "seances_par_semaine": ${parseInt(data.seances) || 3},
  "duree_programme_semaines": 4,
  "seances": [
    {
      "semaines": "1-2",
      "phase": "Anpassung",
      "nom": "Name der Einheit z.B.: Brust / Trizeps",
      "jour_suggere": "Montag",
      "duree_min": 50,
      "exercices": [
        {
          "nom": "Übungsname",
          "series": 4,
          "reps": "8-10",
          "charge": "Gewichtsbeschreibung z.B.: 70% 1RM oder Körpergewicht",
          "repos": "2 min",
          "conseil": "kurzer technischer Tipp"
        }
      ]
    }
  ],
  "nutrition": {
    "calories_jour": 2800,
    "proteines_g": 175,
    "glucides_g": 350,
    "lipides_g": 78,
    "repas": [
      { "nom": "Frühstück", "exemples": "konkretes Beispiel" },
      { "nom": "Mittagessen", "exemples": "konkretes Beispiel" },
      { "nom": "Snack", "exemples": "konkretes Beispiel" },
      { "nom": "Abendessen", "exemples": "konkretes Beispiel" }
    ],
    "conseils": ["Tipp 1", "Tipp 2", "Tipp 3"]
  },
  "recuperation": ["Erholungstipp 1", "Erholungstipp 2"],
  "progression_apres_4_semaines": "Kurze Erklärung wie man nach 4 Wochen fortschreitet"
}`,

    es: `Eres un entrenador fitness experto. Genera un programa de entrenamiento personalizado para este cliente.

PERFIL DEL CLIENTE:
- Nombre: ${data.prenom}
- Edad: ${data.age} años, ${data.genre}
- Peso/Altura: ${data.poids} kg / ${data.taille} cm
- Objetivo: ${data.obj}
- Nivel: ${data.niv}
- Lugar: ${data.lieu}
- Frecuencia: ${data.seances} sesiones/semana — ${data.duree} por sesión
- Alimentación: ${data.regime}
- Restricciones: ${data.contraintes || "ninguna"}
- Motivación: ${data.motivation || "no especificada"}

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin markdown, sin backticks.
El JSON debe seguir EXACTAMENTE esta estructura (mismos nombres de campo en inglés, contenidos en español):

{
  "message_perso": "3 frases motivadoras y cálidas para este cliente específico",
  "objectif_principal": "${data.obj}",
  "niveau": "${data.niv}",
  "seances_par_semaine": ${parseInt(data.seances) || 3},
  "duree_programme_semaines": 4,
  "seances": [
    {
      "semaines": "1-2",
      "phase": "Adaptación",
      "nom": "Nombre de la sesión ej: Pecho / Tríceps",
      "jour_suggere": "Lunes",
      "duree_min": 50,
      "exercices": [
        {
          "nom": "Nombre del ejercicio",
          "series": 4,
          "reps": "8-10",
          "charge": "descripción de carga ej: 70% 1RM o Peso corporal",
          "repos": "2 min",
          "conseil": "consejo técnico corto"
        }
      ]
    }
  ],
  "nutrition": {
    "calories_jour": 2800,
    "proteines_g": 175,
    "glucides_g": 350,
    "lipides_g": 78,
    "repas": [
      { "nom": "Desayuno", "exemples": "ejemplo concreto" },
      { "nom": "Almuerzo", "exemples": "ejemplo concreto" },
      { "nom": "Merienda", "exemples": "ejemplo concreto" },
      { "nom": "Cena", "exemples": "ejemplo concreto" }
    ],
    "conseils": ["consejo 1", "consejo 2", "consejo 3"]
  },
  "recuperation": ["consejo recuperación 1", "consejo recuperación 2"],
  "progression_apres_4_semaines": "Explicación corta de cómo progresar"
}`,
  };

  return profiles[lang] || profiles.fr;
}

// Convertir le JSON structuré en texte lisible pour l'email
function jsonToText(data, lang) {
  const labels = {
    fr: { message:"Message personnalisé", programme:"Programme 4 semaines", semaines:"Semaines", phase:"Phase", seance:"Séance", exercices:"Exercices", series:"séries", reps:"reps", repos:"repos", nutrition:"Nutrition", calories:"Calories/jour", proteines:"Protéines", glucides:"Glucides", lipides:"Lipides", repas:"Repas", conseils:"Conseils", recuperation:"Récupération", progression:"Progression" },
    en: { message:"Personalized message", programme:"4-week program", semaines:"Weeks", phase:"Phase", seance:"Session", exercices:"Exercises", series:"sets", reps:"reps", repos:"rest", nutrition:"Nutrition", calories:"Calories/day", proteines:"Proteins", glucides:"Carbs", lipides:"Fats", repas:"Meals", conseils:"Tips", recuperation:"Recovery", progression:"Progression" },
    de: { message:"Persönliche Nachricht", programme:"4-Wochen-Programm", semaines:"Wochen", phase:"Phase", seance:"Einheit", exercices:"Übungen", series:"Sätze", reps:"Wdh", repos:"Pause", nutrition:"Ernährung", calories:"Kalorien/Tag", proteines:"Proteine", glucides:"Kohlenhydrate", lipides:"Fette", repas:"Mahlzeiten", conseils:"Tipps", recuperation:"Erholung", progression:"Progression" },
    es: { message:"Mensaje personalizado", programme:"Programa 4 semanas", semaines:"Semanas", phase:"Fase", seance:"Sesión", exercices:"Ejercicios", series:"series", reps:"reps", repos:"descanso", nutrition:"Nutrición", calories:"Calorías/día", proteines:"Proteínas", glucides:"Carbohidratos", lipides:"Grasas", repas:"Comidas", conseils:"Consejos", recuperation:"Recuperación", progression:"Progresión" },
  };
  const l = labels[lang] || labels.fr;
  let txt = "";
  txt += `1. ${l.message.toUpperCase()}\n${data.message_perso}\n\n`;
  txt += `2. ${l.programme.toUpperCase()}\n\n`;
  if (Array.isArray(data.seances)) {
    data.seances.forEach((s, i) => {
      txt += `${l.semaines} ${s.semaines} — ${s.phase}\n`;
      txt += `${l.seance} ${i+1} : ${s.nom} (${s.jour_suggere} · ${s.duree_min} min)\n`;
      if (Array.isArray(s.exercices)) {
        s.exercices.forEach(e => {
          txt += `  · ${e.nom} — ${e.series} ${l.series} × ${e.reps} ${l.reps} · ${e.charge} · ${l.repos} ${e.repos}\n`;
          if (e.conseil) txt += `    ⚡ ${e.conseil}\n`;
        });
      }
      txt += "\n";
    });
  }
  if (data.nutrition) {
    const n = data.nutrition;
    txt += `3. ${l.nutrition.toUpperCase()}\n`;
    txt += `${l.calories} : ${n.calories_jour} kcal · ${l.proteines} : ${n.proteines_g}g · ${l.glucides} : ${n.glucides_g}g · ${l.lipides} : ${n.lipides_g}g\n\n`;
    if (Array.isArray(n.repas)) {
      txt += `${l.repas} :\n`;
      n.repas.forEach(r => txt += `  · ${r.nom} : ${r.exemples}\n`);
      txt += "\n";
    }
    if (Array.isArray(n.conseils)) {
      txt += `${l.conseils} :\n`;
      n.conseils.forEach(c => txt += `  · ${c}\n`);
      txt += "\n";
    }
  }
  if (Array.isArray(data.recuperation)) {
    txt += `4. ${l.recuperation.toUpperCase()}\n`;
    data.recuperation.forEach(r => txt += `  · ${r}\n`);
    txt += "\n";
  }
  if (data.progression_apres_4_semaines) {
    txt += `5. ${l.progression.toUpperCase()}\n${data.progression_apres_4_semaines}\n`;
  }
  return txt;
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return Response.json({ error: "Trop de requêtes. Attends 1 minute avant de réessayer." }, { status: 429 });
  }

  const data = await req.json();
  const lang = ["fr","en","de","es"].includes(data.lang) ? data.lang : "fr";
  const prompt = buildPrompt(data, lang);

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("Délai dépassé — réessaie dans quelques secondes")),
      55000
    );
  });

  try {
    const response = await Promise.race([
      client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
      timeoutPromise,
    ]);

    clearTimeout(timeoutId);
    const rawText = response.content.map(b => b.text || "").join("").trim();

    // Parser le JSON — nettoyer les backticks éventuels
    const cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let programmeData;
    try {
      programmeData = JSON.parse(cleaned);
    } catch {
      // Fallback : retourner le texte brut si le JSON est invalide
      return Response.json({ programme: rawText, programmeData: null });
    }

    // Générer le texte lisible depuis le JSON
    const programme = jsonToText(programmeData, lang);
    return Response.json({ programme, programmeData });

  } catch (e) {
    clearTimeout(timeoutId);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LANG_PROMPTS = {
  fr: {
    intro: "Tu es un coach fitness expert. Génère un programme d'entraînement personnalisé complet en FRANÇAIS.",
    profil: "PROFIL CLIENT", prenom: "Prénom", age: "ans", objectif: "Objectif", niveau: "Niveau",
    lieu: "Lieu", freq: "séances/sem", regime: "Régime", contraintes: "Contraintes",
    motivation: "Motivation", aucune: "aucune", non_renseignee: "non renseignée",
    format: `FORMAT EXACT (en français) :
1. MESSAGE PERSONNALISÉ (3 phrases motivantes et chaleureuses)
2. PROGRAMME 4 SEMAINES
   Semaine 1-2 (adaptation) : exercices, séries × reps × repos
   Semaine 3-4 (progression) : intensification progressive
3. CONSEILS NUTRITIONNELS (5 points concrets)
4. RÉCUPÉRATION & BIEN-ÊTRE (3 conseils)
5. PROGRESSION (comment évoluer après 4 semaines)`,
  },
  en: {
    intro: "You are an expert fitness coach. Generate a complete personalized training program in ENGLISH.",
    profil: "CLIENT PROFILE", prenom: "First name", age: "years old", objectif: "Goal", niveau: "Level",
    lieu: "Location", freq: "sessions/week", regime: "Diet", contraintes: "Constraints",
    motivation: "Motivation", aucune: "none", non_renseignee: "not specified",
    format: `EXACT FORMAT (in English):
1. PERSONALIZED MESSAGE (3 motivating and warm sentences)
2. 4-WEEK PROGRAM
   Weeks 1-2 (adaptation): exercises, sets × reps × rest
   Weeks 3-4 (progression): progressive intensification
3. NUTRITION TIPS (5 concrete points)
4. RECOVERY & WELLBEING (3 tips)
5. PROGRESSION (how to evolve after 4 weeks)`,
  },
  de: {
    intro: "Du bist ein Experten-Fitness-Coach. Erstelle ein vollständiges personalisiertes Trainingsprogramm auf DEUTSCH.",
    profil: "KUNDENPROFIL", prenom: "Vorname", age: "Jahre alt", objectif: "Ziel", niveau: "Level",
    lieu: "Trainingsort", freq: "Einheiten/Woche", regime: "Ernährung", contraintes: "Einschränkungen",
    motivation: "Motivation", aucune: "keine", non_renseignee: "nicht angegeben",
    format: `GENAUES FORMAT (auf Deutsch):
1. PERSÖNLICHE NACHRICHT (3 motivierende und herzliche Sätze)
2. 4-WOCHEN-PROGRAMM
   Wochen 1-2 (Anpassung): Übungen, Sätze × Wdh × Pause
   Wochen 3-4 (Progression): progressive Steigerung
3. ERNÄHRUNGSTIPPS (5 konkrete Punkte)
4. ERHOLUNG & WOHLBEFINDEN (3 Tipps)
5. PROGRESSION (wie man sich nach 4 Wochen weiterentwickelt)`,
  },
  es: {
    intro: "Eres un entrenador fitness experto. Genera un programa de entrenamiento personalizado completo en ESPAÑOL.",
    profil: "PERFIL DEL CLIENTE", prenom: "Nombre", age: "años", objectif: "Objetivo", niveau: "Nivel",
    lieu: "Lugar", freq: "sesiones/semana", regime: "Alimentación", contraintes: "Restricciones",
    motivation: "Motivación", aucune: "ninguna", non_renseignee: "no especificada",
    format: `FORMATO EXACTO (en español):
1. MENSAJE PERSONALIZADO (3 frases motivadoras y cálidas)
2. PROGRAMA 4 SEMANAS
   Semanas 1-2 (adaptación): ejercicios, series × reps × descanso
   Semanas 3-4 (progresión): intensificación progresiva
3. CONSEJOS NUTRICIONALES (5 puntos concretos)
4. RECUPERACIÓN & BIENESTAR (3 consejos)
5. PROGRESIÓN (cómo evolucionar después de 4 semanas)`,
  },
};

export const maxDuration = 60; // Vercel : autoriser jusqu'à 60s pour cette route

export async function POST(req) {
  const data = await req.json();
  const lang = data.lang && LANG_PROMPTS[data.lang] ? data.lang : "fr";
  const l = LANG_PROMPTS[lang];

  const prompt = `${l.intro}

${l.profil} :
- ${l.prenom} : ${data.prenom}
- ${l.age.includes("ans") ? `Âge : ${data.age} ${l.age}, ${data.genre}` : `Age: ${data.age} ${l.age}, ${data.genre}`}
- Poids / Taille : ${data.poids} kg / ${data.taille} cm
- ${l.objectif} : ${data.obj}
- ${l.niveau} : ${data.niv}
- ${l.lieu} : ${data.lieu}
- ${l.freq} : ${data.seances} — ${data.duree}
- ${l.regime} : ${data.regime}
- ${l.contraintes} : ${data.contraintes || l.aucune}
- ${l.motivation} : ${data.motivation || l.non_renseignee}

${l.format}

Sois précis, bienveillant et adapte chaque détail au profil.`;

  // Timeout propre sans memory leak : on nettoie toujours le timer
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
        max_tokens: 2500,
        messages: [{ role: "user", content: prompt }],
      }),
      timeoutPromise,
    ]);

    clearTimeout(timeoutId); // Annuler le timer si la requête réussit
    const programme = response.content.map((b) => b.text || "").join("");
    return Response.json({ programme });
  } catch (e) {
    clearTimeout(timeoutId); // Annuler le timer même en cas d'erreur
    return Response.json({ error: e.message }, { status: 500 });
  }
}

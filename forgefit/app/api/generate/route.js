import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "../rateLimit";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 60;

// ── Calculs nutritionnels précis (Harris-Benedict + TDEE) ──────────────
function calcNutrition(data) {
  const poids = parseFloat(data.poids) || 70;
  const taille = parseFloat(data.taille) || 170;
  const age = parseInt(data.age) || 25;
  const genre = (data.genre || "").toLowerCase();
  const seances = parseInt(data.seances) || 3;
  const obj = (data.obj || "").toLowerCase();

  // BMR Harris-Benedict révisé
  let bmr;
  if (genre.includes("femme") || genre.includes("female") || genre.includes("mujer") || genre.includes("frau")) {
    bmr = 447.593 + (9.247 * poids) + (3.098 * taille) - (4.330 * age);
  } else {
    bmr = 88.362 + (13.397 * poids) + (4.799 * taille) - (5.677 * age);
  }

  // Multiplicateur d'activité selon fréquence séances/semaine
  const actMultiplier = seances <= 2 ? 1.375 : seances <= 3 ? 1.55 : seances <= 4 ? 1.65 : 1.725;
  const tdee = Math.round(bmr * actMultiplier);

  // Ajustement calorique selon objectif
  let calories;
  if (obj.includes("poids") || obj.includes("perd") || obj.includes("weight loss") || obj.includes("lose") || obj.includes("pérdida") || obj.includes("perder") || obj.includes("gewicht")) {
    calories = tdee - 400; // Déficit modéré
  } else if (obj.includes("masse") || obj.includes("muscle") || obj.includes("gain") || obj.includes("muskel") || obj.includes("muscu")) {
    calories = tdee + 250; // Surplus léger
  } else {
    calories = tdee; // Maintenance / remise en forme
  }
  calories = Math.round(calories / 50) * 50; // Arrondi au 50 le plus proche

  // Macros basées sur l'objectif et le poids
  let proteines_g, lipides_g, glucides_g;
  if (obj.includes("poids") || obj.includes("perd") || obj.includes("weight loss") || obj.includes("lose") || obj.includes("pérdida")) {
    proteines_g = Math.round(poids * 2.2);   // 2.2g/kg en perte de poids (préserve muscle)
    lipides_g   = Math.round(poids * 0.8);   // 0.8g/kg
  } else if (obj.includes("masse") || obj.includes("muscle") || obj.includes("gain") || obj.includes("muskel")) {
    proteines_g = Math.round(poids * 2.0);   // 2g/kg en prise de masse
    lipides_g   = Math.round(poids * 1.0);   // 1g/kg
  } else {
    proteines_g = Math.round(poids * 1.8);   // 1.8g/kg
    lipides_g   = Math.round(poids * 0.9);   // 0.9g/kg
  }
  const calsProteines = proteines_g * 4;
  const calsLipides   = lipides_g * 9;
  const calsGlucides  = Math.max(0, calories - calsProteines - calsLipides);
  glucides_g = Math.round(calsGlucides / 4);

  return { calories, proteines_g, glucides_g, lipides_g, tdee };
}

// ── Jours optimaux selon fréquence ───────────────────────────────────
function getJoursSuggeres(seances, lang) {
  const days = {
    fr: ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"],
    en: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    de: ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"],
    es: ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"],
  };
  const d = days[lang] || days.fr;
  const plans = {
    2: [d[0], d[3]],
    3: [d[0], d[2], d[4]],
    4: [d[0], d[1], d[3], d[4]],
    5: [d[0], d[1], d[2], d[3], d[4]],
  };
  const n = Math.min(Math.max(parseInt(seances) || 3, 2), 5);
  return plans[n] || plans[3];
}

// ── Règles exercices selon lieu ───────────────────────────────────────
function getEquipmentRules(lieu, lang) {
  const l = (lieu || "").toLowerCase();
  const rules = {
    fr: {
      gym:    "Le client s'entraîne EN SALLE avec tout l'équipement disponible (barres, haltères, câbles, machines). Utilise des exercices de salle variés.",
      home_e: "Le client s'entraîne À LA MAISON AVEC MATÉRIEL (haltères, bandes élastiques, barre de traction potentiellement). PAS de machines, PAS de barres de salle. Adapte TOUS les exercices.",
      home_ne:"Le client s'entraîne À LA MAISON SANS MATÉRIEL. UNIQUEMENT exercices au poids de corps : pompes, squats, fentes, gainage, tractions si barre, burpees, mountain climbers. ZÉRO haltère, ZÉRO machine.",
      outdoor:"Le client s'entraîne EN EXTÉRIEUR. Exercices : course, poids de corps, barres de traction/dips si parc, escaliers. Adapte en conséquence.",
    },
    en: {
      gym:    "Client trains at a GYM with full equipment (barbells, dumbbells, cables, machines). Use varied gym exercises.",
      home_e: "Client trains AT HOME WITH EQUIPMENT (dumbbells, resistance bands, pull-up bar possibly). NO machines, NO gym barbells. Adapt ALL exercises.",
      home_ne:"Client trains AT HOME WITHOUT EQUIPMENT. ONLY bodyweight exercises: push-ups, squats, lunges, planks, pull-ups if bar, burpees, mountain climbers. ZERO dumbbells, ZERO machines.",
      outdoor:"Client trains OUTDOORS. Exercises: running, bodyweight, pull-up/dip bars if park, stairs. Adapt accordingly.",
    },
    de: {
      gym:    "Der Kunde trainiert im FITNESSSTUDIO mit voller Ausstattung. Verwende abwechslungsreiche Geräteübungen.",
      home_e: "Der Kunde trainiert ZU HAUSE MIT GERÄTEN (Hanteln, Bänder, evtl. Klimmzugstange). KEINE Maschinen, KEINE Studiogeräte. Passe ALLE Übungen an.",
      home_ne:"Der Kunde trainiert ZU HAUSE OHNE GERÄTE. NUR Körpergewichtsübungen: Liegestütze, Kniebeugen, Ausfallschritte, Planks, Klimmzüge wenn Stange, Burpees. NULL Hanteln, NULL Maschinen.",
      outdoor:"Der Kunde trainiert IM FREIEN. Übungen: Laufen, Körpergewicht, Klimmzug-/Dipstangen im Park, Treppen. Anpassen entsprechend.",
    },
    es: {
      gym:    "El cliente entrena en GIMNASIO con todo el equipamiento (barras, mancuernas, cables, máquinas). Usa ejercicios variados de gimnasio.",
      home_e: "El cliente entrena EN CASA CON MATERIAL (mancuernas, bandas elásticas, posiblemente barra de dominadas). SIN máquinas, SIN barras de gimnasio. Adapta TODOS los ejercicios.",
      home_ne:"El cliente entrena EN CASA SIN MATERIAL. SOLO ejercicios con peso corporal: flexiones, sentadillas, zancadas, planchas, dominadas si hay barra, burpees. CERO mancuernas, CERO máquinas.",
      outdoor:"El cliente entrena AL AIRE LIBRE. Ejercicios: carrera, peso corporal, barras de dominadas/fondos en parque, escaleras. Adaptar en consecuencia.",
    },
  };
  const r = rules[lang] || rules.fr;
  if (l.includes("salle") || l.includes("gym") || l.includes("fitnessstudio") || l.includes("gimnasio")) return r.gym;
  if (l.includes("sans matériel") || l.includes("without equipment") || l.includes("ohne geräte") || l.includes("sin equipos")) return r.home_ne;
  if (l.includes("maison") || l.includes("home") || l.includes("hause") || l.includes("casa")) return r.home_e;
  if (l.includes("extérieur") || l.includes("outdoor") || l.includes("draußen") || l.includes("exterior") || l.includes("libre")) return r.outdoor;
  return r.gym; // Défaut
}

// ── Règles volume/intensité selon niveau ─────────────────────────────
function getLevelRules(niv, lang) {
  const n = (niv || "").toLowerCase();
  const rules = {
    fr: {
      debutant:     "DÉBUTANT : 2-3 séries max par exercice, 3-4 exercices par séance, repos 2-3 min, exercices simples et fondamentaux uniquement, technique avant la charge. PAS de techniques avancées (drop-sets, super-sets).",
      intermediaire:"INTERMÉDIAIRE : 3-4 séries, 4-5 exercices par séance, repos 90s-2min, exercices composés + isolation. 1-2 techniques avancées par séance si pertinentes.",
      avance:       "AVANCÉ : 4-5 séries, 5-6 exercices par séance, repos 60-90s, techniques avancées (super-sets, drop-sets, RPE élevé), volume élevé, intensité maximale.",
    },
    en: {
      debutant:     "BEGINNER: 2-3 sets max per exercise, 3-4 exercises per session, rest 2-3 min, simple fundamental exercises only, technique before load. NO advanced techniques.",
      intermediaire:"INTERMEDIATE: 3-4 sets, 4-5 exercises per session, rest 90s-2min, compound + isolation. 1-2 advanced techniques per session if relevant.",
      avance:       "ADVANCED: 4-5 sets, 5-6 exercises per session, rest 60-90s, advanced techniques (supersets, drop-sets, high RPE), high volume and intensity.",
    },
    de: {
      debutant:     "ANFÄNGER: Max. 2-3 Sätze pro Übung, 3-4 Übungen pro Einheit, Pause 2-3 min, nur einfache Grundübungen, Technik vor Gewicht. KEINE fortgeschrittenen Techniken.",
      intermediaire:"FORTGESCHRITTENER: 3-4 Sätze, 4-5 Übungen pro Einheit, Pause 90s-2min, Verbund- + Isolationsübungen. 1-2 fortgeschrittene Techniken.",
      avance:       "EXPERTE: 4-5 Sätze, 5-6 Übungen pro Einheit, Pause 60-90s, fortgeschrittene Techniken (Supersätze, Drop-Sets), hohes Volumen und Intensität.",
    },
    es: {
      debutant:     "PRINCIPIANTE: Máx. 2-3 series por ejercicio, 3-4 ejercicios por sesión, descanso 2-3 min, ejercicios simples y fundamentales únicamente, técnica antes que carga. SIN técnicas avanzadas.",
      intermediaire:"INTERMEDIO: 3-4 series, 4-5 ejercicios por sesión, descanso 90s-2min, ejercicios compuestos + aislamiento. 1-2 técnicas avanzadas por sesión.",
      avance:       "AVANZADO: 4-5 series, 5-6 ejercicios por sesión, descanso 60-90s, técnicas avanzadas (superseries, drop-sets, RPE alto), volumen e intensidad máximos.",
    },
  };
  const r = rules[lang] || rules.fr;
  if (n.includes("deb") || n.includes("beg") || n.includes("anf") || n.includes("prin")) return r.debutant;
  if (n.includes("av") || n.includes("exp") || n.includes("adv")) return r.avance;
  return r.intermediaire;
}

// ── Règles contraintes/blessures ──────────────────────────────────────
function getConstraintRules(contraintes, lang) {
  if (!contraintes || contraintes.trim() === "") return "";
  const labels = {
    fr: `CONTRAINTES MÉDICALES IMPORTANTES : "${contraintes}"\nAdapte OBLIGATOIREMENT le programme en conséquence. Remplace tous les exercices incompatibles par des alternatives sûres. Mentionne-le explicitement dans le message personnalisé.`,
    en: `IMPORTANT MEDICAL CONSTRAINTS: "${contraintes}"\nMANDATORILY adapt the program accordingly. Replace all incompatible exercises with safe alternatives. Mention it explicitly in the personalized message.`,
    de: `WICHTIGE MEDIZINISCHE EINSCHRÄNKUNGEN: "${contraintes}"\nPasse das Programm ZWINGEND entsprechend an. Ersetze alle unverträglichen Übungen durch sichere Alternativen. Erwähne es explizit in der persönlichen Nachricht.`,
    es: `RESTRICCIONES MÉDICAS IMPORTANTES: "${contraintes}"\nAdapta OBLIGATORIAMENTE el programa en consecuencia. Reemplaza todos los ejercicios incompatibles con alternativas seguras. Menciónalo explícitamente en el mensaje personalizado.`,
  };
  return labels[lang] || labels.fr;
}

// ── Règles plan (Starter/Forge/Elite) ────────────────────────────────
function getPlanRules(plan, lang) {
  const p = (plan || "starter").toLowerCase();
  const rules = {
    fr: {
      starter: "PLAN STARTER : Programme essentiel 4 semaines. 4-5 exercices par séance maximum. Focus sur les bases. Conseils nutrition simples et actionnables.",
      forge:   "PLAN FORGE : Programme complet 4 semaines avec suivi 3 mois. 5-6 exercices par séance. Notes de progression claires pour le suivi mensuel. Nutrition détaillée avec timing des repas.",
      elite:   "PLAN ELITE : Programme premium 4 semaines avec suivi 6 mois et visio hebdo. 5-7 exercices par séance. Périodisation avancée, RPE suggéré pour chaque exercice, stratégie nutrition complète, conseils récupération approfondis.",
    },
    en: {
      starter: "STARTER PLAN: Essential 4-week program. 4-5 exercises per session maximum. Focus on basics. Simple and actionable nutrition tips.",
      forge:   "FORGE PLAN: Complete 4-week program with 3-month follow-up. 5-6 exercises per session. Clear progression notes for monthly monitoring. Detailed nutrition with meal timing.",
      elite:   "ELITE PLAN: Premium 4-week program with 6-month follow-up and weekly video calls. 5-7 exercises per session. Advanced periodization, suggested RPE for each exercise, complete nutrition strategy.",
    },
    de: {
      starter: "STARTER-PLAN: Wesentliches 4-Wochen-Programm. Max. 4-5 Übungen pro Einheit. Fokus auf Grundlagen. Einfache Ernährungstipps.",
      forge:   "FORGE-PLAN: Vollständiges 4-Wochen-Programm mit 3-Monats-Begleitung. 5-6 Übungen pro Einheit. Klare Progression für monatliches Follow-up. Detaillierte Ernährung.",
      elite:   "ELITE-PLAN: Premium 4-Wochen-Programm mit 6-Monats-Begleitung und wöchentlichen Video-Calls. 5-7 Übungen pro Einheit. Fortgeschrittene Periodisierung, RPE-Vorschläge, vollständige Ernährungsstrategie.",
    },
    es: {
      starter: "PLAN STARTER: Programa esencial 4 semanas. Máx. 4-5 ejercicios por sesión. Enfoque en los fundamentos. Consejos nutricionales simples.",
      forge:   "PLAN FORGE: Programa completo 4 semanas con seguimiento 3 meses. 5-6 ejercicios por sesión. Notas de progresión claras. Nutrición detallada con timing de comidas.",
      elite:   "PLAN ELITE: Programa premium 4 semanas con seguimiento 6 meses y videollamadas semanales. 5-7 ejercicios por sesión. Periodización avanzada, RPE sugerido, estrategia nutricional completa.",
    },
  };
  const r = rules[lang] || rules.fr;
  return r[p] || r.starter;
}

// ── Construction du prompt ultra-précis ──────────────────────────────
function buildPrompt(data, lang, nutrition, jours) {
  const equipmentRule  = getEquipmentRules(data.lieu, lang);
  const levelRule      = getLevelRules(data.niv, lang);
  const constraintRule = getConstraintRules(data.contraintes, lang);
  const planRule       = getPlanRules(data.plan, lang);
  const nbSeances      = Math.min(Math.max(parseInt(data.seances) || 3, 2), 5);
  const joursStr       = jours.join(", ");

  const imc = Math.round((parseFloat(data.poids) / Math.pow(parseFloat(data.taille)/100, 2)) * 10) / 10;

  const progressionNote = {
    fr: `PROGRESSION OBLIGATOIRE SEMAINES 3-4 : Augmenter TOUTES les charges de 5-10% sur les exercices composés. Réduire les temps de repos de 15-20%. Ajouter 1-2 reps sur les exercices au poids de corps. Phase 3-4 = "${lang === "fr" ? "Progression" : "Progression"}" (pas "Adaptation").`,
    en: `MANDATORY PROGRESSION WEEKS 3-4: Increase ALL loads by 5-10% on compound exercises. Reduce rest times by 15-20%. Add 1-2 reps on bodyweight exercises. Phase 3-4 = "Progression" (not "Adaptation").`,
    de: `OBLIGATORISCHE STEIGERUNG WOCHE 3-4: Alle Gewichte um 5-10% erhöhen. Pausenzeiten um 15-20% reduzieren. 1-2 Wdh mehr bei Körpergewichtsübungen. Phase 3-4 = "Progression".`,
    es: `PROGRESIÓN OBLIGATORIA SEMANAS 3-4: Aumentar TODAS las cargas un 5-10% en ejercicios compuestos. Reducir tiempos de descanso 15-20%. Añadir 1-2 reps en ejercicios de peso corporal. Fase 3-4 = "Progresión".`,
  };

  const intro = {
    fr: `Tu es un coach fitness certifié et expert en prescription d'exercice. Génère un programme 100% PERSONNALISÉ pour ce client spécifique.`,
    en: `You are a certified fitness coach and expert in exercise prescription. Generate a 100% PERSONALIZED program for this specific client.`,
    de: `Du bist ein zertifizierter Fitness-Coach und Experte für Trainingsplanung. Erstelle ein zu 100% PERSONALISIERTES Programm für diesen spezifischen Kunden.`,
    es: `Eres un entrenador fitness certificado y experto en prescripción de ejercicio. Genera un programa 100% PERSONALIZADO para este cliente específico.`,
  };

  const profileLabel = { fr:"PROFIL COMPLET", en:"COMPLETE PROFILE", de:"VOLLSTÄNDIGES PROFIL", es:"PERFIL COMPLETO" };
  const tdeeLabel = { fr:"Dépense énergétique calculée (TDEE)", en:"Calculated energy expenditure (TDEE)", de:"Berechneter Energiebedarf (TDEE)", es:"Gasto energético calculado (TDEE)" };
  const imcLabel = { fr:"IMC calculé", en:"Calculated BMI", de:"Berechneter BMI", es:"IMC calculado" };

  return `${intro[lang] || intro.fr}

${profileLabel[lang] || "PROFIL"} :
- Prénom/Name : ${data.prenom}
- Âge/Age : ${data.age} ans/years, ${data.genre}
- Poids/Weight : ${data.poids} kg | Taille/Height : ${data.taille} cm
- ${imcLabel[lang] || "IMC"} : ${imc}
- Objectif/Goal : ${data.obj}
- Niveau/Level : ${data.niv}
- Lieu/Location : ${data.lieu}
- Fréquence/Frequency : ${data.seances} séances/semaine — ${data.duree} par séance
- Alimentation/Diet : ${data.regime}
- Contraintes/Constraints : ${data.contraintes || "aucune/none"}
- Motivation : ${data.motivation || "non renseignée/not specified"}
- Plan acheté/Purchased plan : ${data.plan || "starter"}

CALORIES & MACROS PRÉ-CALCULÉES (à utiliser EXACTEMENT dans le JSON) :
- ${tdeeLabel[lang] || "TDEE"} : ${nutrition.tdee} kcal/jour
- Calories cible/Target : ${nutrition.calories} kcal/jour
- Protéines/Proteins : ${nutrition.proteines_g}g (${Math.round(nutrition.proteines_g * 4)} kcal)
- Glucides/Carbs : ${nutrition.glucides_g}g (${Math.round(nutrition.glucides_g * 4)} kcal)
- Lipides/Fats : ${nutrition.lipides_g}g (${Math.round(nutrition.lipides_g * 9)} kcal)

RÈGLE ÉQUIPEMENT / EQUIPMENT RULE :
${equipmentRule}

RÈGLE NIVEAU / LEVEL RULE :
${levelRule}

${planRule}

${constraintRule ? constraintRule + "\n\n" : ""}JOURS D'ENTRAÎNEMENT SUGGÉRÉS (utilise EXACTEMENT ces jours) :
${joursStr} (${nbSeances} séances/semaine)

${progressionNote[lang] || progressionNote.fr}

MESSAGE PERSONNALISÉ OBLIGATOIRE :
- Utilise le PRÉNOM du client
- Mentionne son OBJECTIF SPÉCIFIQUE
- Si motivation fournie, fais-y référence : "${data.motivation || ""}"
- Si contrainte, rassure sur les adaptations
- Ton chaleureux, motivant, professionnel

IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans markdown, sans backticks.
Génère EXACTEMENT ${nbSeances} séances DIFFÉRENTES pour semaines 1-2 (Adaptation) ET les MÊMES ${nbSeances} séances INTENSIFIÉES pour semaines 3-4 (Progression).
Total = ${nbSeances * 2} objets dans le tableau "seances".

{
  "message_perso": "Message utilisant le prénom ${data.prenom}, son objectif ${data.obj}, sa motivation si fournie, ton chaleureux",
  "objectif_principal": "${data.obj}",
  "niveau": "${data.niv}",
  "seances_par_semaine": ${nbSeances},
  "duree_programme_semaines": 4,
  "seances": [
    {
      "semaines": "1-2",
      "phase": "Adaptation",
      "nom": "Nom séance adapté au lieu/objectif",
      "jour_suggere": "${jours[0] || "Lundi"}",
      "duree_min": 50,
      "exercices": [
        {
          "nom": "Exercice adapté au lieu et niveau",
          "series": 3,
          "reps": "10-12",
          "charge": "Charge adaptée niveau/lieu",
          "repos": "2 min",
          "conseil": "Conseil technique spécifique court"
        }
      ]
    },
    {
      "semaines": "3-4",
      "phase": "Progression",
      "nom": "Même séance intensifiée (+5-10% charge)",
      "jour_suggere": "${jours[0] || "Lundi"}",
      "duree_min": 55,
      "exercices": [
        {
          "nom": "Même exercice charge augmentée",
          "series": 4,
          "reps": "8-10",
          "charge": "Charge +5-10%",
          "repos": "90 sec",
          "conseil": "Conseil progression"
        }
      ]
    }
  ],
  "nutrition": {
    "calories_jour": ${nutrition.calories},
    "proteines_g": ${nutrition.proteines_g},
    "glucides_g": ${nutrition.glucides_g},
    "lipides_g": ${nutrition.lipides_g},
    "repas": [
      { "nom": "Repas 1", "exemples": "Exemple concret adapté au régime ${data.regime}" },
      { "nom": "Repas 2", "exemples": "Exemple concret" },
      { "nom": "Repas 3", "exemples": "Exemple concret" },
      { "nom": "Repas 4", "exemples": "Exemple concret" }
    ],
    "conseils": ["Conseil adapté à l'objectif 1", "Conseil 2", "Conseil 3"]
  },
  "recuperation": ["Conseil récupération adapté au niveau/fréquence 1", "Conseil 2"],
  "progression_apres_4_semaines": "Explication précise de comment progresser après 4 semaines pour cet objectif"
}`;
}

// ── jsonToText (inchangé) ────────────────────────────────────────────
function jsonToText(data, lang) {
  const labels = {
    fr: { message:"Message personnalisé", programme:"Programme 4 semaines", semaines:"Semaines", phase:"Phase", seance:"Séance", series:"séries", reps:"reps", repos:"repos", nutrition:"Nutrition", calories:"Calories/jour", proteines:"Protéines", glucides:"Glucides", lipides:"Lipides", repas:"Repas", conseils:"Conseils", recuperation:"Récupération", progression:"Progression" },
    en: { message:"Personalized message", programme:"4-week program", semaines:"Weeks", phase:"Phase", seance:"Session", series:"sets", reps:"reps", repos:"rest", nutrition:"Nutrition", calories:"Calories/day", proteines:"Proteins", glucides:"Carbs", lipides:"Fats", repas:"Meals", conseils:"Tips", recuperation:"Recovery", progression:"Progression" },
    de: { message:"Persönliche Nachricht", programme:"4-Wochen-Programm", semaines:"Wochen", phase:"Phase", seance:"Einheit", series:"Sätze", reps:"Wdh", repos:"Pause", nutrition:"Ernährung", calories:"Kalorien/Tag", proteines:"Proteine", glucides:"Kohlenhydrate", lipides:"Fette", repas:"Mahlzeiten", conseils:"Tipps", recuperation:"Erholung", progression:"Progression" },
    es: { message:"Mensaje personalizado", programme:"Programa 4 semanas", semaines:"Semanas", phase:"Fase", seance:"Sesión", series:"series", reps:"reps", repos:"descanso", nutrition:"Nutrición", calories:"Calorías/día", proteines:"Proteínas", glucides:"Carbohidratos", lipides:"Grasas", repas:"Comidas", conseils:"Consejos", recuperation:"Recuperación", progression:"Progresión" },
  };
  const l = labels[lang] || labels.fr;
  let txt = "";
  txt += `1. ${l.message.toUpperCase()}\n${data.message_perso}\n\n`;
  txt += `2. ${l.programme.toUpperCase()}\n\n`;
  if (Array.isArray(data.seances)) {
    data.seances.forEach((s, i) => {
      txt += `${l.semaines} ${s.semaines} — ${s.phase}\n`;
      txt += `${l.seance} ${Math.ceil((i+1)/1)} : ${s.nom} (${s.jour_suggere} · ${s.duree_min} min)\n`;
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


// ── Validation des inputs côté serveur ───────────────────────────────
function validateGenerateInput(data) {
  const errors = [];
  const { prenom, poids, taille, age, genre, obj, niv, lieu, seances, duree, regime } = data;

  // Champs texte obligatoires
  if (!prenom || typeof prenom !== "string" || prenom.trim().length < 1)
    errors.push("Prénom manquant ou invalide");
  if (!obj || typeof obj !== "string" || obj.trim().length < 2)
    errors.push("Objectif manquant");
  if (!niv || typeof niv !== "string")
    errors.push("Niveau manquant");
  if (!lieu || typeof lieu !== "string")
    errors.push("Lieu d'entraînement manquant");

  // Poids : 30–350 kg
  const p = parseFloat(poids);
  if (!poids || isNaN(p) || p < 30 || p > 350)
    errors.push(`Poids invalide (reçu: ${poids}) — doit être entre 30 et 350 kg`);

  // Taille : 100–250 cm
  const t = parseFloat(taille);
  if (!taille || isNaN(t) || t < 100 || t > 250)
    errors.push(`Taille invalide (reçu: ${taille}) — doit être entre 100 et 250 cm`);

  // Âge : 12–100 ans
  const a = parseInt(age);
  if (!age || isNaN(a) || a < 12 || a > 100)
    errors.push(`Âge invalide (reçu: ${age}) — doit être entre 12 et 100 ans`);

  // Séances : 2–7 par semaine
  const s = parseInt(seances);
  if (!seances || isNaN(s) || s < 1 || s > 7)
    errors.push(`Nombre de séances invalide (reçu: ${seances}) — doit être entre 1 et 7`);

  // Genre attendu (non bloquant, valeur par défaut)
  const validGenres = ["homme", "femme", "male", "female", "man", "woman", "herr", "frau", "hombre", "mujer"];
  if (genre && !validGenres.some(g => genre.toLowerCase().includes(g.split(/[^a-z]/)[0]))) {
    // Non bloquant : juste normaliser
  }

  return errors;
}

// ── Handler principal ────────────────────────────────────────────────
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return Response.json({ error: "Trop de requêtes. Attends 1 minute avant de réessayer." }, { status: 429 });
  }

  const data = await req.json();

  // Validation côté serveur des inputs numériques et obligatoires
  const validationErrors = validateGenerateInput(data);
  if (validationErrors.length > 0) {
    console.warn("generate validation errors:", validationErrors);
    return Response.json(
      { error: "Données invalides : " + validationErrors[0] },
      { status: 400 }
    );
  }

  const lang = ["fr","en","de","es"].includes(data.lang) ? data.lang : "fr";

  // Pré-calculs côté serveur (précis, pas d'hallucinations possibles)
  const nutrition = calcNutrition(data);
  const jours     = getJoursSuggeres(data.seances, lang);
  const prompt    = buildPrompt(data, lang, nutrition, jours);

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
        max_tokens: 3500,
        messages: [{ role: "user", content: prompt }],
      }),
      timeoutPromise,
    ]);

    clearTimeout(timeoutId);
    const rawText = response.content.map(b => b.text || "").join("").trim();
    const cleaned = rawText.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();

    let programmeData;
    try {
      programmeData = JSON.parse(cleaned);
      // Forcer les valeurs nutritionnelles pré-calculées (pas d'hallucinations)
      if (programmeData.nutrition) {
        programmeData.nutrition.calories_jour = nutrition.calories;
        programmeData.nutrition.proteines_g   = nutrition.proteines_g;
        programmeData.nutrition.glucides_g    = nutrition.glucides_g;
        programmeData.nutrition.lipides_g     = nutrition.lipides_g;
      }
    } catch {
      return Response.json({ programme: rawText, programmeData: null });
    }

    const programme = jsonToText(programmeData, lang);
    return Response.json({ programme, programmeData });

  } catch (e) {
    clearTimeout(timeoutId);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

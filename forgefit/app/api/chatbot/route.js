import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "../rateLimit";
import { getAdminDb, verifyAuthToken } from "../firebase-admin";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function sanitizeMessage(raw) {
  if (typeof raw !== "string") return "";
  let msg = raw.slice(0, 500).trim();
  msg = msg.replace(/\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/gi, "");
  msg = msg.replace(/^(system|assistant|human|user)\s*:/gim, "");
  msg = msg.replace(/\n{4,}/g, "\n\n\n");
  return msg.trim();
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 20, 60_000)) {
    return Response.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  try {
    const { message, history = [], uid } = await req.json();
    const clean = sanitizeMessage(message);
    if (!clean) return Response.json({ error: "Message vide." }, { status: 400 });

    // Récupérer le programme du client si uid fourni et token valide
    let clientContext = "";
    if (uid) {
      try {
        const decoded = await verifyAuthToken(req);
        if (decoded?.uid === uid) {
          const db = getAdminDb();
          const snap = await db.collection("clients").doc(uid).get();
          if (snap.exists) {
            const data = snap.data();
            const pd = data.programmeData;
            const seances = pd?.seances?.slice(0, 3)
              .map(s => `- ${s.nom}: ${s.exercices?.slice(0,3).map(e => `${e.nom} ${e.series}x${e.reps}`).join(", ")}`)
              .join("\n") || "";
            const nutrition = pd?.nutrition
              ? `${pd.nutrition.calories_jour} kcal/j — P:${pd.nutrition.proteines_g}g G:${pd.nutrition.glucides_g}g L:${pd.nutrition.lipides_g}g`
              : "";
            clientContext = [
              data.nom ? `Nom: ${data.nom}` : "",
              data.plan ? `Plan: ${data.plan}` : "",
              pd?.objectif_principal ? `Objectif: ${pd.objectif_principal}` : "",
              pd?.niveau ? `Niveau: ${pd.niveau}` : "",
              pd?.seances_par_semaine ? `Séances/sem: ${pd.seances_par_semaine}` : "",
              nutrition ? `Nutrition: ${nutrition}` : "",
              seances ? `Premières séances:\n${seances}` : "",
              data.streakDays ? `Streak actuel: ${data.streakDays} jours` : "",
            ].filter(Boolean).join("\n");
          }
        }
      } catch {}
    }

    const systemPrompt = [
      "Tu es l assistant IA d APXFITNESS, coach de musculation et nutrition.",
      "Tu aides le client à comprendre son programme, répondre à ses questions sur l entraînement,",
      "la nutrition et la récupération. Réponds en français, de manière concise et motivante.",
      "Ne génère jamais de nouveau programme complet — pour ça, le client doit contacter son coach.",
      clientContext ? `\n--- Programme du client ---\n${clientContext}\n---` : "",
    ].filter(Boolean).join(" ");

    const messages = [
      ...history.slice(-6).map(m => ({
        role: m.role,
        content: sanitizeMessage(String(m.content)),
      })),
      { role: "user", content: clean },
    ];

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemPrompt,
      messages,
    });

    const reply = response.content[0]?.text || "Je ne suis pas sûr de comprendre. Peux-tu reformuler ?";
    return Response.json({ reply });
  } catch (e) {
    console.error("chatbot error:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

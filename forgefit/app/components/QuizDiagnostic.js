"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const QUIZ_STEPS = [
  {
    id: "objectif", question: "Quel est ton objectif principal ?",
    options: [
      { label: "Prise de masse", icon: "💪", value: "masse" },
      { label: "Perte de poids", icon: "🔥", value: "seche" },
      { label: "Remise en forme", icon: "⚡", value: "forme" },
      { label: "Performance", icon: "🏆", value: "perf" },
    ],
  },
  {
    id: "niveau", question: "Quel est ton niveau actuel ?",
    options: [
      { label: "Débutant", icon: "🌱", value: "debutant", sub: "< 6 mois" },
      { label: "Intermédiaire", icon: "📈", value: "inter", sub: "6 mois – 2 ans" },
      { label: "Avancé", icon: "🎯", value: "avance", sub: "> 2 ans" },
      { label: "Athlète", icon: "🏅", value: "athlete", sub: "Compétition" },
    ],
  },
  {
    id: "dispo", question: "Combien de jours peux-tu t'entraîner par semaine ?",
    options: [
      { label: "2 jours", icon: "📅", value: "2j" },
      { label: "3 – 4 jours", icon: "📆", value: "4j" },
      { label: "5 jours", icon: "🗓️", value: "5j" },
      { label: "6 – 7 jours", icon: "💯", value: "7j" },
    ],
  },
  {
    id: "equipement", question: "Quel équipement as-tu à disposition ?",
    options: [
      { label: "Salle complète", icon: "🏋️", value: "salle" },
      { label: "Haltères / banc", icon: "🏠", value: "home" },
      { label: "Poids du corps", icon: "🤸", value: "corpo" },
      { label: "Mixte", icon: "🔀", value: "mixte" },
    ],
  },
];

const QUIZ_RESULTS = {
  "masse-debutant":  { plan: "Starter", color: "#F0EDE8", desc: "Un programme progressif pour poser des bases solides et gagner tes premiers kilos de muscle." },
  "masse-inter":     { plan: "Forge",   color: "#E8B000", desc: "Tu es prêt pour un programme intermédiaire avec périodisation et surcharge progressive." },
  "masse-avance":    { plan: "Elite",   color: "#E8B000", desc: "Programme avancé, nutrition précise, récupération optimisée — le niveau Elite te correspond." },
  "masse-athlete":   { plan: "Elite",   color: "#E8B000", desc: "Protocole haute intensité avec suivi coach hebdomadaire pour franchir tes plafonds." },
  "seche-debutant":  { plan: "Starter", color: "#F0EDE8", desc: "Déficit calorique progressif + cardio intégré pour perdre du gras sans perdre le muscle." },
  "seche-inter":     { plan: "Forge",   color: "#E8B000", desc: "Nutrition cyclée, cardio HIIT et entraînement hybride pour une transformation visible." },
  "seche-avance":    { plan: "Elite",   color: "#E8B000", desc: "Protocole shred avancé avec macros calculées à la précision et suivi hebdomadaire." },
  "seche-athlete":   { plan: "Elite",   color: "#E8B000", desc: "Peak week, water manipulation, cardio stratégique — on est sur la même longueur d'onde." },
  "forme-debutant":  { plan: "Starter", color: "#F0EDE8", desc: "Programme équilibré 3 séances/semaine pour retrouver énergie et bien-être durable." },
  "forme-inter":     { plan: "Forge",   color: "#E8B000", desc: "Remise en forme complète avec force, cardio et nutrition — visible en 4 semaines." },
  "forme-avance":    { plan: "Forge",   color: "#E8B000", desc: "Maintien et optimisation physique avec objectifs hebdomadaires ciblés." },
  "forme-athlete":   { plan: "Elite",   color: "#E8B000", desc: "Programme de maintien haute performance avec gestion de la récupération." },
  "perf-debutant":   { plan: "Starter", color: "#F0EDE8", desc: "Construire les fondations athlétiques avant de viser la performance." },
  "perf-inter":      { plan: "Forge",   color: "#E8B000", desc: "Force, explosivité, endurance — programme multi-objectif avec cycles de 4 semaines." },
  "perf-avance":     { plan: "Elite",   color: "#E8B000", desc: "Périodisation avancée, test de force mensuel, suivi coach dédié." },
  "perf-athlete":    { plan: "Elite",   color: "#E8B000", desc: "Préparation physique de haut niveau avec protocoles de peak performance." },
};

function getResult(answers) {
  const key = `${answers.objectif}-${answers.niveau}`;
  return QUIZ_RESULTS[key] || { plan: "Forge", color: "#E8B000", desc: "Un programme sur mesure adapté à ton profil et tes objectifs." };
}

export function QuizDiagnostic({ T }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState(null);

  const current = QUIZ_STEPS[step];
  const result = done ? getResult(answers) : null;

  const choose = (value) => {
    setSelected(value);
    const next = { ...answers, [current.id]: value };
    setTimeout(() => {
      setAnswers(next);
      setSelected(null);
      if (step < QUIZ_STEPS.length - 1) {
        setStep(s => s + 1);
      } else {
        setDone(true);
      }
    }, 260);
  };

  const reset = () => { setStep(0); setAnswers({}); setDone(false); setSelected(null); };

  const planParam = result?.plan?.toLowerCase();

  return (
    <section className="reveal" style={{ padding: "5rem 3rem", borderBottom: `0.5px solid ${T.border}`, background: T.bg }}>
      <style>{`
        .quiz-opt{background:transparent;border:0.5px solid #1E1E1E;cursor:pointer;transition:all 0.2s;padding:14px 16px;display:flex;align-items:center;gap:12px;width:100%;text-align:left;border-radius:4px}
        .quiz-opt:hover{border-color:rgba(232,176,0,0.5);background:rgba(232,176,0,0.04)}
        .quiz-opt.selected{border-color:#E8B000;background:rgba(232,176,0,0.1)}
        @keyframes quizFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .quiz-anim{animation:quizFade 0.35s ease both}
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: 10, letterSpacing: "4px", textTransform: "uppercase", color: "#E8B000", marginBottom: "0.75rem" }}>— Diagnostic gratuit</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 600, lineHeight: 1.15, color: T.fg }}>
            Quel programme<br /><em style={{ fontStyle: "italic", color: T.muted }}>te correspond vraiment ?</em>
          </div>
        </div>

        {!done ? (
          <div key={step} className="quiz-anim">
            <div style={{ display: "flex", gap: 4, marginBottom: "2rem" }}>
              {QUIZ_STEPS.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: i < step ? "#E8B000" : i === step ? "rgba(232,176,0,0.4)" : "#1A1A1A",
                  transition: "background 0.3s",
                }} />
              ))}
            </div>

            <div style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: "0.75rem" }}>
              Question {step + 1}/{QUIZ_STEPS.length}
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: T.fg, marginBottom: "1.5rem", lineHeight: 1.4 }}>
              {current.question}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {current.options.map(opt => (
                <button
                  key={opt.value}
                  className={`quiz-opt${selected === opt.value ? " selected" : ""}`}
                  onClick={() => choose(opt.value)}
                >
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: T.fg }}>{opt.label}</div>
                    {opt.sub && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{opt.sub}</div>}
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 14, color: "#333" }}>›</div>
                </button>
              ))}
            </div>

            {step > 0 && (
              <button onClick={() => { setStep(s => s - 1); setSelected(null); }}
                style={{ background: "transparent", border: "none", color: "#444", fontFamily: "'Syne',sans-serif", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", cursor: "pointer", marginTop: "1.25rem", display: "block" }}>
                ← Retour
              </button>
            )}
          </div>
        ) : (
          <div key="result" className="quiz-anim">
            <div style={{
              background: "rgba(232,176,0,0.05)", border: "0.5px solid rgba(232,176,0,0.3)",
              borderRadius: 4, padding: "2rem", marginBottom: "1.5rem", textAlign: "center",
            }}>
              <div style={{ fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#E8B000", marginBottom: "0.75rem" }}>— Ton profil</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(26px,4vw,38px)", fontWeight: 600, color: T.fg, marginBottom: "1rem", lineHeight: 1.2 }}>
                Plan recommandé :<br />
                <span style={{ color: "#E8B000" }}>{result.plan}</span>
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: T.muted, lineHeight: 1.75, maxWidth: 420, margin: "0 auto" }}>
                {result.desc}
              </p>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1.5rem", justifyContent: "center" }}>
              {QUIZ_STEPS.map(s => {
                const opt = s.options.find(o => o.value === answers[s.id]);
                return opt ? (
                  <div key={s.id} style={{
                    background: "#111", border: "0.5px solid #1A1A1A",
                    borderRadius: 20, padding: "4px 12px",
                    fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <span>{opt.icon}</span> {opt.label}
                  </div>
                ) : null;
              })}
            </div>

            <button
              onClick={() => router.push(`/bilan?plan=${planParam}`)}
              style={{
                width: "100%", background: "linear-gradient(135deg,#E8B000,#C49200)",
                border: "none", color: "#0A0A0A", padding: "15px 28px",
                fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700,
                letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer",
                borderRadius: 2, marginBottom: "0.75rem",
              }}
            >
              Démarrer mon bilan gratuit →
            </button>
            <button onClick={reset} style={{ background: "transparent", border: "none", color: "#444", fontFamily: "'Syne',sans-serif", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", cursor: "pointer", width: "100%", textDecoration: "underline" }}>
              Recommencer le quiz
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./useLang";
import { LangSelector } from "./LangSelector";
import dynamic from "next/dynamic";
import Image from "next/image";
const VideoGallery = dynamic(() => import("./components/VideoGallery"), { ssr: false });

const PLAN_NAMES = ["Starter","Forge","Elite"];
const PLAN_PRICES = [18.99,38.99,68.99];

const DARK = { bg:'#0A0A0A', bg2:'#0D0D0D', bg3:'#080808', card:'#111', card2:'#181818', fg:'#F0EDE8', muted:'#555', border:'#242424', border2:'#1A1A1A', gap:'#242424' };
const LIGHT = { bg:'#F5F1EB', bg2:'#EDE9E1', bg3:'#E8E3DA', card:'#FFFFFF', card2:'#F7F3EC', fg:'#0A0A0A', muted:'#888', border:'#D8D2C8', border2:'#E2DDD5', gap:'#C8C3BA' };

// ── Calculateur métabolique inline ──────────────────────────────────────────
function calcBMR(poids, taille, age, genre) {
  if (genre === "femme") return 447.593 + (9.247*poids) + (3.098*taille) - (4.330*age);
  return 88.362 + (13.397*poids) + (4.799*taille) - (5.677*age);
}
const CALC_ACTIVITY = [
  { label: "Sédentaire", mult: 1.2 },
  { label: "Légèrement actif (1-2/sem)", mult: 1.375 },
  { label: "Modérément actif (3-4/sem)", mult: 1.55 },
  { label: "Très actif (5-6/sem)", mult: 1.65 },
  { label: "Extrêmement actif", mult: 1.725 },
];
const CALC_GOALS = [
  { id:"perte",  label:"Perte de gras",  delta:-400 },
  { id:"recomp", label:"Remise en forme", delta:0 },
  { id:"masse",  label:"Prise de masse", delta:250 },
];

// ── Quiz diagnostic ─────────────────────────────────────────────────────────
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

function QuizDiagnostic({ T, router }) {
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
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: 10, letterSpacing: "4px", textTransform: "uppercase", color: "#E8B000", marginBottom: "0.75rem" }}>— Diagnostic gratuit</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 600, lineHeight: 1.15, color: T.fg }}>
            Quel programme<br /><em style={{ fontStyle: "italic", color: T.muted }}>te correspond vraiment ?</em>
          </div>
        </div>

        {!done ? (
          <div key={step} className="quiz-anim">
            {/* Progress */}
            <div style={{ display: "flex", gap: 4, marginBottom: "2rem" }}>
              {QUIZ_STEPS.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: i < step ? "#E8B000" : i === step ? "rgba(232,176,0,0.4)" : "#1A1A1A",
                  transition: "background 0.3s",
                }} />
              ))}
            </div>

            {/* Question */}
            <div style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: "0.75rem" }}>
              Question {step + 1}/{QUIZ_STEPS.length}
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: T.fg, marginBottom: "1.5rem", lineHeight: 1.4 }}>
              {current.question}
            </div>

            {/* Options */}
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
            {/* Résultat */}
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

            {/* Réponses résumées */}
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

function InlineCalculateur({ T, theme, router }) {
  // Scroll reveal local
  useEffect(() => {
    const els = document.querySelectorAll('.calc-reveal,.calc-reveal-l,.calc-reveal-r,.calc-reveal-scale');
    const obs = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('calc-visible'); obs.unobserve(e.target); }
    }), { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const [genre, setGenre] = useState("homme");
  const [activite, setActivite] = useState(2);
  const [objectif, setObjectif] = useState("recomp");
  const [poids, setPoids] = useState(75);
  const [taille, setTaille] = useState(175);
  const [age, setAge] = useState(25);
  const [result, setResult] = useState(null);

  const calculate = () => {
    const bmr = calcBMR(poids, taille, age, genre);
    const tdee = Math.round(bmr * CALC_ACTIVITY[activite].mult);
    const goal = CALC_GOALS.find(g => g.id === objectif);
    const calories = Math.round((tdee + goal.delta) / 50) * 50;
    const imc = poids / ((taille/100)**2);
    let proteines, lipides;
    if (objectif==="perte")  { proteines=Math.round(poids*2.2); lipides=Math.round(poids*0.8); }
    else if (objectif==="masse") { proteines=Math.round(poids*2.0); lipides=Math.round(poids*1.0); }
    else { proteines=Math.round(poids*1.8); lipides=Math.round(poids*0.9); }
    const glucides = Math.round(Math.max(0, calories - proteines*4 - lipides*9)/4);
    setResult({ calories, imc: imc.toFixed(1), proteines, glucides, lipides, tdee: Math.round(tdee) });
  };

  const imcColor = result ? (result.imc<18.5?"#88A0E0":result.imc<25?"#7AE07A":result.imc<30?"#F5C832":"#E07070") : "#E8B000";
  const imcLabel = result ? (result.imc<18.5?"Sous-poids":result.imc<25?"Poids normal":result.imc<30?"Surpoids":"Obésité") : "";

  return (
    <div style={{padding:"5rem clamp(2rem,6vw,5rem)", maxWidth:1400, margin:"0 auto"}}>
      {/* Header */}
      <div className="calc-reveal" style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:"1.5rem",marginBottom:"3rem"}}>
        <div>
          <div style={{fontSize:10,letterSpacing:"5px",textTransform:"uppercase",color:"#E8B000",marginBottom:"1rem"}}>— Outil gratuit</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(32px,5vw,72px)",lineHeight:0.88,textTransform:"uppercase",letterSpacing:"-0.02em",color:T.fg}}>
            CALCULATEUR<br/><span style={{color:"#E8B000"}}>MÉTABOLIQUE.</span>
          </h2>
        </div>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:T.muted,maxWidth:300,lineHeight:1.9}}>
          Découvre tes besoins caloriques réels et tes macros optimales en 30 secondes.
        </p>
      </div>

      {/* 3-col inputs */}
      <div className="calc-inputs-grid calc-reveal-scale" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:1,background:T.border}}>

        {/* Bloc 1 — Profil */}
        <div className="calc-reveal-l" style={{background:T.bg,padding:"2rem",animationDelay:"0.1s"}}>
          <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#E8B000",marginBottom:"1.5rem"}}>01 — Profil</div>
          <div style={{marginBottom:"1.5rem"}}>
            <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:T.muted,marginBottom:8}}>Genre</div>
            <div style={{display:"flex",gap:6}}>
              {[["homme","Homme"],["femme","Femme"]].map(([v,l])=>(
                <button key={v} onClick={()=>setGenre(v)} style={{
                  flex:1,padding:"10px 6px",
                  background:genre===v?"rgba(232,176,0,0.12)":T.card,
                  border:`0.5px solid ${genre===v?"#E8B000":T.border}`,
                  color:genre===v?"#E8B000":T.muted,
                  fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"1px",cursor:"pointer",transition:"all 0.2s",
                }}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:T.muted,marginBottom:8}}>Objectif</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {CALC_GOALS.map(g=>(
                <button key={g.id} onClick={()=>setObjectif(g.id)} style={{
                  padding:"11px 12px",textAlign:"left",
                  background:objectif===g.id?"rgba(232,176,0,0.1)":T.card,
                  border:`0.5px solid ${objectif===g.id?"#E8B000":T.border}`,
                  color:objectif===g.id?"#E8B000":T.muted,
                  fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.5px",
                  cursor:"pointer",transition:"all 0.2s",
                  display:"flex",justifyContent:"space-between",alignItems:"center",
                }}>
                  {g.label}
                  {objectif===g.id&&<span style={{fontSize:9,color:"#E8B000"}}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bloc 2 — Mesures */}
        <div className="calc-reveal" style={{background:T.bg2,padding:"2rem",animationDelay:"0.2s"}}>
          <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#E8B000",marginBottom:"1.5rem"}}>02 — Mesures</div>
          {[
            {label:"Poids",  value:poids,  setValue:setPoids,  min:40, max:150, unit:"kg", step:0.5},
            {label:"Taille", value:taille, setValue:setTaille, min:140, max:220, unit:"cm"},
            {label:"Âge",    value:age,    setValue:setAge,    min:14, max:80,  unit:"ans"},
          ].map(({label,value,setValue,min,max,unit,step=1})=>(
            <div key={label} style={{marginBottom:"1.5rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                <span style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:T.muted}}>{label}</span>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:24,color:"#E8B000",lineHeight:1}}>
                  {value}<span style={{fontSize:10,color:T.muted,fontWeight:400,marginLeft:3}}>{unit}</span>
                </span>
              </div>
              <input type="range" min={min} max={max} step={step} value={value}
                onChange={e=>setValue(parseFloat(e.target.value))}
                style={{width:"100%",accentColor:"#E8B000",cursor:"pointer",margin:"4px 0"}}/>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:9,color:"#333"}}>{min}</span>
                <span style={{fontSize:9,color:"#333"}}>{max}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bloc 3 — Activité */}
        <div className="calc-reveal-r" style={{background:T.bg,padding:"2rem",animationDelay:"0.3s"}}>
          <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#E8B000",marginBottom:"1.5rem"}}>03 — Activité</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {CALC_ACTIVITY.map((a,i)=>(
              <button key={i} onClick={()=>setActivite(i)} style={{
                padding:"12px 14px",textAlign:"left",
                background:activite===i?"rgba(232,176,0,0.1)":T.card,
                border:`0.5px solid ${activite===i?"#E8B000":T.border}`,
                color:activite===i?"#E8B000":T.muted,
                fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"0.3px",
                cursor:"pointer",transition:"all 0.2s",
                display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,
              }}>
                <span>{a.label}</span>
                <span style={{fontSize:10,color:activite===i?"rgba(232,176,0,0.6)":"#333",flexShrink:0}}>×{a.mult}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bouton calcul */}
      <button onClick={calculate} className="calc-reveal" style={{
        width:"100%",padding:"18px",
        background:"linear-gradient(135deg,#E8B000,#C49200)",
        border:"none",color:"#0A0A0A",
        fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:800,
        letterSpacing:"4px",textTransform:"uppercase",cursor:"pointer",
        boxShadow:"0 4px 24px rgba(232,176,0,0.2)",transition:"all 0.3s",
        marginTop:1,
      }}>
        Calculer mes besoins →
      </button>

      {/* Résultats */}
      {result && (
        <div className="calc-reveal-scale" style={{marginTop:1,animation:"fadeUp 0.5s ease both"}}>
          {/* Band résultats */}
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:1,background:T.border}} className="calc-results-grid">
            {/* Calories */}
            <div style={{background:T.card,padding:"2rem",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#E8B000,#F5C832)"}}/>
              <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#E8B000",marginBottom:"0.75rem"}}>Calories / jour</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(48px,5vw,80px)",color:"#E8B000",lineHeight:0.9,marginBottom:8}}>
                {result.calories.toLocaleString()}
              </div>
              <div style={{fontSize:11,color:T.muted}}>TDEE {result.tdee.toLocaleString()} kcal</div>
              <div style={{fontSize:10,color:"rgba(232,176,0,0.7)",marginTop:4}}>{CALC_GOALS.find(g=>g.id===objectif)?.label}</div>
            </div>
            {/* Macros + IMC */}
            {[
              {label:"Protéines",val:result.proteines,sub:"grammes",color:"#7AE07A"},
              {label:"Glucides", val:result.glucides, sub:"grammes",color:"#E8B000"},
              {label:"Lipides",  val:result.lipides,  sub:"grammes",color:"#5DCAA5"},
              {label:"IMC",      val:result.imc,      sub:imcLabel, color:imcColor},
            ].map((m,i)=>(
              <div key={i} style={{background:T.bg2,padding:"2rem",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:T.muted,marginBottom:"0.5rem"}}>{m.label}</div>
                <div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:36,color:m.color,lineHeight:0.9}}>{m.val}</div>
                  <div style={{fontSize:9,color:m.label==="IMC"?m.color:T.muted,marginTop:6}}>{m.sub}</div>
                </div>
              </div>
            ))}
          </div>
          {/* CTA row */}
          <div style={{background:T.bg2,borderTop:`0.5px solid rgba(232,176,0,0.15)`,padding:"2rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"1.5rem"}}>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:T.fg,lineHeight:1.5}}>
                Ces chiffres sont un point de départ — un programme sur mesure va bien plus loin.
              </div>
              <div style={{fontSize:11,color:T.muted,marginTop:4}}>Historique, équipement, contraintes, progressions sur 12 semaines.</div>
            </div>
            <button onClick={()=>router.push("/bilan")} style={{
              background:"linear-gradient(135deg,#E8B000,#C49200)",border:"none",color:"#0A0A0A",
              padding:"14px 32px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:800,
              letterSpacing:"3px",textTransform:"uppercase",cursor:"pointer",flexShrink:0,
              boxShadow:"0 4px 16px rgba(232,176,0,0.2)",
            }}>
              Obtenir mon programme →
            </button>
          </div>
        </div>
      )}

      <style>{`
        .calc-inputs-grid{grid-template-columns:1fr 1fr 1fr !important}
        .calc-results-grid{grid-template-columns:2fr 1fr 1fr 1fr 1fr !important}
        @media(max-width:900px){
          .calc-inputs-grid{grid-template-columns:1fr !important}
          .calc-results-grid{grid-template-columns:1fr 1fr !important}
        }
        @keyframes calcFadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes calcFadeLeft{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes calcFadeRight{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes calcScaleIn{from{opacity:0;transform:scaleX(0.92) translateY(12px)}to{opacity:1;transform:scaleX(1) translateY(0)}}
        .calc-reveal{opacity:0;transform:translateY(28px)}
        .calc-reveal.calc-visible{animation:calcFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both}
        .calc-reveal-l{opacity:0;transform:translateX(-24px)}
        .calc-reveal-l.calc-visible{animation:calcFadeLeft 0.6s cubic-bezier(0.16,1,0.3,1) both}
        .calc-reveal-r{opacity:0;transform:translateX(24px)}
        .calc-reveal-r.calc-visible{animation:calcFadeRight 0.6s cubic-bezier(0.16,1,0.3,1) both}
        .calc-reveal-scale{opacity:0;transform:scaleX(0.92) translateY(12px)}
        .calc-reveal-scale.calc-visible{animation:calcScaleIn 0.7s cubic-bezier(0.16,1,0.3,1) both}
      `}</style>
    </div>
  );
}

export default function Home() {
  // ── Theme ──────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('apx_theme') || 'dark'; } catch { return 'dark'; } });
  const T = theme === 'dark' ? DARK : LIGHT;
  const toggleTheme = () => setTheme(t => { const n = t==='dark'?'light':'dark'; try{localStorage.setItem('apx_theme',n);}catch{} return n; });

  // ── Custom cursor + trail ──────────────────────────────────────────────
  const [cur, setCur] = useState({x:-100,y:-100});
  const [hovering, setHovering] = useState(false);
  const hasPointer = useRef(false);
  const trailRef = useRef([]);
  useEffect(() => {
    hasPointer.current = window.matchMedia('(pointer:fine)').matches;
    if (!hasPointer.current) return;
    const TRAIL_LEN = 18;
    const trails = Array.from({length:TRAIL_LEN}, (_,i) => {
      const el = document.createElement('div');
      el.className = 'cur-trail';
      const size = Math.max(2, 8 - i*0.35);
      el.style.cssText = `width:${size}px;height:${size}px;opacity:${(1-i/TRAIL_LEN)*0.55};z-index:${9997-i}`;
      document.body.appendChild(el);
      return {el, x:-100, y:-100};
    });
    trailRef.current = trails;
    let mx=-100, my=-100, animId;
    const move = e => { mx=e.clientX; my=e.clientY; setCur({x:mx, y:my}); };
    const over = e => { if(e.target.closest('button,a,[role=button],.plan-card,.nav-link')) setHovering(true); };
    const out  = () => setHovering(false);
    window.addEventListener('mousemove', move);
    document.addEventListener('mouseover', over);
    document.addEventListener('mouseout', out);
    const animTrail = () => {
      let px=mx, py=my;
      trails.forEach((t,i) => {
        t.x += (px-t.x)*(0.28-i*0.008);
        t.y += (py-t.y)*(0.28-i*0.008);
        t.el.style.left = t.x+'px';
        t.el.style.top  = t.y+'px';
        px=t.x; py=t.y;
      });
      animId = requestAnimationFrame(animTrail);
    };
    animTrail();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove',move);
      document.removeEventListener('mouseover',over);
      document.removeEventListener('mouseout',out);
      trails.forEach(t => t.el.remove());
    };
  }, []);

  // ── Scroll reveal ──────────────────────────────────────────────────────
  useEffect(() => {
    const els = document.querySelectorAll('.reveal,.reveal-left,.reveal-right');
    const obs = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); } }), {threshold:0.12});
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // ── Pop-up capture email ───────────────────────────────────────────────
  const [showPopup, setShowPopup] = useState(false);
  const [popupEmail, setPopupEmail] = useState("");
  const [popupDone, setPopupDone] = useState(false);
  const [popupLoading, setPopupLoading] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem("apx_popup_done")) return; } catch {}
    const t = setTimeout(() => setShowPopup(true), 35000);
    return () => clearTimeout(t);
  }, []);
  // ── Exit-intent popup ─────────────────────────────────────────────────
  const [showExitPopup, setShowExitPopup] = useState(false);
  useEffect(() => {
    const handler = (e) => {
      if (e.clientY < 20 && !showPopup) {
        try { if (localStorage.getItem("apx_exit_popup_done")) return; } catch {}
        setShowExitPopup(true);
        try { localStorage.setItem("apx_exit_popup_done","1"); } catch {}
      }
    };
    document.addEventListener("mouseleave", handler);
    return () => document.removeEventListener("mouseleave", handler);
  }, [showPopup]);
  const closeExitPopup = () => setShowExitPopup(false);

  const handlePopupSubmit = async () => {
    if (!popupEmail.trim()) return;
    setPopupLoading(true);
    try {
      await fetch("/api/notify-coach", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({nom:"Prospect",email:popupEmail,message:`Nouveau prospect inscrit via pop-up : ${popupEmail}`}) });
      try { localStorage.setItem("apx_popup_done","1"); } catch {}
      setPopupDone(true);
      setTimeout(() => setShowPopup(false), 2500);
    } catch {}
    setPopupLoading(false);
  };

  const router = useRouter();

  // ── Canvas particules ──────────────────────────────────────────────────
  const canvasRef = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const par = cv.parentElement; let animId;
    const resize = () => { cv.width=par.offsetWidth; cv.height=par.offsetHeight; };
    resize();
    const ctx = cv.getContext("2d");
    const N = 140;
    const pts = Array.from({length:N}, ()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,r:Math.random()*2.4+0.5,a:Math.random()*.5+0.14,ph:Math.random()*Math.PI*2}));
    const draw = () => {
      ctx.clearRect(0,0,cv.width,cv.height);
      for(let i=0;i<N;i++){
        const p=pts[i]; p.ph+=.025;
        const sp=Math.hypot(p.vx,p.vy); if(sp>.48){p.vx=p.vx/sp*.48;p.vy=p.vy/sp*.48;}
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=cv.width; if(p.x>cv.width)p.x=0;
        if(p.y<0)p.y=cv.height; if(p.y>cv.height)p.y=0;
        for(let j=i+1;j<N;j++){const dx2=p.x-pts[j].x,dy2=p.y-pts[j].y,d2=Math.hypot(dx2,dy2);if(d2<130){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(232,176,0,${.2*(1-d2/130)})`;ctx.lineWidth=.55;ctx.stroke();}}
        const pr=p.r*(1+.15*Math.sin(p.ph));
        ctx.beginPath();ctx.arc(p.x,p.y,pr,0,6.28);ctx.fillStyle=`rgba(232,176,0,${p.a*(.8+.2*Math.sin(p.ph))})`;ctx.fill();
      }
      animId=requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize",resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize",resize); };
  }, []);

  const { lang, setLang, t, LANGS } = useLang();

  return (
    <>
    {/* ── Custom cursor ── */}
    <div className={`cur-dot${hovering?' hovering':''}`} style={{transform:`translate(${cur.x-4}px,${cur.y-4}px)`}}/>
    <div className={`cur-ring${hovering?' hovering':''}`} style={{transform:`translate(${cur.x-18}px,${cur.y-18}px)`}}/>

    {/* ── Exit-intent popup ── */}
    {showExitPopup && (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
        <div style={{background:"#0D0D0D",border:"0.5px solid rgba(232,176,0,0.35)",borderRadius:4,padding:"2.5rem 2rem",width:"100%",maxWidth:440,position:"relative",fontFamily:"'Syne',sans-serif",textAlign:"center"}}>
          <button onClick={closeExitPopup} style={{position:"absolute",top:12,right:14,background:"transparent",border:"none",color:"#444",fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
          <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#E8B000",marginBottom:"1rem"}}>— Attends une seconde</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(24px,4vw,32px)",fontWeight:600,lineHeight:1.2,color:"#F0EDE8",marginBottom:"0.75rem"}}>
            Tu pars déjà ?
          </div>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#777",lineHeight:1.7,marginBottom:"1.75rem"}}>
            Commence ton <strong style={{color:"#F0EDE8"}}>bilan gratuit</strong> maintenant — ton programme personnalisé est livré en <strong style={{color:"#E8B000"}}>moins de 48h</strong>.
          </p>
          <button
            onClick={()=>{closeExitPopup();router.push("/bilan");}}
            style={{width:"100%",background:"linear-gradient(135deg,#E8B000,#C49200)",border:"none",color:"#0A0A0A",padding:"14px 28px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",cursor:"pointer",borderRadius:2,marginBottom:"0.75rem"}}
          >
            Démarrer mon bilan gratuit →
          </button>
          <button onClick={closeExitPopup} style={{background:"transparent",border:"none",color:"#444",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"1px",cursor:"pointer",textDecoration:"underline"}}>
            Non merci, je pars sans programme
          </button>
        </div>
      </div>
    )}

    {/* ── Pop-up ── */}
    {showPopup && (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
        <div style={{background:T.card,border:`0.5px solid ${T.border}`,borderRadius:4,padding:"2rem",width:"100%",maxWidth:420,position:"relative",fontFamily:"'Syne',sans-serif"}}>
          <button onClick={()=>{setShowPopup(false);try{localStorage.setItem("apx_popup_done","1")}catch{}}} style={{position:"absolute",top:12,right:12,background:"transparent",border:"none",color:"#444",fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
          {popupDone ? (
            <div style={{textAlign:"center",padding:"1rem 0"}}>
              <div style={{fontSize:32,marginBottom:12}}>🎉</div>
              <div style={{fontSize:14,fontWeight:700,color:"#7AE07A",marginBottom:8}}>Guide envoyé !</div>
              <div style={{fontSize:12,color:"#555"}}>Vérifie ta boîte mail dans quelques instants.</div>
            </div>
          ) : (
            <>
              <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#E8B000",marginBottom:"0.75rem"}}>— Cadeau gratuit</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,lineHeight:1.2,marginBottom:"0.75rem",color:T.fg}}>
                Les 5 erreurs qui empêchent<br/><em style={{fontStyle:"italic",color:"#E8B000"}}>tes résultats</em>
              </div>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:T.muted,lineHeight:1.7,marginBottom:"1.5rem"}}>
                Reçois notre guide gratuit par email et évite les pièges que font 90% des débutants.
              </p>
              <div style={{display:"flex",gap:1}}>
                <input type="email" value={popupEmail} onChange={e=>setPopupEmail(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handlePopupSubmit();}} placeholder="ton@email.com"
                  style={{flex:1,background:T.bg,border:`0.5px solid ${T.border}`,color:T.fg,fontFamily:"'Syne',sans-serif",fontSize:13,padding:"11px 14px",outline:"none",borderRadius:0}}/>
                <button onClick={handlePopupSubmit} disabled={popupLoading||!popupEmail.trim()}
                  style={{background:"linear-gradient(135deg,#E8B000,#C49200)",border:"none",color:"#0A0A0A",padding:"0 18px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:popupEmail.trim()?"pointer":"not-allowed",flexShrink:0}}>
                  {popupLoading?"...":"Envoyer"}
                </button>
              </div>
              <p style={{fontSize:11,color:"#666",marginTop:10,textAlign:"center"}}>Pas de spam. Tu te désinscris quand tu veux.</p>
            </>
          )}
        </div>
      </div>
    )}

    <div style={{background:T.bg,color:T.fg,minHeight:"100vh",fontFamily:"'Syne',sans-serif"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lineGrow{from{width:0}to{width:100%}}
        @keyframes glitch{0%,90%,100%{transform:translate(0)}92%{transform:translate(-2px,1px)}94%{transform:translate(2px,-1px)}}
        @keyframes typing{from{width:0}to{width:3.8em}}
        @keyframes borderPulse{0%,100%{border-color:#242424}50%{border-color:#E8B000}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes scanDown{0%{opacity:0;transform:translateY(-100%)}6%{opacity:.8}93%{opacity:.8}100%{opacity:0;transform:translateY(2000%)}}
        @keyframes shimmerSlide{0%{left:-100%}100%{left:200%}}
        @keyframes countPop{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes particleFloat{0%{transform:translateY(0) translateX(0);opacity:0.6}50%{transform:translateY(-20px) translateX(10px);opacity:1}100%{transform:translateY(0) translateX(0);opacity:0.6}}
        .scan-line-el{position:absolute;left:0;right:0;height:1px;background:linear-gradient(to right,transparent,rgba(232,176,0,.6),transparent);animation:scanDown 4s 1.2s ease both;pointer-events:none;z-index:10}
        .plan-card-shimmer{position:absolute;top:0;left:-100%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(232,176,0,.07),transparent);pointer-events:none;transition:left .8s ease}
        .plan-card:hover .plan-card-shimmer{left:200%}
        .plan-card{overflow:hidden}
        .plan-card:hover .plan-price{animation:countPop .35s ease}
        .step-box:hover{transform:translateY(-3px);transition:transform .3s,background .2s}
        .plan-feat-item:hover{padding-left:6px;transition:all .2s}
        .a1{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both}
        .a2{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.25s both}
        .a3{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s both}
        .a4{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.55s both}
        .a5{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.7s both}
        .a6{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.9s both}
        .gold-text{background:linear-gradient(90deg,#E8B000,#F5C832,#F5C832,#E8B000);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.5s linear infinite}
        .nav-link{cursor:pointer;transition:color 0.3s;position:relative;padding-bottom:2px}
        .nav-link::after{content:'';position:absolute;bottom:0;left:0;width:0;height:1px;background:#E8B000;transition:width 0.3s}
        .nav-link:hover{color:#F5C832 !important}
        .nav-link:hover::after{width:100%}
        .btn-primary{transition:all 0.3s;position:relative;overflow:hidden}
        .btn-primary::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,0.12);transform:translateX(-100%) skew(-15deg);transition:transform 0.4s}
        .btn-primary:hover::after{transform:translateX(120%) skew(-15deg)}
        .btn-primary:hover{transform:translateY(-3px) !important;box-shadow:0 12px 30px rgba(232,176,0,0.35) !important}
        .btn-ghost:hover{color:#F5C832 !important}
        .stat-box{transition:background 0.3s;cursor:default;position:relative}
        .stat-box::before{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:#E8B000;transform:scaleX(0);transform-origin:left;transition:transform 0.4s}
        .stat-box:hover::before{transform:scaleX(1)}
        .stat-num{transition:transform 0.4s}
        .stat-box:hover .stat-num{transform:scale(1.06)}
        .step-box{transition:background 0.3s,transform 0.3s;cursor:default;position:relative;overflow:hidden}
        .step-box::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:#E8B000;transform:scaleX(0);transition:transform 0.4s}
        .step-box:hover::after{transform:scaleX(1)}
        .step-box:hover .step-title{color:#F5C832 !important}
        .step-box:hover .step-num{opacity:0.15 !important}
        .plan-card{transition:all 0.4s cubic-bezier(0.2,0,0,1);cursor:pointer;position:relative;overflow:hidden}
        .plan-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#E8B000,transparent);transform:scaleX(0);transition:transform 0.4s}
        .plan-card:hover{transform:translateY(-8px) !important;z-index:2}
        .plan-card:hover::before{transform:scaleX(1)}
        .plan-card:hover .plan-name{color:#F5C832 !important}
        .plan-card:hover .plan-price{transform:scale(1.05)}
        .plan-btn{transition:all 0.3s;position:relative;overflow:hidden}
        .plan-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#E8B000,#C49200);transform:translateY(100%);transition:transform 0.3s}
        .plan-btn-text{position:relative;z-index:1;transition:color 0.3s}
        .plan-card:hover .plan-btn::before{transform:translateY(0)}
        .plan-card:hover .plan-btn-text{color:#0A0A0A !important}
        .cta-btn{transition:all 0.3s;animation:pulse 2s ease infinite}
        .cta-btn:hover{transform:scale(1.06) !important}
        .footer-link{cursor:pointer;transition:color 0.2s}
        .footer-link:hover{color:#F5C832 !important}
        .nav-btn{position:relative;overflow:hidden;transition:transform 0.2s}
        .nav-btn::before{content:'';position:absolute;inset:0;background:rgba(255,255,255,0.15);transform:translateX(-100%) skew(-15deg);transition:transform 0.4s}
        .nav-btn:hover::before{transform:translateX(120%) skew(-15deg)}
        .nav-btn:hover{transform:translateY(-1px)}
        .lang-btn{cursor:pointer;transition:all 0.2s;user-select:none}
        .lang-btn:hover{color:#F5C832 !important;border-color:#E8B000 !important}
        .lang-option{cursor:pointer;transition:background 0.15s;padding:8px 16px;font-size:12px;letter-spacing:1px;display:flex;align-items:center;gap:8px}
        .lang-option:hover{background:#1A1A1A}
        .theme-toggle{background:none;border:1px solid;border-color:inherit;padding:7px 10px;font-size:14px;cursor:pointer;transition:all 0.3s;border-radius:2px;line-height:1}
        .theme-toggle:hover{border-color:#E8B000 !important;transform:scale(1.1)}
        .typewriter{display:inline-block;overflow:hidden;white-space:nowrap;animation:typing 1.5s steps(8,end) 1s both}
        .hero-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.18;z-index:0}
        .glass-card{backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr !important;min-height:auto !important}
          .hero-stats{display:none !important}
          .hero-left{padding:3rem 1.5rem !important;border-right:none !important;border-bottom:0.5px solid #242424}
          .hero-title{font-size:48px !important}
          .hero-btns{flex-direction:column !important;gap:12px !important}
          .hero-btns button{width:100% !important;justify-content:center !important}
          .methode-grid{grid-template-columns:1fr !important}
          .methode-right{display:none !important}
          .methode-left{padding:3rem 1.5rem !important;border-right:none !important}
          .temoignages-mobile{display:block !important}
          .plans-grid{grid-template-columns:1fr !important}
          .cta-section{padding:3.5rem 1.5rem !important}
          .cta-title{font-size:40px !important}
          .nav-links{display:none !important}
          .section-pad{padding:3rem 1.5rem !important}
          .footer-wrap{flex-direction:column !important;gap:12px !important;text-align:center !important;padding:1.5rem !important}
          .steps-grid{grid-template-columns:1fr 1fr !important}
          .cur-dot,.cur-ring{display:none}
          .footer-grid{grid-template-columns:1fr 1fr !important;gap:1.5rem !important}
          .footer-brand{grid-column:span 2}
          .stats-grid-4{grid-template-columns:1fr 1fr !important}
          .calc-inputs-grid{grid-template-columns:1fr !important}
          .calc-results-grid{grid-template-columns:1fr 1fr !important}
          .popup-inner{padding:1.5rem !important}
        }
        @media(max-width:480px){
          .footer-grid{grid-template-columns:1fr !important}
          .footer-brand{grid-column:span 1}
          .steps-grid{grid-template-columns:1fr !important}
          .stats-grid-4{grid-template-columns:1fr 1fr !important}
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"20px 32px",borderBottom:`0.5px solid ${T.border}`,
        position:"sticky",top:0,background:T.bg,zIndex:100,
        backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>
        <div style={{fontSize:22,fontWeight:800,letterSpacing:5,animation:"glitch 4s ease infinite"}}>
          APXFIT<span style={{color:"#E8B000"}}>NESS</span>
        </div>
        <div className="nav-links" style={{display:"flex",gap:"2rem",fontSize:13,letterSpacing:"1px",color:T.muted}}>
          <span className="nav-link" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})}>{t.nav.programmes}</span>
          <span className="nav-link" onClick={()=>document.getElementById("methode").scrollIntoView({behavior:"smooth"})}>{t.nav.methode}</span>
          <span className="nav-link" onClick={()=>router.push("/tarifs")}>{t.nav.tarifs}</span>
          <span className="nav-link" onClick={()=>router.push("/calculateur")}>Calculateur</span>
          <span className="nav-link" onClick={()=>router.push("/faq")}>FAQ</span>
          <span className="nav-link" onClick={()=>router.push("/a-propos")}>À propos</span>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button className="theme-toggle" onClick={toggleTheme} title="Changer le thème"
            style={{color:T.muted,borderColor:T.border}}>
            {theme==='dark' ? '☀' : '◐'}
          </button>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
          <button className="nav-btn" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})} style={{
            background:"linear-gradient(135deg,#E8B000,#C49200)",border:"none",color:"#0A0A0A",
            padding:"10px 24px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,
            letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
            {t.nav.cta}
          </button>
        </div>
      </nav>
      <div style={{height:1,background:"linear-gradient(90deg,transparent,#E8B000,transparent)",animation:"lineGrow 1.5s ease 0.5s both",width:"100%"}}/>

      {/* ── Hero ── */}
      <section style={{position:"relative",minHeight:"92vh",display:"flex",alignItems:"flex-end",overflow:"hidden",borderBottom:`0.5px solid ${T.border}`}}>
        {/* Vidéo fond */}
        <video style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:theme==="dark"?0.28:0.15,zIndex:0}} autoPlay muted loop playsInline preload="none">
          <source src="/videos/v1.mp4" type="video/mp4"/>
        </video>
        {/* Overlay gradient */}
        <div style={{position:"absolute",inset:0,background:theme==="dark"
          ?"linear-gradient(to top, #0A0A0A 0%, rgba(10,10,10,0.72) 55%, rgba(10,10,10,0.18) 100%)"
          :"linear-gradient(to top, #F5F1EB 0%, rgba(245,241,235,0.75) 55%, rgba(245,241,235,0.1) 100%)",
          zIndex:1}}/>
        {/* Grille déco */}
        <svg style={{position:"absolute",inset:0,opacity:0.04,width:"100%",height:"100%",zIndex:2}} viewBox="0 0 300 260" preserveAspectRatio="xMidYMid slice">
          <defs><pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E8B000" strokeWidth="0.5"/></pattern></defs>
          <rect width="300" height="260" fill="url(#g)"/>
        </svg>
        {/* Particules */}
        <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:3}}/>
        <div className="scan-line-el" style={{zIndex:4}}/>
        {/* Image gym B&W */}
        <div style={{position:"absolute",right:0,top:0,width:"55%",height:"100%",zIndex:2,overflow:"hidden"}}>
          <Image src="/gym.png" alt="" aria-hidden="true" fill priority
            sizes="55vw"
            style={{
              objectFit:"cover",objectPosition:"50% 0%",
              filter:"grayscale(100%) contrast(1.08)",
              WebkitMaskImage:"linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.92) 80%)",
              maskImage:"linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.92) 80%)",
              opacity:0.88,
            }}
          />
        </div>
        {/* Contenu */}
        <div style={{position:"relative",zIndex:5,padding:"0 clamp(1.5rem,5vw,5rem) clamp(3rem,6vh,5rem)",width:"100%"}}>
          <div className="a1" style={{fontSize:11,letterSpacing:"5px",textTransform:"uppercase",color:"#E8B000",marginBottom:"1.5rem"}}>{t.hero.tag}</div>
          <h1 className="a2" style={{
            fontFamily:"'Syne',sans-serif",
            fontSize:"clamp(40px,6.5vw,96px)",
            fontWeight:800,
            lineHeight:0.88,
            marginBottom:"2rem",
            textTransform:"uppercase",
            letterSpacing:"-0.02em",
            maxWidth:900,
          }}>
            <span style={{display:"block",color:T.fg}}>{t.hero.title1}</span>
            <span className="gold-text" style={{display:"block"}}>{t.hero.title2}</span>
            <span style={{display:"block",color:T.fg}}>{t.hero.title3}<span style={{color:"#E8B000"}}>.</span></span>
          </h1>
          <div style={{width:0,height:2,background:"linear-gradient(90deg,#E8B000,transparent)",margin:"0 0 1.5rem",animation:"lineGrow 1s ease 1.2s both"}}/>
          <p className="a3" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(15px,2vw,19px)",color:T.muted,lineHeight:1.7,maxWidth:480,marginBottom:"2.5rem"}}>{t.hero.sub}</p>
          <div className="a4 hero-btns" style={{display:"flex",gap:"1rem",alignItems:"center",marginBottom:"3.5rem"}}>
            <button className="btn-primary" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})} style={{
              background:"linear-gradient(135deg,#E8B000,#C49200)",border:"none",color:"#0A0A0A",
              padding:"16px 40px",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,
              letterSpacing:"3px",textTransform:"uppercase",cursor:"pointer"}}>
              {t.hero.cta1}
            </button>
            <button className="btn-ghost" onClick={()=>document.getElementById("calc-section").scrollIntoView({behavior:"smooth"})} style={{
              background:"none",border:`0.5px solid ${T.border}`,color:T.muted,fontFamily:"'Syne',sans-serif",
              fontSize:12,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",padding:"16px 28px",transition:"all 0.3s"}}>
              Calculateur gratuit ↓
            </button>
          </div>
          {/* Stats inline */}
          <div style={{display:"flex",gap:"clamp(1.5rem,4vw,3.5rem)",paddingTop:"2rem",borderTop:`0.5px solid rgba(${theme==="dark"?"255,255,255":"0,0,0"},0.08)`}}>
            {[["100%",t.stats[0]],["+340",t.stats[1]],["4.9★","Note moyenne"]].map(([num,label],i)=>(
              <div key={i} className="stat-box">
                <div className="stat-num gold-text" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,4vw,48px)",fontWeight:600,lineHeight:1}}>{num}</div>
                <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:T.muted,marginTop:4}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Strip ── */}
      <div className="reveal" style={{overflow:"hidden",borderBottom:`0.5px solid ${T.border}`,background:"#E8B000",padding:"12px 0",position:"relative"}}>
        <div style={{display:"flex",gap:"3rem",animation:"marquee 12s linear infinite",whiteSpace:"nowrap"}}>
          {[...t.strip,"·",...t.strip,"·"].map((s,i)=>(
            <span key={i} style={{fontSize:12,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",color:"#0A0A0A"}}>{s}</span>
          ))}
        </div>
      </div>

      {/* ── Steps ── */}
      <div className="steps-grid reveal" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:T.gap,borderBottom:`0.5px solid ${T.border}`}}>
        {t.steps.map(([num,title,desc],i)=>(
          <div key={i} className="step-box a6" style={{background:T.bg2,padding:"1.5rem",animationDelay:`${0.9+i*0.15}s`}}>
            <div className="step-num" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:600,color:T.border2,lineHeight:1,marginBottom:8,transition:"opacity 0.3s"}}>{num}</div>
            <div className="step-title" style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6,transition:"color 0.3s"}}>{title}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:T.muted,lineHeight:1.6}}>{desc}</div>
          </div>
        ))}
      </div>

      {/* ── Méthode ── */}
      <section id="methode" className="methode-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:`0.5px solid ${T.border}`}}>
        <div className="methode-left reveal-left" style={{padding:"4rem 3rem",borderRight:`0.5px solid ${T.border}`}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#E8B000",marginBottom:"0.5rem"}}>{t.methode.tag}</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:42,fontWeight:600,lineHeight:1.1,marginBottom:"2rem"}}>
            {t.methode.title}<br/><em style={{fontStyle:"italic",color:T.muted}}>{t.methode.subtitle}</em>
          </div>
          {t.methode.steps.map(([num,title,desc])=>(
            <div key={num} style={{display:"flex",gap:"1.5rem",padding:"1.5rem 0",borderBottom:`0.5px solid ${T.border}`}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:48,fontWeight:600,color:T.border,lineHeight:1,minWidth:52}}>{num}</div>
              <div>
                <div style={{fontSize:16,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>{title}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:T.muted,lineHeight:1.6}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="methode-right reveal-right" style={{padding:"4rem 3rem",background:T.card,display:"flex",flexDirection:"column",gap:"2rem",justifyContent:"center"}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#E8B000"}}>{t.methode.testimonials}</div>
          {t.methode.reviews.map(([quote,author])=>(
            <div key={author} style={{padding:"1.5rem",borderLeft:"3px solid #E8B000"}}>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic",color:T.muted,lineHeight:1.7,marginBottom:"0.75rem"}}>{quote}</p>
              <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#E8B000"}}>{author}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Chiffres clés ── */}
      <section className="reveal" style={{borderBottom:`0.5px solid ${T.border2}`,background:T.bg3}}>
        <div className="stats-grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:T.gap}}>
          {[
            {n:"+200",label:"Clients accompagnés",    color:"#E8B000"},
            {n:"92%", label:"Objectif atteint 12 sem.",color:"#7AE07A"},
            {n:"4.9", label:"Note moyenne / 5",        color:"#5DCAA5"},
            {n:"48h", label:"Délai de livraison",      color:"#F5C832"},
          ].map((s,i)=>(
            <div key={i} style={{background:T.bg,padding:"2.5rem 2rem",textAlign:"center",transition:"background 0.3s"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(40px,5vw,60px)",fontWeight:600,color:s.color,lineHeight:1,marginBottom:10}}>{s.n}</div>
              <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#888"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Témoignages mobile ── */}
      <section className="temoignages-mobile" style={{display:"none",padding:"3rem 1.5rem",borderBottom:`0.5px solid ${T.border}`}}>
        <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#E8B000",marginBottom:"1.5rem"}}>{t.methode.testimonials}</div>
        {t.methode.reviews.map(([quote,author])=>(
          <div key={author} style={{padding:"1.25rem",borderLeft:"3px solid #E8B000",marginBottom:"1rem"}}>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic",color:T.muted,lineHeight:1.7,marginBottom:"0.75rem"}}>{quote}</p>
            <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#E8B000"}}>{author}</div>
          </div>
        ))}
      </section>

      {/* ── Galerie vidéo ── */}
      <VideoGallery />

      {/* ── Offres ── */}
      <section id="offres" className="section-pad reveal" style={{padding:"4rem 3rem",borderBottom:`0.5px solid ${T.border}`,
        background:`radial-gradient(ellipse at 50% 0%,rgba(232,176,0,0.06) 0%,${T.bg} 60%)`}}>
        <div style={{textAlign:"center",marginBottom:"3rem"}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#E8B000",marginBottom:"0.5rem"}}>{t.plans.tag}</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:48,fontWeight:600,lineHeight:1}}>
            {t.plans.title}<br/><em style={{fontStyle:"italic",color:T.muted}}>{t.plans.subtitle}</em>
          </div>
        </div>
        <div className="plans-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:T.gap}}>
          {PLAN_NAMES.map((name,i)=>(
            <div key={name} className="plan-card glass-card"
              onMouseMove={e=>{const rect=e.currentTarget.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width-.5,y=(e.clientY-rect.top)/rect.height-.5;e.currentTarget.style.transition="transform .05s";e.currentTarget.style.transform=`perspective(700px) rotateY(${x*8}deg) rotateX(${-y*8}deg) translateZ(7px) translateY(-8px)`;}}
              onMouseLeave={e=>{e.currentTarget.style.transition="transform .5s cubic-bezier(.2,0,0,1)";e.currentTarget.style.transform="perspective(700px) rotateY(0) rotateX(0) translateZ(0) translateY(0)";}}
              style={{
                background:i===1?`rgba(${theme==='dark'?'24,24,24':'255,255,255'},0.85)`:theme==='dark'?'rgba(17,17,17,0.8)':'rgba(255,255,255,0.7)',
                backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
                padding:"2.5rem 2rem",
                border:`0.5px solid ${i===1?"#E8B000":T.border}`,
                display:"flex",flexDirection:"column",position:"relative",
                borderTop:i===1?"2px solid #E8B000":`0.5px solid ${T.border}`}}>
              <div className="plan-card-shimmer" />
              {i===1&&<div style={{position:"absolute",top:0,right:0,background:"#E8B000",color:"#0A0A0A",
                fontSize:10,fontWeight:700,letterSpacing:"2px",padding:"5px 14px",textTransform:"uppercase"}}>{t.plans.popular}</div>}
              <div className="plan-name" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,
                color:i===1?"#F5C832":T.fg,marginBottom:4,transition:"color 0.3s"}}>{name}</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:"1.5rem"}}>{t.plans.descs[i]}</div>
              <div className="plan-price" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:56,fontWeight:600,
                color:"#E8B000",lineHeight:1,marginBottom:4,transition:"transform 0.3s"}}>{PLAN_PRICES[i].toFixed(2).replace(".",",")}€</div>
              <div style={{fontSize:11,letterSpacing:"1px",color:T.muted,marginBottom:"1.5rem"}}>{t.plans.period}</div>
              <div style={{flex:1,marginBottom:"2rem"}}>
                {t.plans.features[i].map((f,j)=>(
                  <div key={j} className="plan-feat-item" style={{display:"flex",alignItems:"flex-start",gap:10,
                    padding:"8px 0",borderBottom:`0.5px solid ${T.border}`,fontSize:13,color:i===1?"#888":T.muted,transition:"color 0.2s,padding 0.2s"}}>
                    <span style={{color:"#E8B000"}}>·</span>{f}
                  </div>
                ))}
              </div>
              <button className="plan-btn" onClick={()=>router.push(`/bilan?plan=${name.toLowerCase()}&price=${PLAN_PRICES[i]}`)} style={{
                width:"100%",padding:"13px 0",
                background:i===1?"linear-gradient(135deg,#E8B000,#C49200)":"transparent",
                border:`0.5px solid ${i===1?"#E8B000":T.border}`,
                fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,
                letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
                <span className="plan-btn-text" style={{color:i===1?"#0A0A0A":T.muted}}>{t.plans.cta} {name}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quiz diagnostic ── */}
      <QuizDiagnostic T={T} router={router} />

      {/* ── CTA ── */}
      <section className="cta-section reveal" style={{padding:"5rem 3rem",textAlign:"center",background:"#E8B000",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",width:300,height:300,top:"50%",left:"50%",transform:"translate(-50%,-50%)",borderRadius:"50%",border:"1px solid rgba(10,10,10,0.1)",animation:"pulse 3s ease infinite"}}/>
        <div style={{position:"absolute",width:500,height:500,top:"50%",left:"50%",transform:"translate(-50%,-50%)",borderRadius:"50%",border:"1px solid rgba(10,10,10,0.1)",animation:"pulse 3s ease 1s infinite"}}/>
        <div className="cta-title" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:64,fontWeight:600,
          color:"#0A0A0A",lineHeight:1,marginBottom:"1rem",position:"relative"}}>
          {t.cta.title1}<br/>{t.cta.title2}
        </div>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#6B5F3A",marginBottom:"2.5rem",position:"relative"}}>{t.cta.sub}</p>
        <button className="cta-btn" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})} style={{
          background:"#0A0A0A",color:"#E8B000",padding:"16px 48px",
          fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,
          letterSpacing:"3px",textTransform:"uppercase",border:"none",cursor:"pointer",position:"relative"}}>
          {t.cta.btn}
        </button>
      </section>

      {/* ── Calculateur inline ── */}
      <section id="calc-section" className="reveal" style={{borderTop:`0.5px solid ${T.border}`,borderBottom:`0.5px solid ${T.border}`,background:T.bg}}>
        <InlineCalculateur T={T} theme={theme} router={router} />
      </section>

      {/* ── Footer enrichi ── */}
      <footer style={{borderTop:`0.5px solid ${T.border}`,background:T.bg2}}>
        <div className="footer-grid" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:"2rem",padding:"3rem",maxWidth:1200,margin:"0 auto"}}>
          {/* Colonne marque */}
          <div className="footer-brand">
            <div style={{fontSize:20,fontWeight:800,letterSpacing:5,marginBottom:12}}>APXFIT<span style={{color:"#E8B000"}}>NESS</span></div>
            <p style={{fontSize:12,color:T.muted,lineHeight:1.9,maxWidth:260,marginBottom:20}}>Coaching fitness personnalisé en ligne. Programmes musculation et nutrition 100% sur mesure générés par IA.</p>
            <a href="mailto:coach.apxfitness11@gmail.com" style={{fontSize:11,color:"#E8B000",letterSpacing:"1px",textDecoration:"none",display:"flex",alignItems:"center",gap:6}}>
              <span>✉</span> coach.apxfitness11@gmail.com
            </a>
          </div>
          {/* Programmes */}
          <div>
            <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#888",marginBottom:16}}>Programmes</div>
            {[["Plan Starter — 18,99€/mois","/bilan?plan=starter"],["Plan Forge — 38,99€/mois","/bilan?plan=forge"],["Plan Elite — 68,99€/mois","/bilan?plan=elite"],["Faire mon bilan","/bilan"]].map(([l,h])=>(
              <div key={h} className="footer-link" style={{fontSize:12,color:T.muted,marginBottom:10,cursor:"pointer"}} onClick={()=>router.push(h)}>{l}</div>
            ))}
          </div>
          {/* Navigation */}
          <div>
            <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#888",marginBottom:16}}>Navigation</div>
            {[["À propos","/a-propos"],["Blog","/blog"],["Résultats","/resultats"],["Tarifs","/tarifs"],["Calculateur","/calculateur"],["FAQ","/faq"]].map(([l,h])=>(
              <div key={h} className="footer-link" style={{fontSize:12,color:T.muted,marginBottom:10,cursor:"pointer"}} onClick={()=>router.push(h)}>{l}</div>
            ))}
          </div>
          {/* Légal & accès */}
          <div>
            <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#888",marginBottom:16}}>Légal</div>
            {[["Mentions légales","/mentions-legales"],["Espace client","/client"]].map(([l,h])=>(
              <div key={h} className="footer-link" style={{fontSize:12,color:T.muted,marginBottom:10,cursor:"pointer"}} onClick={()=>router.push(h)}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{borderTop:`0.5px solid ${T.border}`,padding:"1.2rem 3rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:10,letterSpacing:"2px",color:T.muted,textTransform:"uppercase"}}>{t.footer.copy}</div>
          <div style={{fontSize:10,letterSpacing:"1px",color:"#666"}}>Fait avec ♥ en France</div>
        </div>
      </footer>
    </div>
    </>
  );
}

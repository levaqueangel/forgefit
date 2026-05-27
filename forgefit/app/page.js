"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ── TRADUCTIONS ──────────────────────────────────────
const LANGS = {
  fr: {
    flag: "🇫🇷", label: "FR",
    nav: { programmes: "Programmes", methode: "Méthode", tarifs: "Tarifs", cta: "Commencer" },
    hero: {
      tag: "— Coaching sur mesure",
      title1: "Ton corps.",
      title2: "Ton plan.",
      title3: "Tes règles.",
      sub: "Des programmes de musculation et remise en forme conçus uniquement pour toi.",
      cta1: "Obtenir mon plan ↗",
      cta2: "Voir la méthode →",
    },
    stats: ["Personnalisé pour toi", "Clients transformés"],
    strip: ["Musculation","Perte de poids","Remise en forme","Prise de masse","Cardio ciblé","Tonification","Mobilité"],
    steps: [
      ["01","Choisis","Sélectionne ta formule"],
      ["02","Bilan","Remplis ton profil complet"],
      ["03","Reçois","Programme livré en 48h"],
      ["04","Progresse","Adapte & évolue"],
    ],
    methode: {
      tag: "— Comment ça marche",
      title: "4 étapes vers ta",
      subtitle: "version optimale",
      steps: [
        ["01","Choisis ton plan","Sélectionne la formule qui correspond à tes objectifs."],
        ["02","Remplis ton bilan","Un questionnaire complet sur ton corps et tes objectifs."],
        ["03","Reçois ton programme","L'IA génère ton plan et tu le reçois par email sous 48h."],
        ["04","Progresse & évolue","Suis ton programme et reviens pour l'adapter."],
      ],
      testimonials: "— Ils témoignent",
      reviews: [
        ["En 3 mois avec le plan Forge, j'ai perdu 9 kg tout en gagnant en force.","Sarah M. — Plan Forge"],
        ["Le bilan initial a tout changé — j'avais juste besoin d'un plan fait pour MOI.","Thomas K. — Plan Elite"],
        ["Simple, efficace. J'ai enfin un programme que je peux tenir sur la durée.","Camille D. — Plan Starter"],
      ],
    },
    plans: {
      tag: "— Nos formules",
      title: "Choisis ton niveau",
      subtitle: "d'engagement",
      period: "paiement unique",
      cta: "Choisir",
      popular: "⚡ Populaire",
      features: [
        ["Bilan morphologique complet","Programme 4 semaines sur mesure","Plan nutritionnel de base","Livraison par email sous 48h"],
        ["Tout le plan Starter","Suivi mensuel personnalisé","Réévaluation & ajustements","Messagerie directe coach","Vidéos techniques incluses"],
        ["Tout le plan Forge","Appels visio hebdomadaires","Suivi nutrition avancé","Réponse prioritaire 24h","Programme salle + maison"],
      ],
      descs: ["Idéal pour démarrer avec une base solide.","Le plan complet avec suivi sur 3 mois.","Accompagnement premium sur 6 mois."],
    },
    cta: { title1: "Prêt à te", title2: "forger ?", sub: "Commence par choisir ton plan. Sans engagement.", btn: "Voir les plans →" },
    footer: { copy: "© 2026 APXFITNESS — Coaching personnalisé", legal: "Mentions légales & CGV" },
  },
  en: {
    flag: "🇬🇧", label: "EN",
    nav: { programmes: "Programs", methode: "Method", tarifs: "Pricing", cta: "Get Started" },
    hero: {
      tag: "— Personalized Coaching",
      title1: "Your body.",
      title2: "Your plan.",
      title3: "Your rules.",
      sub: "Strength and fitness programs designed exclusively for you.",
      cta1: "Get my plan ↗",
      cta2: "See the method →",
    },
    stats: ["Personalized for you", "Transformed clients"],
    strip: ["Bodybuilding","Weight loss","Fitness","Muscle gain","Cardio","Toning","Mobility"],
    steps: [
      ["01","Choose","Select your plan"],
      ["02","Assessment","Fill your profile"],
      ["03","Receive","Program delivered in 48h"],
      ["04","Progress","Adapt & evolve"],
    ],
    methode: {
      tag: "— How it works",
      title: "4 steps toward your",
      subtitle: "optimal self",
      steps: [
        ["01","Choose your plan","Select the plan that matches your goals."],
        ["02","Fill your assessment","A complete questionnaire about your body and goals."],
        ["03","Receive your program","AI generates your plan and delivers it by email within 48h."],
        ["04","Progress & evolve","Follow your program and come back to adapt it."],
      ],
      testimonials: "— They testify",
      reviews: [
        ["In 3 months with the Forge plan, I lost 9 kg while gaining strength.","Sarah M. — Forge Plan"],
        ["The initial assessment changed everything — I just needed a plan made for ME.","Thomas K. — Elite Plan"],
        ["Simple, effective. I finally have a program I can stick to.","Camille D. — Starter Plan"],
      ],
    },
    plans: {
      tag: "— Our plans",
      title: "Choose your level",
      subtitle: "of commitment",
      period: "one-time payment",
      cta: "Choose",
      popular: "⚡ Popular",
      features: [
        ["Complete body assessment","4-week custom program","Basic nutrition plan","Email delivery within 48h"],
        ["Everything in Starter","Monthly personalized follow-up","Reassessment & adjustments","Direct coach messaging","Technical video guides"],
        ["Everything in Forge","Weekly video calls","Advanced nutrition tracking","Priority 24h response","Gym + home program"],
      ],
      descs: ["Ideal to start with a solid foundation.","The complete plan with 3-month follow-up.","Premium 6-month coaching."],
    },
    cta: { title1: "Ready to", title2: "forge yourself?", sub: "Start by choosing your plan. No commitment.", btn: "See plans →" },
    footer: { copy: "© 2026 APXFITNESS — Personalized Coaching", legal: "Legal & Terms" },
  },
  de: {
    flag: "🇩🇪", label: "DE",
    nav: { programmes: "Programme", methode: "Methode", tarifs: "Preise", cta: "Loslegen" },
    hero: {
      tag: "— Persönliches Coaching",
      title1: "Dein Körper.",
      title2: "Dein Plan.",
      title3: "Deine Regeln.",
      sub: "Kraft- und Fitnessprogramme, die exklusiv für dich entwickelt wurden.",
      cta1: "Meinen Plan erhalten ↗",
      cta2: "Methode ansehen →",
    },
    stats: ["Personalisiert für dich", "Transformierte Kunden"],
    strip: ["Bodybuilding","Gewichtsverlust","Fitness","Muskelaufbau","Cardio","Straffung","Mobilität"],
    steps: [
      ["01","Wählen","Wähle deinen Plan"],
      ["02","Analyse","Fülle dein Profil aus"],
      ["03","Erhalten","Programm in 48h geliefert"],
      ["04","Fortschritt","Anpassen & entwickeln"],
    ],
    methode: {
      tag: "— So funktioniert es",
      title: "4 Schritte zu deinem",
      subtitle: "optimalen Selbst",
      steps: [
        ["01","Wähle deinen Plan","Wähle den Plan, der zu deinen Zielen passt."],
        ["02","Fülle deine Analyse aus","Ein vollständiger Fragebogen über deinen Körper."],
        ["03","Erhalte dein Programm","KI erstellt deinen Plan und liefert ihn per E-Mail."],
        ["04","Fortschritt & Entwicklung","Folge dem Programm und komm zurück, um es anzupassen."],
      ],
      testimonials: "— Sie berichten",
      reviews: [
        ["In 3 Monaten mit dem Forge-Plan habe ich 9 kg abgenommen.","Sarah M. — Forge Plan"],
        ["Die erste Analyse hat alles verändert — ich brauchte nur einen Plan für MICH.","Thomas K. — Elite Plan"],
        ["Einfach, effektiv. Endlich ein Programm, das ich durchhalten kann.","Camille D. — Starter Plan"],
      ],
    },
    plans: {
      tag: "— Unsere Pläne",
      title: "Wähle dein Level",
      subtitle: "des Engagements",
      period: "Einmalzahlung",
      cta: "Wählen",
      popular: "⚡ Beliebt",
      features: [
        ["Vollständige Körperanalyse","4-Wochen-Individualprogramm","Basis-Ernährungsplan","E-Mail-Lieferung in 48h"],
        ["Alles aus Starter","Monatliche Begleitung","Neubewertung & Anpassungen","Direkter Coach-Kontakt","Technische Videoanleitungen"],
        ["Alles aus Forge","Wöchentliche Videoanrufe","Erweiterte Ernährungsverfolgung","Prioritätsantwort 24h","Gym + Heimprogramm"],
      ],
      descs: ["Ideal für einen soliden Start.","Der komplette Plan mit 3-Monats-Begleitung.","Premium 6-Monats-Coaching."],
    },
    cta: { title1: "Bereit, dich zu", title2: "formen?", sub: "Beginne mit der Auswahl deines Plans. Ohne Verpflichtung.", btn: "Pläne ansehen →" },
    footer: { copy: "© 2026 APXFITNESS — Persönliches Coaching", legal: "Impressum & AGB" },
  },
  es: {
    flag: "🇪🇸", label: "ES",
    nav: { programmes: "Programas", methode: "Método", tarifs: "Precios", cta: "Empezar" },
    hero: {
      tag: "— Coaching personalizado",
      title1: "Tu cuerpo.",
      title2: "Tu plan.",
      title3: "Tus reglas.",
      sub: "Programas de musculación y fitness diseñados exclusivamente para ti.",
      cta1: "Obtener mi plan ↗",
      cta2: "Ver el método →",
    },
    stats: ["Personalizado para ti", "Clientes transformados"],
    strip: ["Musculación","Pérdida de peso","Fitness","Ganancia muscular","Cardio","Tonificación","Movilidad"],
    steps: [
      ["01","Elige","Selecciona tu plan"],
      ["02","Evaluación","Rellena tu perfil"],
      ["03","Recibe","Programa en 48h"],
      ["04","Progresa","Adapta & evoluciona"],
    ],
    methode: {
      tag: "— Cómo funciona",
      title: "4 pasos hacia tu",
      subtitle: "versión óptima",
      steps: [
        ["01","Elige tu plan","Selecciona el plan que se adapte a tus objetivos."],
        ["02","Rellena tu evaluación","Un cuestionario completo sobre tu cuerpo y objetivos."],
        ["03","Recibe tu programa","La IA genera tu plan y lo envía por email en 48h."],
        ["04","Progresa & evoluciona","Sigue tu programa y vuelve para adaptarlo."],
      ],
      testimonials: "— Ellos testimonian",
      reviews: [
        ["En 3 meses con el plan Forge, perdí 9 kg ganando fuerza.","Sarah M. — Plan Forge"],
        ["La evaluación inicial lo cambió todo — solo necesitaba un plan hecho para MÍ.","Thomas K. — Plan Elite"],
        ["Simple, efectivo. Por fin un programa que puedo mantener.","Camille D. — Plan Starter"],
      ],
    },
    plans: {
      tag: "— Nuestros planes",
      title: "Elige tu nivel",
      subtitle: "de compromiso",
      period: "pago único",
      cta: "Elegir",
      popular: "⚡ Popular",
      features: [
        ["Evaluación morfológica completa","Programa 4 semanas personalizado","Plan nutricional básico","Entrega por email en 48h"],
        ["Todo el plan Starter","Seguimiento mensual personalizado","Reevaluación & ajustes","Mensajería directa coach","Videos técnicos incluidos"],
        ["Todo el plan Forge","Videollamadas semanales","Seguimiento nutricional avanzado","Respuesta prioritaria 24h","Programa gym + casa"],
      ],
      descs: ["Ideal para empezar con una base sólida.","El plan completo con seguimiento 3 meses.","Acompañamiento premium 6 meses."],
    },
    cta: { title1: "¿Listo para", title2: "forjarte?", sub: "Empieza eligiendo tu plan. Sin compromiso.", btn: "Ver los planes →" },
    footer: { copy: "© 2026 APXFITNESS — Coaching personalizado", legal: "Aviso legal & CGV" },
  },
};

const PLAN_NAMES = ["Starter","Forge","Elite"];
const PLAN_PRICES = [49,129,249];

export default function Home() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [langOpen, setLangOpen] = useState(false);
  const t = LANGS[lang];

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Syne:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lineGrow{from{width:0}to{width:100%}}
        @keyframes glitch{0%,90%,100%{transform:translate(0)}92%{transform:translate(-2px,1px)}94%{transform:translate(2px,-1px)}}
        @keyframes typing{from{width:0}to{width:3.8em}}
        @keyframes borderPulse{0%,100%{border-color:#242424}50%{border-color:#C9A84C}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes particleFloat{0%{transform:translateY(0) translateX(0);opacity:0.6}50%{transform:translateY(-20px) translateX(10px);opacity:1}100%{transform:translateY(0) translateX(0);opacity:0.6}}
        .a1{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both}
        .a2{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.25s both}
        .a3{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s both}
        .a4{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.55s both}
        .a5{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.7s both}
        .a6{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.9s both}
        .gold-text{background:linear-gradient(90deg,#C9A84C,#E8C87A,#F5D98A,#C9A84C);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.5s linear infinite}
        .nav-link{cursor:pointer;transition:color 0.3s;position:relative;padding-bottom:2px}
        .nav-link::after{content:'';position:absolute;bottom:0;left:0;width:0;height:1px;background:#C9A84C;transition:width 0.3s}
        .nav-link:hover{color:#E8C87A !important}
        .nav-link:hover::after{width:100%}
        .btn-primary{transition:all 0.3s;position:relative;overflow:hidden}
        .btn-primary::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,0.12);transform:translateX(-100%) skew(-15deg);transition:transform 0.4s}
        .btn-primary:hover::after{transform:translateX(120%) skew(-15deg)}
        .btn-primary:hover{transform:translateY(-3px) !important;box-shadow:0 12px 30px rgba(201,168,76,0.35) !important}
        .btn-ghost:hover{color:#E8C87A !important}
        .stat-box{transition:background 0.3s;cursor:default;position:relative}
        .stat-box::before{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:#C9A84C;transform:scaleX(0);transform-origin:left;transition:transform 0.4s}
        .stat-box:hover::before{transform:scaleX(1)}
        .stat-box:hover{background:#0F0F0F !important}
        .stat-box:hover .stat-num{transform:scale(1.06)}
        .stat-num{transition:transform 0.4s}
        .step-box{transition:background 0.3s;cursor:default;position:relative;overflow:hidden}
        .step-box::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:#C9A84C;transform:scaleX(0);transition:transform 0.4s}
        .step-box:hover{background:#111 !important}
        .step-box:hover::after{transform:scaleX(1)}
        .step-box:hover .step-title{color:#E8C87A !important}
        .step-box:hover .step-num{color:#2E2E2E !important}
        .plan-card{transition:all 0.4s;cursor:pointer;position:relative;overflow:hidden}
        .plan-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);transform:scaleX(0);transition:transform 0.4s}
        .plan-card:hover{transform:translateY(-6px) !important;background:#111 !important;z-index:2}
        .plan-card:hover::before{transform:scaleX(1)}
        .plan-card:hover .plan-name{color:#E8C87A !important}
        .plan-card:hover .plan-price{transform:scale(1.05)}
        .plan-card:hover .plan-feat-item{color:#888 !important}
        .plan-btn{transition:all 0.3s;position:relative;overflow:hidden}
        .plan-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#C9A84C,#A67C2E);transform:translateY(100%);transition:transform 0.3s}
        .plan-btn-text{position:relative;z-index:1;transition:color 0.3s}
        .plan-card:hover .plan-btn::before{transform:translateY(0)}
        .plan-card:hover .plan-btn-text{color:#0A0A0A !important}
        .cta-btn{transition:all 0.3s;animation:pulse 2s ease infinite}
        .cta-btn:hover{transform:scale(1.06) !important}
        .footer-link{cursor:pointer;transition:color 0.2s}
        .footer-link:hover{color:#E8C87A !important}
        .nav-btn{position:relative;overflow:hidden;transition:transform 0.2s}
        .nav-btn::before{content:'';position:absolute;inset:0;background:rgba(255,255,255,0.15);transform:translateX(-100%) skew(-15deg);transition:transform 0.4s}
        .nav-btn:hover::before{transform:translateX(120%) skew(-15deg)}
        .nav-btn:hover{transform:translateY(-1px)}
        .lang-btn{cursor:pointer;transition:all 0.2s;user-select:none}
        .lang-btn:hover{color:#E8C87A !important;border-color:#C9A84C !important}
        .lang-option{cursor:pointer;transition:background 0.15s;padding:8px 16px;font-size:12px;letter-spacing:1px;display:flex;align-items:center;gap:8px}
        .lang-option:hover{background:#1A1A1A}
        .p1{position:absolute;width:3px;height:3px;background:#C9A84C;border-radius:50%;top:20%;left:30%;animation:particleFloat 3s ease-in-out 0.5s infinite;opacity:0}
        .p2{position:absolute;width:3px;height:3px;background:#C9A84C;border-radius:50%;top:60%;left:70%;animation:particleFloat 4s ease-in-out 1s infinite;opacity:0}
        .p3{position:absolute;width:3px;height:3px;background:#C9A84C;border-radius:50%;top:40%;left:50%;animation:particleFloat 3.5s ease-in-out 1.5s infinite;opacity:0}
        .p4{position:absolute;width:3px;height:3px;background:#C9A84C;border-radius:50%;top:80%;left:20%;animation:particleFloat 4.5s ease-in-out 0.8s infinite;opacity:0}
        .typewriter{display:inline-block;overflow:hidden;white-space:nowrap;animation:typing 1.5s steps(8,end) 1s both}
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
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"20px 32px",borderBottom:"0.5px solid #242424",
        position:"sticky",top:0,background:"#0A0A0A",zIndex:100}}>
        <div style={{fontSize:22,fontWeight:800,letterSpacing:5,animation:"glitch 4s ease infinite"}}>
          APXFIT<span style={{color:"#C9A84C"}}>NESS</span>
        </div>
        <div className="nav-links" style={{display:"flex",gap:"2rem",fontSize:13,letterSpacing:"1px",color:"#555"}}>
          <span className="nav-link" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})}>{t.nav.programmes}</span>
          <span className="nav-link" onClick={()=>document.getElementById("methode").scrollIntoView({behavior:"smooth"})}>{t.nav.methode}</span>
          <span className="nav-link" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})}>{t.nav.tarifs}</span>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          {/* Sélecteur de langue */}
          <div style={{position:"relative"}}>
            <div className="lang-btn" onClick={()=>setLangOpen(!langOpen)} style={{
              display:"flex",alignItems:"center",gap:6,
              border:"0.5px solid #333",padding:"6px 12px",
              fontSize:12,fontWeight:700,letterSpacing:"1px",color:"#888",
              fontFamily:"'Syne',sans-serif"}}>
              <span>{t.flag}</span>
              <span>{t.label}</span>
              <span style={{fontSize:10,opacity:0.5}}>{langOpen?"▲":"▼"}</span>
            </div>
            {langOpen && (
              <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#111",
                border:"0.5px solid #242424",minWidth:140,zIndex:200}}>
                {Object.entries(LANGS).map(([code,l])=>(
                  <div key={code} className="lang-option" onClick={()=>{setLang(code);setLangOpen(false)}}
                    style={{color:lang===code?"#C9A84C":"#888",background:lang===code?"#1A1A1A":"transparent",
                      fontFamily:"'Syne',sans-serif",fontWeight:lang===code?700:400}}>
                    <span>{l.flag}</span>
                    <span style={{fontSize:11,letterSpacing:"1px"}}>{
                      code==="fr"?"Français":code==="en"?"English":code==="de"?"Deutsch":"Español"
                    }</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="nav-btn" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})} style={{
            background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",
            padding:"10px 24px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,
            letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
            {t.nav.cta}
          </button>
        </div>
      </nav>
      <div style={{height:1,background:"linear-gradient(90deg,transparent,#C9A84C,transparent)",animation:"lineGrow 1.5s ease 0.5s both",width:"100%"}}/>

      {/* ── Hero ── */}
      <section className="hero-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:"520px",borderBottom:"0.5px solid #242424"}}>
        <div className="hero-left" style={{padding:"5rem 3rem",display:"flex",flexDirection:"column",justifyContent:"center",borderRight:"0.5px solid #242424"}}>
          <div className="a1" style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"1.5rem"}}>{t.hero.tag}</div>
          <h1 className="a2 hero-title" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:72,fontWeight:600,lineHeight:0.95,marginBottom:"1.5rem"}}>
            {t.hero.title1}<br/>
            <em className="gold-text" style={{fontStyle:"italic",fontSize:64}}><span className="typewriter">{t.hero.title2}</span></em><br/>
            {t.hero.title3}
          </h1>
          <div style={{width:0,height:1,background:"linear-gradient(90deg,#C9A84C,transparent)",margin:"0.5rem 0 1.5rem",animation:"lineGrow 1s ease 1s both"}}/>
          <p className="a3" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#555",lineHeight:1.7,maxWidth:380,marginBottom:"2.5rem"}}>{t.hero.sub}</p>
          <div className="a4 hero-btns" style={{display:"flex",gap:"1rem",alignItems:"center"}}>
            <button className="btn-primary" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})} style={{
              background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",
              padding:"14px 32px",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,
              letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
              {t.hero.cta1}
            </button>
            <button className="btn-ghost" onClick={()=>document.getElementById("methode").scrollIntoView({behavior:"smooth"})} style={{
              background:"none",border:"none",color:"#555",fontFamily:"'Syne',sans-serif",
              fontSize:12,letterSpacing:"1px",cursor:"pointer",transition:"all 0.3s"}}>
              {t.hero.cta2}
            </button>
          </div>
        </div>
        <div className="hero-stats" style={{display:"grid",gridTemplateRows:"1fr 1fr",background:"#0D0D0D",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 50%,rgba(201,168,76,0.04),transparent 70%)",pointerEvents:"none"}}/>
          <div className="p1"/><div className="p2"/><div className="p3"/><div className="p4"/>
          <svg style={{position:"absolute",inset:0,opacity:0.03,width:"100%",height:"100%"}} viewBox="0 0 300 260" preserveAspectRatio="xMidYMid slice">
            <defs><pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#C9A84C" strokeWidth="0.5"/></pattern></defs>
            <rect width="300" height="260" fill="url(#g)"/>
          </svg>
          {[["100%",t.stats[0]],["+340",t.stats[1]]].map(([num,label],i)=>(
            <div key={i} className="stat-box a5" style={{padding:"2.5rem",borderBottom:i===0?"0.5px solid #1A1A1A":"none",display:"flex",flexDirection:"column",justifyContent:"flex-end",background:"#0D0D0D",animationDelay:`${0.5+i*0.2}s`}}>
              <div className="stat-num gold-text" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:80,fontWeight:600,lineHeight:1}}>{num}</div>
              <div style={{fontSize:12,letterSpacing:"3px",textTransform:"uppercase",color:"#333",marginTop:6}}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Strip ── */}
      <div style={{overflow:"hidden",borderBottom:"0.5px solid #242424",background:"#C9A84C",padding:"12px 0",position:"relative"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:40,background:"linear-gradient(90deg,#C9A84C,transparent)",zIndex:1}}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:40,background:"linear-gradient(270deg,#C9A84C,transparent)",zIndex:1}}/>
        <div style={{display:"flex",gap:"3rem",animation:"marquee 12s linear infinite",whiteSpace:"nowrap"}}>
          {[...t.strip,"·",...t.strip,"·"].map((s,i)=>(
            <span key={i} style={{fontSize:12,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",color:"#0A0A0A"}}>{s}</span>
          ))}
        </div>
      </div>

      {/* ── Steps ── */}
      <div className="steps-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"#1A1A1A",borderBottom:"0.5px solid #242424"}}>
        {t.steps.map(([num,title,desc],i)=>(
          <div key={i} className="step-box a6" style={{background:"#0D0D0D",padding:"1.5rem",animationDelay:`${0.9+i*0.15}s`}}>
            <div className="step-num" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:600,color:"#1E1E1E",lineHeight:1,marginBottom:8,transition:"color 0.3s"}}>{num}</div>
            <div className="step-title" style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6,transition:"color 0.3s"}}>{title}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:"#444",lineHeight:1.5}}>{desc}</div>
          </div>
        ))}
      </div>

      {/* ── Méthode ── */}
      <section id="methode" className="methode-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:"0.5px solid #242424"}}>
        <div className="methode-left" style={{padding:"4rem 3rem",borderRight:"0.5px solid #242424"}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.5rem"}}>{t.methode.tag}</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:42,fontWeight:600,lineHeight:1.1,marginBottom:"2rem"}}>
            {t.methode.title}<br/><em style={{fontStyle:"italic",color:"#555"}}>{t.methode.subtitle}</em>
          </div>
          {t.methode.steps.map(([num,title,desc])=>(
            <div key={num} style={{display:"flex",gap:"1.5rem",padding:"1.5rem 0",borderBottom:"0.5px solid #242424"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:48,fontWeight:600,color:"#242424",lineHeight:1,minWidth:52}}>{num}</div>
              <div>
                <div style={{fontSize:16,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>{title}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#555",lineHeight:1.6}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="methode-right" style={{padding:"4rem 3rem",background:"#111",display:"flex",flexDirection:"column",gap:"2rem",justifyContent:"center"}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C"}}>{t.methode.testimonials}</div>
          {t.methode.reviews.map(([quote,author])=>(
            <div key={author} style={{padding:"1.5rem",borderLeft:"3px solid #C9A84C"}}>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic",color:"#888",lineHeight:1.7,marginBottom:"0.75rem"}}>{quote}</p>
              <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#C9A84C"}}>{author}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Témoignages mobile ── */}
      <section className="temoignages-mobile" style={{display:"none",padding:"3rem 1.5rem",borderBottom:"0.5px solid #242424"}}>
        <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"1.5rem"}}>{t.methode.testimonials}</div>
        {t.methode.reviews.map(([quote,author])=>(
          <div key={author} style={{padding:"1.25rem",borderLeft:"3px solid #C9A84C",marginBottom:"1rem"}}>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic",color:"#888",lineHeight:1.7,marginBottom:"0.75rem"}}>{quote}</p>
            <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#C9A84C"}}>{author}</div>
          </div>
        ))}
      </section>

      {/* ── Offres ── */}
      <section id="offres" className="section-pad" style={{padding:"4rem 3rem",borderBottom:"0.5px solid #242424"}}>
        <div style={{textAlign:"center",marginBottom:"3rem"}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.5rem"}}>{t.plans.tag}</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:48,fontWeight:600,lineHeight:1}}>
            {t.plans.title}<br/><em style={{fontStyle:"italic",color:"#555"}}>{t.plans.subtitle}</em>
          </div>
        </div>
        <div className="plans-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:"#242424"}}>
          {PLAN_NAMES.map((name,i)=>(
            <div key={name} className="plan-card" style={{
              background:i===1?"#181818":"#111",padding:"2.5rem 2rem",
              border:`0.5px solid ${i===1?"#C9A84C":"#242424"}`,
              display:"flex",flexDirection:"column",position:"relative",
              borderTop:i===1?"2px solid #C9A84C":"0.5px solid #242424"}}>
              {i===1&&<div style={{position:"absolute",top:0,right:0,background:"#C9A84C",color:"#0A0A0A",
                fontSize:10,fontWeight:700,letterSpacing:"2px",padding:"5px 14px",textTransform:"uppercase"}}>{t.plans.popular}</div>}
              <div className="plan-name" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,
                color:i===1?"#E8C87A":"#F0EDE8",marginBottom:4,transition:"color 0.3s"}}>{name}</div>
              <div style={{fontSize:12,color:"#555",marginBottom:"1.5rem"}}>{t.plans.descs[i]}</div>
              <div className="plan-price" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:56,fontWeight:600,
                color:"#C9A84C",lineHeight:1,marginBottom:4,transition:"transform 0.3s"}}>{PLAN_PRICES[i]}€</div>
              <div style={{fontSize:11,letterSpacing:"1px",color:"#555",marginBottom:"1.5rem"}}>{t.plans.period}</div>
              <div style={{flex:1,marginBottom:"2rem"}}>
                {t.plans.features[i].map((f,j)=>(
                  <div key={j} className="plan-feat-item" style={{display:"flex",alignItems:"flex-start",gap:10,
                    padding:"8px 0",borderBottom:"0.5px solid #242424",fontSize:13,color:i===1?"#888":"#555",transition:"color 0.2s"}}>
                    <span style={{color:"#C9A84C"}}>·</span>{f}
                  </div>
                ))}
              </div>
              <button className="plan-btn" onClick={()=>router.push(`/bilan?plan=${name.toLowerCase()}&price=${PLAN_PRICES[i]}`)} style={{
                width:"100%",padding:"13px 0",
                background:i===1?"linear-gradient(135deg,#C9A84C,#A67C2E)":"transparent",
                border:`0.5px solid ${i===1?"#C9A84C":"#242424"}`,
                fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,
                letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
                <span className="plan-btn-text" style={{color:i===1?"#0A0A0A":"#888"}}>{t.plans.cta} {name}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" style={{padding:"5rem 3rem",textAlign:"center",background:"#C9A84C",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",width:300,height:300,top:"50%",left:"50%",transform:"translate(-50%,-50%)",borderRadius:"50%",border:"1px solid rgba(10,10,10,0.1)",animation:"pulse 3s ease infinite"}}/>
        <div style={{position:"absolute",width:500,height:500,top:"50%",left:"50%",transform:"translate(-50%,-50%)",borderRadius:"50%",border:"1px solid rgba(10,10,10,0.1)",animation:"pulse 3s ease 1s infinite"}}/>
        <div className="cta-title" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:64,fontWeight:600,
          color:"#0A0A0A",lineHeight:1,marginBottom:"1rem",position:"relative"}}>
          {t.cta.title1}<br/>{t.cta.title2}
        </div>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#6B5F3A",marginBottom:"2.5rem",position:"relative"}}>{t.cta.sub}</p>
        <button className="cta-btn" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})} style={{
          background:"#0A0A0A",color:"#C9A84C",padding:"16px 48px",
          fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,
          letterSpacing:"3px",textTransform:"uppercase",border:"none",cursor:"pointer",position:"relative"}}>
          {t.cta.btn}
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="footer-wrap" style={{padding:"2rem 3rem",display:"flex",justifyContent:"space-between",
        alignItems:"center",borderTop:"0.5px solid #242424"}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:5}}>APXFIT<span style={{color:"#C9A84C"}}>NESS</span></div>
        <div style={{fontSize:11,letterSpacing:"2px",color:"#555",textTransform:"uppercase"}}>{t.footer.copy}</div>
        <span className="footer-link" style={{fontSize:11,letterSpacing:"2px",color:"#555",textTransform:"uppercase",textDecoration:"underline"}}
          onClick={()=>router.push("/mentions-legales")}>{t.footer.legal}</span>
      </footer>
    </div>
  );
}

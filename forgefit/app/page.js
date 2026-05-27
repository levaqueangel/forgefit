"use client";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id:"starter", name:"Starter", price:49, tag:null,
    desc:"Idéal pour démarrer avec une base solide.",
    features:["Bilan morphologique complet","Programme 4 semaines sur mesure","Plan nutritionnel de base","Livraison par email sous 48h"],
  },
  {
    id:"forge", name:"Forge", price:129, tag:"⚡ Populaire",
    desc:"Le plan complet avec suivi sur 3 mois.",
    features:["Tout le plan Starter","Suivi mensuel personnalisé","Réévaluation & ajustements","Messagerie directe coach","Vidéos techniques incluses"],
  },
  {
    id:"elite", name:"Elite", price:249, tag:null,
    desc:"Accompagnement premium sur 6 mois.",
    features:["Tout le plan Forge","Appels visio hebdomadaires","Suivi nutrition avancé","Réponse prioritaire 24h","Programme salle + maison"],
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}

        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lineGrow{from{width:0}to{width:100%}}
        @keyframes glitch{0%,90%,100%{transform:translate(0)}92%{transform:translate(-2px,1px)}94%{transform:translate(2px,-1px)}}
        @keyframes typing{from{width:0}to{width:3.8em}}
        @keyframes borderPulse{0%,100%{border-color:#242424}50%{border-color:#C9A84C}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(400px)}}
        @keyframes particleFloat{0%{transform:translateY(0) translateX(0);opacity:0.6}50%{transform:translateY(-20px) translateX(10px);opacity:1}100%{transform:translateY(0) translateX(0);opacity:0.6}}

        .a1{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both}
        .a2{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.25s both}
        .a3{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s both}
        .a4{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.55s both}
        .a5{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.7s both}
        .a6{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.9s both}
        .a7{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 1.1s both}
        .a8{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 1.3s both}

        .gold-text{background:linear-gradient(90deg,#C9A84C,#E8C87A,#F5D98A,#C9A84C);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.5s linear infinite}

        .nav-link{cursor:pointer;transition:color 0.3s;position:relative;padding-bottom:2px}
        .nav-link::after{content:'';position:absolute;bottom:0;left:0;width:0;height:1px;background:#C9A84C;transition:width 0.3s}
        .nav-link:hover{color:#E8C87A !important}
        .nav-link:hover::after{width:100%}

        .btn-primary{transition:all 0.3s;position:relative;overflow:hidden}
        .btn-primary::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,0.12);transform:translateX(-100%) skew(-15deg);transition:transform 0.4s}
        .btn-primary:hover::after{transform:translateX(120%) skew(-15deg)}
        .btn-primary:hover{transform:translateY(-3px) !important;box-shadow:0 12px 30px rgba(201,168,76,0.35) !important}

        .btn-ghost{transition:all 0.3s}
        .btn-ghost:hover{color:#E8C87A !important;gap:10px !important}

        .stat-box{transition:background 0.3s;cursor:default;position:relative}
        .stat-box::before{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:#C9A84C;transform:scaleX(0);transform-origin:left;transition:transform 0.4s}
        .stat-box:hover::before{transform:scaleX(1)}
        .stat-box:hover{background:#0F0F0F !important}
        .stat-num{transition:all 0.4s}
        .stat-box:hover .stat-num{transform:scale(1.06)}

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

        .p1{position:absolute;width:3px;height:3px;background:#C9A84C;border-radius:50%;top:20%;left:30%;animation:particleFloat 3s ease-in-out 0.5s infinite;opacity:0}
        .p2{position:absolute;width:3px;height:3px;background:#C9A84C;border-radius:50%;top:60%;left:70%;animation:particleFloat 4s ease-in-out 1s infinite;opacity:0}
        .p3{position:absolute;width:3px;height:3px;background:#C9A84C;border-radius:50%;top:40%;left:50%;animation:particleFloat 3.5s ease-in-out 1.5s infinite;opacity:0}
        .p4{position:absolute;width:3px;height:3px;background:#C9A84C;border-radius:50%;top:80%;left:20%;animation:particleFloat 4.5s ease-in-out 0.8s infinite;opacity:0}

        .typewriter{display:inline-block;overflow:hidden;white-space:nowrap;animation:typing 1.5s steps(8,end) 1s both}

        /* RESPONSIVE MOBILE */
        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr !important;min-height:auto !important}
          .hero-stats{display:none !important}
          .hero-left{padding:3rem 1.5rem !important;border-right:none !important;border-bottom:0.5px solid #242424}
          .hero-title{font-size:52px !important}
          .hero-btns{flex-direction:column !important;gap:12px !important}
          .hero-btns button{width:100% !important;justify-content:center !important}
          .methode-grid{grid-template-columns:1fr !important}
          .methode-right{display:none !important}
          .methode-left{padding:3rem 1.5rem !important;border-right:none !important}
          .temoignages-mobile{display:block !important}
          .plans-grid{grid-template-columns:1fr !important}
          .plan-card{padding:2rem 1.5rem !important}
          .cta-section{padding:3.5rem 1.5rem !important}
          .cta-title{font-size:44px !important}
          .nav-links{display:none !important}
          .section-pad{padding:3rem 1.5rem !important}
          .footer-wrap{flex-direction:column !important;gap:12px !important;text-align:center !important;padding:1.5rem !important}
          .steps-grid{grid-template-columns:1fr 1fr !important}
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"20px 32px",borderBottom:"0.5px solid #242424",
        position:"sticky",top:0,background:"#0A0A0A",zIndex:100,
        animation:"fadeUp 0.6s ease both"}}>
        <div className="a1" style={{fontSize:22,fontWeight:800,letterSpacing:5,animation:"glitch 4s ease infinite"}}>
          APXFIT<span style={{color:"#C9A84C"}}>NESS</span>
        </div>
        <div className="nav-links" style={{display:"flex",gap:"2rem",fontSize:13,letterSpacing:"1px",color:"#555"}}>
          <span className="nav-link" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})}>Programmes</span>
          <span className="nav-link" onClick={()=>document.getElementById("methode").scrollIntoView({behavior:"smooth"})}>Méthode</span>
          <span className="nav-link" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})}>Tarifs</span>
        </div>
        <button className="nav-btn" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})} style={{
          background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",
          padding:"10px 24px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,
          letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
          Commencer
        </button>
      </nav>

      {/* ── Ligne dorée nav ── */}
      <div style={{height:1,background:"linear-gradient(90deg,transparent,#C9A84C,transparent)",animation:"lineGrow 1.5s ease 0.5s both",width:"100%"}}/>

      {/* ── Hero ── */}
      <section className="hero-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:"520px",borderBottom:"0.5px solid #242424"}}>
        <div className="hero-left" style={{padding:"5rem 3rem",display:"flex",flexDirection:"column",justifyContent:"center",borderRight:"0.5px solid #242424",position:"relative"}}>
          <div className="a1" style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"1.5rem"}}>
            — Coaching sur mesure
          </div>
          <h1 className="a2 hero-title" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:72,fontWeight:600,lineHeight:0.95,marginBottom:"1.5rem"}}>
            Ton corps.<br/>
            <em className="gold-text" style={{fontStyle:"italic",fontSize:64}}><span className="typewriter">Ton plan.</span></em><br/>
            Tes règles.
          </h1>
          <div style={{width:0,height:1,background:"linear-gradient(90deg,#C9A84C,transparent)",margin:"0.5rem 0 1.5rem",animation:"lineGrow 1s ease 1s both"}}/>
          <p className="a3" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#555",lineHeight:1.7,maxWidth:380,marginBottom:"2.5rem"}}>
            Des programmes de musculation et remise en forme conçus uniquement pour toi.
          </p>
          <div className="a4 hero-btns" style={{display:"flex",gap:"1rem",alignItems:"center"}}>
            <button className="btn-primary" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})} style={{
              background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",
              padding:"14px 32px",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,
              letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
              Obtenir mon plan ↗
            </button>
            <button className="btn-ghost" onClick={()=>document.getElementById("methode").scrollIntoView({behavior:"smooth"})} style={{
              background:"none",border:"none",color:"#555",fontFamily:"'Syne',sans-serif",
              fontSize:12,letterSpacing:"1px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              Voir la méthode →
            </button>
          </div>
        </div>

        {/* Stats avec particules */}
        <div className="hero-stats" style={{display:"grid",gridTemplateRows:"1fr 1fr",background:"#0D0D0D",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 50%,rgba(201,168,76,0.04),transparent 70%)",pointerEvents:"none"}}/>
          <div className="p1"/><div className="p2"/><div className="p3"/><div className="p4"/>
          <svg style={{position:"absolute",inset:0,opacity:0.03,width:"100%",height:"100%"}} viewBox="0 0 300 260" preserveAspectRatio="xMidYMid slice">
            <defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#C9A84C" stroke-width="0.5"/></pattern></defs>
            <rect width="300" height="260" fill="url(#grid)"/>
          </svg>
          {[["100%","Personnalisé pour toi"],["+340","Clients transformés"]].map(([num,label],i)=>(
            <div key={i} className="stat-box a5" style={{padding:"2.5rem",borderBottom:i===0?"0.5px solid #1A1A1A":"none",display:"flex",flexDirection:"column",justifyContent:"flex-end",background:"#0D0D0D",animationDelay:`${0.5+i*0.2}s`}}>
              <div className="stat-num gold-text" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:80,fontWeight:600,lineHeight:1}}>{num}</div>
              <div style={{fontSize:12,letterSpacing:"3px",textTransform:"uppercase",color:"#333",marginTop:6,transition:"color 0.3s"}}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Strip ── */}
      <div style={{overflow:"hidden",borderBottom:"0.5px solid #242424",background:"#C9A84C",padding:"12px 0",position:"relative"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:40,background:"linear-gradient(90deg,#C9A84C,transparent)",zIndex:1}}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:40,background:"linear-gradient(270deg,#C9A84C,transparent)",zIndex:1}}/>
        <div style={{display:"flex",gap:"3rem",animation:"marquee 12s linear infinite",whiteSpace:"nowrap"}}>
          {["Musculation","·","Perte de poids","·","Remise en forme","·","Prise de masse","·","Cardio ciblé","·","Tonification","·","Mobilité","·",
            "Musculation","·","Perte de poids","·","Remise en forme","·","Prise de masse","·","Cardio ciblé","·","Tonification","·","Mobilité","·"].map((t,i)=>(
            <span key={i} style={{fontSize:12,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",color:"#0A0A0A"}}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── Steps ── */}
      <div className="steps-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"#1A1A1A",borderBottom:"0.5px solid #242424"}}>
        {[["01","Choisis","Sélectionne ta formule"],["02","Bilan","Remplis ton profil complet"],["03","Reçois","Programme livré en 48h"],["04","Progresse","Adapte & évolue"]].map(([num,title,desc],i)=>(
          <div key={i} className={`step-box a6`} style={{background:"#0D0D0D",padding:"1.5rem",animationDelay:`${0.9+i*0.15}s`}}>
            <div className="step-num" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:600,color:"#1E1E1E",lineHeight:1,marginBottom:8,transition:"color 0.3s"}}>{num}</div>
            <div className="step-title" style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6,transition:"color 0.3s"}}>{title}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:"#444",lineHeight:1.5}}>{desc}</div>
          </div>
        ))}
      </div>

      {/* ── Méthode ── */}
      <section id="methode" className="methode-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:"0.5px solid #242424"}}>
        <div className="methode-left" style={{padding:"4rem 3rem",borderRight:"0.5px solid #242424"}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.5rem"}}>— Comment ça marche</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:42,fontWeight:600,lineHeight:1.1,marginBottom:"2rem"}}>
            4 étapes vers ta<br/><em style={{fontStyle:"italic",color:"#555"}}>version optimale</em>
          </div>
          {[["01","Choisis ton plan","Sélectionne la formule qui correspond à tes objectifs."],
            ["02","Remplis ton bilan","Un questionnaire complet sur ton corps et tes objectifs."],
            ["03","Reçois ton programme","L'IA génère ton plan et tu le reçois par email sous 48h."],
            ["04","Progresse & évolue","Suis ton programme et reviens pour l'adapter."]].map(([num,title,desc])=>(
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
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C"}}>— Ils témoignent</div>
          {[["En 3 mois avec le plan Forge, j'ai perdu 9 kg tout en gagnant en force.","Sarah M. — Plan Forge"],
            ["Le bilan initial a tout changé — j'avais juste besoin d'un plan fait pour MOI.","Thomas K. — Plan Elite"],
            ["Simple, efficace. J'ai enfin un programme que je peux tenir sur la durée.","Camille D. — Plan Starter"]].map(([quote,author])=>(
            <div key={author} style={{padding:"1.5rem",borderLeft:"3px solid #C9A84C"}}>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic",color:"#888",lineHeight:1.7,marginBottom:"0.75rem"}}>{quote}</p>
              <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#C9A84C"}}>{author}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Témoignages mobile ── */}
      <section className="temoignages-mobile" style={{display:"none",padding:"3rem 1.5rem",borderBottom:"0.5px solid #242424"}}>
        <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"1.5rem"}}>— Ils témoignent</div>
        {[["En 3 mois avec le plan Forge, j'ai perdu 9 kg tout en gagnant en force.","Sarah M. — Plan Forge"],
          ["Le bilan initial a tout changé — j'avais juste besoin d'un plan fait pour MOI.","Thomas K. — Plan Elite"],
          ["Simple, efficace. J'ai enfin un programme que je peux tenir sur la durée.","Camille D. — Plan Starter"]].map(([quote,author])=>(
          <div key={author} style={{padding:"1.25rem",borderLeft:"3px solid #C9A84C",marginBottom:"1rem"}}>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic",color:"#888",lineHeight:1.7,marginBottom:"0.75rem"}}>{quote}</p>
            <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#C9A84C"}}>{author}</div>
          </div>
        ))}
      </section>

      {/* ── Offres ── */}
      <section id="offres" className="section-pad" style={{padding:"4rem 3rem",borderBottom:"0.5px solid #242424"}}>
        <div style={{textAlign:"center",marginBottom:"3rem"}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.5rem"}}>— Nos formules</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:48,fontWeight:600,lineHeight:1}}>
            Choisis ton niveau<br/><em style={{fontStyle:"italic",color:"#555"}}>d'engagement</em>
          </div>
        </div>
        <div className="plans-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:"#242424"}}>
          {PLANS.map(plan=>(
            <div key={plan.id} className="plan-card" style={{
              background:plan.tag?"#181818":"#111",padding:"2.5rem 2rem",
              border:`0.5px solid ${plan.tag?"#C9A84C":"#242424"}`,
              display:"flex",flexDirection:"column",
              borderTop:plan.tag?"2px solid #C9A84C":"0.5px solid #242424"}}>
              {plan.tag&&<div style={{position:"absolute",top:0,right:0,background:"#C9A84C",color:"#0A0A0A",
                fontSize:10,fontWeight:700,letterSpacing:"2px",padding:"5px 14px",textTransform:"uppercase"}}>{plan.tag}</div>}
              <div className="plan-name" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,
                color:plan.tag?"#E8C87A":"#F0EDE8",marginBottom:4,transition:"color 0.3s"}}>{plan.name}</div>
              <div style={{fontSize:12,color:"#555",marginBottom:"1.5rem"}}>{plan.desc}</div>
              <div className="plan-price" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:56,fontWeight:600,
                color:"#C9A84C",lineHeight:1,marginBottom:4,transition:"transform 0.3s"}}>{plan.price}€</div>
              <div style={{fontSize:11,letterSpacing:"1px",color:"#555",marginBottom:"1.5rem"}}>paiement unique</div>
              <div style={{flex:1,marginBottom:"2rem"}}>
                {plan.features.map((f,i)=>(
                  <div key={i} className="plan-feat-item" style={{display:"flex",alignItems:"flex-start",gap:10,
                    padding:"8px 0",borderBottom:"0.5px solid #242424",fontSize:13,color:plan.tag?"#888":"#555",transition:"color 0.2s"}}>
                    <span style={{color:"#C9A84C"}}>·</span>{f}
                  </div>
                ))}
              </div>
              <button className="plan-btn" onClick={()=>router.push(`/bilan?plan=${plan.id}&price=${plan.price}`)} style={{
                width:"100%",padding:"13px 0",
                background:plan.tag?"linear-gradient(135deg,#C9A84C,#A67C2E)":"transparent",
                border:`0.5px solid ${plan.tag?"#C9A84C":"#242424"}`,
                fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,
                letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
                <span className="plan-btn-text" style={{color:plan.tag?"#0A0A0A":"#888"}}>Choisir {plan.name}</span>
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
          Prêt à te<br/>forger ?
        </div>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#6B5F3A",marginBottom:"2.5rem",position:"relative"}}>
          Commence par choisir ton plan. Sans engagement.
        </p>
        <button className="cta-btn" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})} style={{
          background:"#0A0A0A",color:"#C9A84C",padding:"16px 48px",
          fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,
          letterSpacing:"3px",textTransform:"uppercase",border:"none",cursor:"pointer",position:"relative"}}>
          Voir les plans →
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="footer-wrap" style={{padding:"2rem 3rem",display:"flex",justifyContent:"space-between",
        alignItems:"center",borderTop:"0.5px solid #242424"}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:5}}>APXFIT<span style={{color:"#C9A84C"}}>NESS</span></div>
        <div style={{fontSize:11,letterSpacing:"2px",color:"#555",textTransform:"uppercase"}}>© 2026 APXFITNESS — Coaching personnalisé</div>
        <span className="footer-link" style={{fontSize:11,letterSpacing:"2px",color:"#555",textTransform:"uppercase",textDecoration:"underline"}}
          onClick={()=>router.push("/mentions-legales")}>Mentions légales & CGV</span>
      </footer>
    </div>
  );
}

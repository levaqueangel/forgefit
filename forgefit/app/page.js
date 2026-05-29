"use client";
import { useRouter } from "next/navigation";
import { useLang } from "./useLang";
import { LangSelector } from "./LangSelector";

const PLAN_NAMES = ["Starter","Forge","Elite"];
const PLAN_PRICES = [49,129,249];

export default function Home() {
  // ── Pop-up capture email ──────────────────────────────────────
  const [showPopup, setShowPopup] = useState(false);
  const [popupEmail, setPopupEmail] = useState("");
  const [popupDone, setPopupDone] = useState(false);
  const [popupLoading, setPopupLoading] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("apx_popup_done")) return;
    } catch {}
    const t = setTimeout(() => setShowPopup(true), 35000);
    return () => clearTimeout(t);
  }, []);

  const handlePopupSubmit = async () => {
    if (!popupEmail.trim()) return;
    setPopupLoading(true);
    try {
      await fetch("/api/notify-coach", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: "Prospect", email: popupEmail, message: `Nouveau prospect inscrit via pop-up : ${popupEmail}` }),
      });
      try { localStorage.setItem("apx_popup_done", "1"); } catch {}
      setPopupDone(true);
      setTimeout(() => setShowPopup(false), 2500);
    } catch {}
    setPopupLoading(false);
  };
  const router = useRouter();
  const { lang, setLang, t, LANGS } = useLang();

  return (
    <>
    {/* ── Pop-up capture email ────────────────────────────────── */}
    {showPopup && (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
        <div style={{background:"#111",border:"0.5px solid #242424",borderRadius:4,padding:"2rem",width:"100%",maxWidth:420,position:"relative",fontFamily:"'Syne',sans-serif"}}>
          <button onClick={()=>{setShowPopup(false);try{localStorage.setItem("apx_popup_done","1")}catch{}}} style={{position:"absolute",top:12,right:12,background:"transparent",border:"none",color:"#444",fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
          {popupDone ? (
            <div style={{textAlign:"center",padding:"1rem 0"}}>
              <div style={{fontSize:32,marginBottom:12}}>🎉</div>
              <div style={{fontSize:14,fontWeight:700,color:"#7AE07A",marginBottom:8}}>Guide envoyé !</div>
              <div style={{fontSize:12,color:"#555"}}>Vérifie ta boîte mail dans quelques instants.</div>
            </div>
          ) : (
            <>
              <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.75rem"}}>— Cadeau gratuit</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,lineHeight:1.2,marginBottom:"0.75rem",color:"#F0EDE8"}}>
                Les 5 erreurs qui empêchent<br/><em style={{fontStyle:"italic",color:"#C9A84C"}}>tes résultats</em>
              </div>
              <p style={{fontSize:13,color:"#555",lineHeight:1.7,marginBottom:"1.5rem",fontFamily:"'Cormorant Garamond',serif",fontSize:15}}>
                Reçois notre guide gratuit par email et évite les pièges que font 90% des débutants.
              </p>
              <div style={{display:"flex",gap:1}}>
                <input type="email" value={popupEmail} onChange={e=>setPopupEmail(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")handlePopupSubmit();}}
                  placeholder="ton@email.com"
                  style={{flex:1,background:"#0D0D0D",border:"0.5px solid #242424",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:13,padding:"11px 14px",outline:"none",borderRadius:0}}/>
                <button onClick={handlePopupSubmit} disabled={popupLoading||!popupEmail.trim()}
                  style={{background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"0 18px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:popupEmail.trim()?"pointer":"not-allowed",flexShrink:0}}>
                  {popupLoading?"...":"Envoyer"}
                </button>
              </div>
              <p style={{fontSize:11,color:"#333",marginTop:10,textAlign:"center"}}>Pas de spam. Tu te désinscris quand tu veux.</p>
            </>
          )}
        </div>
      </div>
    )}
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif"}}>
      <style>{`
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
          <span className="nav-link" onClick={()=>router.push("/faq")}>FAQ</span>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
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
        <div style={{display:"flex",gap:"1.5rem",alignItems:"center"}}>
          <span className="footer-link" style={{fontSize:11,letterSpacing:"2px",color:"#555",textTransform:"uppercase",textDecoration:"underline",cursor:"pointer"}}
            onClick={()=>router.push("/client")}>Espace client</span>
          <span style={{color:"#242424"}}>|</span>
          <span className="footer-link" style={{fontSize:11,letterSpacing:"2px",color:"#555",textTransform:"uppercase",textDecoration:"underline",cursor:"pointer"}}
            onClick={()=>router.push("/blog")}>Blog</span>
          <span style={{color:"#242424"}}>|</span>
          <span className="footer-link" style={{fontSize:11,letterSpacing:"2px",color:"#555",textTransform:"uppercase",textDecoration:"underline",cursor:"pointer"}}
            onClick={()=>router.push("/faq")}>FAQ</span>
          <span style={{color:"#242424"}}>|</span>
          <span className="footer-link" style={{fontSize:11,letterSpacing:"2px",color:"#555",textTransform:"uppercase",textDecoration:"underline",cursor:"pointer"}}
            onClick={()=>router.push("/mentions-legales")}>{t.footer.legal}</span>
        </div>
      </footer>
    </div>
  );
    </>
  );
}

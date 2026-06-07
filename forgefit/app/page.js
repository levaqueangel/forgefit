"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./useLang";
import { LangSelector } from "./LangSelector";
import VideoGallery from "./components/VideoGallery";

const PLAN_NAMES = ["Starter","Forge","Elite"];
const PLAN_PRICES = [49,129,249];

const DARK = { bg:'#0A0A0A', bg2:'#0D0D0D', bg3:'#080808', card:'#111', card2:'#181818', fg:'#F0EDE8', muted:'#555', border:'#242424', border2:'#1A1A1A', gap:'#242424' };
const LIGHT = { bg:'#F5F1EB', bg2:'#EDE9E1', bg3:'#E8E3DA', card:'#FFFFFF', card2:'#F7F3EC', fg:'#0A0A0A', muted:'#888', border:'#D8D2C8', border2:'#E2DDD5', gap:'#C8C3BA' };

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
    let mx=cv.width/2, my=cv.height/2;
    const onMove = e => { const r=cv.getBoundingClientRect(); mx=e.clientX-r.left; my=e.clientY-r.top; };
    par.addEventListener("mousemove",onMove);
    const draw = () => {
      ctx.clearRect(0,0,cv.width,cv.height);
      for(let i=0;i<N;i++){
        const p=pts[i]; p.ph+=.025;
        const dx=mx-p.x,dy=my-p.y,d=Math.hypot(dx,dy);
        if(d<200){p.vx+=dx/d*.005;p.vy+=dy/d*.005;}
        const sp=Math.hypot(p.vx,p.vy); if(sp>.48){p.vx=p.vx/sp*.48;p.vy=p.vy/sp*.48;}
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=cv.width; if(p.x>cv.width)p.x=0;
        if(p.y<0)p.y=cv.height; if(p.y>cv.height)p.y=0;
        for(let j=i+1;j<N;j++){const dx2=p.x-pts[j].x,dy2=p.y-pts[j].y,d2=Math.hypot(dx2,dy2);if(d2<130){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(201,168,76,${.2*(1-d2/130)})`;ctx.lineWidth=.55;ctx.stroke();}}
        const pr=p.r*(1+.15*Math.sin(p.ph));
        ctx.beginPath();ctx.arc(p.x,p.y,pr,0,6.28);ctx.fillStyle=`rgba(201,168,76,${p.a*(.8+.2*Math.sin(p.ph))})`;ctx.fill();
      }
      animId=requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize",resize);
    return () => { cancelAnimationFrame(animId); par.removeEventListener("mousemove",onMove); window.removeEventListener("resize",resize); };
  }, []);

  const { lang, setLang, t, LANGS } = useLang();

  return (
    <>
    {/* ── Custom cursor ── */}
    <div className={`cur-dot${hovering?' hovering':''}`} style={{transform:`translate(${cur.x-4}px,${cur.y-4}px)`}}/>
    <div className={`cur-ring${hovering?' hovering':''}`} style={{transform:`translate(${cur.x-18}px,${cur.y-18}px)`}}/>

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
              <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.75rem"}}>— Cadeau gratuit</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,lineHeight:1.2,marginBottom:"0.75rem",color:T.fg}}>
                Les 5 erreurs qui empêchent<br/><em style={{fontStyle:"italic",color:"#C9A84C"}}>tes résultats</em>
              </div>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:T.muted,lineHeight:1.7,marginBottom:"1.5rem"}}>
                Reçois notre guide gratuit par email et évite les pièges que font 90% des débutants.
              </p>
              <div style={{display:"flex",gap:1}}>
                <input type="email" value={popupEmail} onChange={e=>setPopupEmail(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handlePopupSubmit();}} placeholder="ton@email.com"
                  style={{flex:1,background:T.bg,border:`0.5px solid ${T.border}`,color:T.fg,fontFamily:"'Syne',sans-serif",fontSize:13,padding:"11px 14px",outline:"none",borderRadius:0}}/>
                <button onClick={handlePopupSubmit} disabled={popupLoading||!popupEmail.trim()}
                  style={{background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"0 18px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:popupEmail.trim()?"pointer":"not-allowed",flexShrink:0}}>
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
        @keyframes borderPulse{0%,100%{border-color:#242424}50%{border-color:#C9A84C}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes scanDown{0%{opacity:0;transform:translateY(-100%)}6%{opacity:.8}93%{opacity:.8}100%{opacity:0;transform:translateY(2000%)}}
        @keyframes shimmerSlide{0%{left:-100%}100%{left:200%}}
        @keyframes countPop{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes particleFloat{0%{transform:translateY(0) translateX(0);opacity:0.6}50%{transform:translateY(-20px) translateX(10px);opacity:1}100%{transform:translateY(0) translateX(0);opacity:0.6}}
        .scan-line-el{position:absolute;left:0;right:0;height:1px;background:linear-gradient(to right,transparent,rgba(201,168,76,.6),transparent);animation:scanDown 4s 1.2s ease both;pointer-events:none;z-index:10}
        .plan-card-shimmer{position:absolute;top:0;left:-100%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(201,168,76,.07),transparent);pointer-events:none;transition:left .8s ease}
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
        .stat-num{transition:transform 0.4s}
        .stat-box:hover .stat-num{transform:scale(1.06)}
        .step-box{transition:background 0.3s,transform 0.3s;cursor:default;position:relative;overflow:hidden}
        .step-box::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:#C9A84C;transform:scaleX(0);transition:transform 0.4s}
        .step-box:hover::after{transform:scaleX(1)}
        .step-box:hover .step-title{color:#E8C87A !important}
        .step-box:hover .step-num{opacity:0.15 !important}
        .plan-card{transition:all 0.4s cubic-bezier(0.2,0,0,1);cursor:pointer;position:relative;overflow:hidden}
        .plan-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);transform:scaleX(0);transition:transform 0.4s}
        .plan-card:hover{transform:translateY(-8px) !important;z-index:2}
        .plan-card:hover::before{transform:scaleX(1)}
        .plan-card:hover .plan-name{color:#E8C87A !important}
        .plan-card:hover .plan-price{transform:scale(1.05)}
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
        .theme-toggle{background:none;border:1px solid;border-color:inherit;padding:7px 10px;font-size:14px;cursor:pointer;transition:all 0.3s;border-radius:2px;line-height:1}
        .theme-toggle:hover{border-color:#C9A84C !important;transform:scale(1.1)}
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
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"20px 32px",borderBottom:`0.5px solid ${T.border}`,
        position:"sticky",top:0,background:T.bg,zIndex:100,
        backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>
        <div style={{fontSize:22,fontWeight:800,letterSpacing:5,animation:"glitch 4s ease infinite"}}>
          APXFIT<span style={{color:"#C9A84C"}}>NESS</span>
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
            background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",
            padding:"10px 24px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,
            letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
            {t.nav.cta}
          </button>
        </div>
      </nav>
      <div style={{height:1,background:"linear-gradient(90deg,transparent,#C9A84C,transparent)",animation:"lineGrow 1.5s ease 0.5s both",width:"100%"}}/>

      {/* ── Hero ── */}
      <section className="hero-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:"520px",borderBottom:`0.5px solid ${T.border}`}}>
        <div className="scan-line-el" />
        <div className="hero-left" style={{padding:"5rem 3rem",display:"flex",flexDirection:"column",justifyContent:"center",borderRight:`0.5px solid ${T.border}`}}>
          <div className="a1" style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"1.5rem"}}>{t.hero.tag}</div>
          <h1 className="a2 hero-title" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:72,fontWeight:600,lineHeight:0.95,marginBottom:"1.5rem"}}>
            {t.hero.title1}<br/>
            <em className="gold-text" style={{fontStyle:"italic",fontSize:64}}><span className="typewriter">{t.hero.title2}</span></em><br/>
            {t.hero.title3}
          </h1>
          <div style={{width:0,height:1,background:"linear-gradient(90deg,#C9A84C,transparent)",margin:"0.5rem 0 1.5rem",animation:"lineGrow 1s ease 1s both"}}/>
          <p className="a3" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:T.muted,lineHeight:1.7,maxWidth:380,marginBottom:"2.5rem"}}>{t.hero.sub}</p>
          <div className="a4 hero-btns" style={{display:"flex",gap:"1rem",alignItems:"center"}}>
            <button className="btn-primary" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})} style={{
              background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",
              padding:"14px 32px",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,
              letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
              {t.hero.cta1}
            </button>
            <button className="btn-ghost" onClick={()=>document.getElementById("methode").scrollIntoView({behavior:"smooth"})} style={{
              background:"none",border:"none",color:T.muted,fontFamily:"'Syne',sans-serif",
              fontSize:12,letterSpacing:"1px",cursor:"pointer",transition:"all 0.3s"}}>
              {t.hero.cta2}
            </button>
          </div>
        </div>
        <div className="hero-stats" style={{display:"grid",gridTemplateRows:"1fr 1fr",background:T.bg2,position:"relative",overflow:"hidden"}}>
          <video className="hero-video" autoPlay muted loop playsInline>
            <source src="/videos/v1.mp4" type="video/mp4"/>
          </video>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 50%,rgba(201,168,76,0.06),transparent 70%)",pointerEvents:"none",zIndex:1}}/>
          <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:2}} />
          <svg style={{position:"absolute",inset:0,opacity:0.03,width:"100%",height:"100%",zIndex:1}} viewBox="0 0 300 260" preserveAspectRatio="xMidYMid slice">
            <defs><pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#C9A84C" strokeWidth="0.5"/></pattern></defs>
            <rect width="300" height="260" fill="url(#g)"/>
          </svg>
          {[["100%",t.stats[0]],["+340",t.stats[1]]].map(([num,label],i)=>(
            <div key={i} className="stat-box a5" style={{padding:"2.5rem",borderBottom:i===0?`0.5px solid ${T.border2}`:"none",display:"flex",flexDirection:"column",justifyContent:"flex-end",background:"transparent",animationDelay:`${0.5+i*0.2}s`,position:"relative",zIndex:3}}>
              <div className="stat-num gold-text" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:80,fontWeight:600,lineHeight:1}}>{num}</div>
              <div style={{fontSize:11,letterSpacing:"3px",textTransform:"uppercase",color:"#888",marginTop:8}}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Strip ── */}
      <div className="reveal" style={{overflow:"hidden",borderBottom:`0.5px solid ${T.border}`,background:"#C9A84C",padding:"12px 0",position:"relative"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:40,background:"linear-gradient(90deg,#C9A84C,transparent)",zIndex:1}}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:40,background:"linear-gradient(270deg,#C9A84C,transparent)",zIndex:1}}/>
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
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.5rem"}}>{t.methode.tag}</div>
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
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C"}}>{t.methode.testimonials}</div>
          {t.methode.reviews.map(([quote,author])=>(
            <div key={author} style={{padding:"1.5rem",borderLeft:"3px solid #C9A84C"}}>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic",color:T.muted,lineHeight:1.7,marginBottom:"0.75rem"}}>{quote}</p>
              <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#C9A84C"}}>{author}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Chiffres clés ── */}
      <section className="reveal" style={{borderBottom:`0.5px solid ${T.border2}`,background:T.bg3}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:T.gap}}>
          {[
            {n:"+200",label:"Clients accompagnés",    color:"#C9A84C"},
            {n:"92%", label:"Objectif atteint 12 sem.",color:"#7AE07A"},
            {n:"4.9", label:"Note moyenne / 5",        color:"#5DCAA5"},
            {n:"48h", label:"Délai de livraison",      color:"#E8C87A"},
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
        <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"1.5rem"}}>{t.methode.testimonials}</div>
        {t.methode.reviews.map(([quote,author])=>(
          <div key={author} style={{padding:"1.25rem",borderLeft:"3px solid #C9A84C",marginBottom:"1rem"}}>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic",color:T.muted,lineHeight:1.7,marginBottom:"0.75rem"}}>{quote}</p>
            <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#C9A84C"}}>{author}</div>
          </div>
        ))}
      </section>

      {/* ── Galerie vidéo ── */}
      <VideoGallery />

      {/* ── Offres ── */}
      <section id="offres" className="section-pad reveal" style={{padding:"4rem 3rem",borderBottom:`0.5px solid ${T.border}`,
        background:`radial-gradient(ellipse at 50% 0%,rgba(201,168,76,0.06) 0%,${T.bg} 60%)`}}>
        <div style={{textAlign:"center",marginBottom:"3rem"}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.5rem"}}>{t.plans.tag}</div>
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
                border:`0.5px solid ${i===1?"#C9A84C":T.border}`,
                display:"flex",flexDirection:"column",position:"relative",
                borderTop:i===1?"2px solid #C9A84C":`0.5px solid ${T.border}`}}>
              <div className="plan-card-shimmer" />
              {i===1&&<div style={{position:"absolute",top:0,right:0,background:"#C9A84C",color:"#0A0A0A",
                fontSize:10,fontWeight:700,letterSpacing:"2px",padding:"5px 14px",textTransform:"uppercase"}}>{t.plans.popular}</div>}
              <div className="plan-name" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,
                color:i===1?"#E8C87A":T.fg,marginBottom:4,transition:"color 0.3s"}}>{name}</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:"1.5rem"}}>{t.plans.descs[i]}</div>
              <div className="plan-price" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:56,fontWeight:600,
                color:"#C9A84C",lineHeight:1,marginBottom:4,transition:"transform 0.3s"}}>{PLAN_PRICES[i]}€</div>
              <div style={{fontSize:11,letterSpacing:"1px",color:T.muted,marginBottom:"1.5rem"}}>{t.plans.period}</div>
              <div style={{flex:1,marginBottom:"2rem"}}>
                {t.plans.features[i].map((f,j)=>(
                  <div key={j} className="plan-feat-item" style={{display:"flex",alignItems:"flex-start",gap:10,
                    padding:"8px 0",borderBottom:`0.5px solid ${T.border}`,fontSize:13,color:i===1?"#888":T.muted,transition:"color 0.2s,padding 0.2s"}}>
                    <span style={{color:"#C9A84C"}}>·</span>{f}
                  </div>
                ))}
              </div>
              <button className="plan-btn" onClick={()=>router.push(`/bilan?plan=${name.toLowerCase()}&price=${PLAN_PRICES[i]}`)} style={{
                width:"100%",padding:"13px 0",
                background:i===1?"linear-gradient(135deg,#C9A84C,#A67C2E)":"transparent",
                border:`0.5px solid ${i===1?"#C9A84C":T.border}`,
                fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,
                letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
                <span className="plan-btn-text" style={{color:i===1?"#0A0A0A":T.muted}}>{t.plans.cta} {name}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section reveal" style={{padding:"5rem 3rem",textAlign:"center",background:"#C9A84C",position:"relative",overflow:"hidden"}}>
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

      {/* ── Footer enrichi ── */}
      <footer style={{borderTop:`0.5px solid ${T.border}`,background:T.bg2}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:"2rem",padding:"3rem",maxWidth:1200,margin:"0 auto"}}>
          {/* Colonne marque */}
          <div>
            <div style={{fontSize:20,fontWeight:800,letterSpacing:5,marginBottom:12}}>APXFIT<span style={{color:"#C9A84C"}}>NESS</span></div>
            <p style={{fontSize:12,color:T.muted,lineHeight:1.9,maxWidth:260,marginBottom:20}}>Coaching fitness personnalisé en ligne. Programmes musculation et nutrition 100% sur mesure générés par IA.</p>
            <a href="mailto:coach.apxfitness11@gmail.com" style={{fontSize:11,color:"#C9A84C",letterSpacing:"1px",textDecoration:"none",display:"flex",alignItems:"center",gap:6}}>
              <span>✉</span> coach.apxfitness11@gmail.com
            </a>
          </div>
          {/* Programmes */}
          <div>
            <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#888",marginBottom:16}}>Programmes</div>
            {[["Plan Starter — 49€","/bilan?plan=starter"],["Plan Forge — 129€","/bilan?plan=forge"],["Plan Elite — 249€","/bilan?plan=elite"],["Faire mon bilan","/bilan"]].map(([l,h])=>(
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

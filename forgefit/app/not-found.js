"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [count, setCount] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(timer); router.push("/"); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Syne:wght@400;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glitch{0%,90%,100%{transform:translate(0)}92%{transform:translate(-3px,1px)}94%{transform:translate(3px,-1px)}}
        .gold{background:linear-gradient(90deg,#C9A84C,#E8C87A,#F5D98A,#C9A84C);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.5s linear infinite}
        .a1{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both}
        .a2{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s both}
        .a3{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.5s both}
        .a4{animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.7s both}
        .btn:hover{transform:translateY(-3px) !important;box-shadow:0 12px 30px rgba(201,168,76,0.3) !important}
        .btn-ghost:hover{color:#E8C87A !important;border-color:#C9A84C !important}
      `}</style>

      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 32px",borderBottom:"0.5px solid #242424"}}>
        <div onClick={()=>router.push("/")} style={{fontSize:20,fontWeight:800,letterSpacing:5,cursor:"pointer",animation:"glitch 4s ease infinite"}}>
          APXFIT<span style={{color:"#C9A84C"}}>NESS</span>
        </div>
        <button onClick={()=>router.push("/")} style={{background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"10px 24px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
          Retour →
        </button>
      </nav>

      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
        <div style={{textAlign:"center",maxWidth:600}}>
          <div className="a1" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(100px,20vw,180px)",fontWeight:600,lineHeight:1,marginBottom:"0.5rem"}}>
            <span className="gold">4</span>
            <span style={{color:"#1A1A1A"}}>0</span>
            <span className="gold">4</span>
          </div>

          <div className="a2" style={{width:60,height:1,background:"linear-gradient(90deg,transparent,#C9A84C,transparent)",margin:"0 auto 1.5rem"}} />
          <div className="a2" style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"1rem"}}>— Page introuvable</div>

          <h1 className="a3" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,5vw,42px)",fontWeight:600,lineHeight:1.2,marginBottom:"1rem"}}>
            Cette page n'existe<br/><em style={{fontStyle:"italic",color:"#555"}}>pas encore.</em>
          </h1>

          <p className="a3" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#555",lineHeight:1.7,marginBottom:"2.5rem"}}>
            La page que tu cherches a été déplacée, supprimée ou n'a jamais existé.
          </p>

          <div className="a4" style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:"3rem"}}>
            <button className="btn" onClick={()=>router.push("/")} style={{background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"14px 32px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",transition:"all 0.3s"}}>
              Retour à l'accueil →
            </button>
            <button className="btn-ghost" onClick={()=>router.push("/#offres")} style={{background:"transparent",border:"0.5px solid #242424",color:"#555",padding:"14px 32px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",transition:"all 0.3s"}}>
              Voir les plans
            </button>
          </div>

          <div className="a4" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
            <svg width="36" height="36" viewBox="0 0 36 36" style={{transform:"rotate(-90deg)"}}>
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1A1A1A" strokeWidth="2"/>
              <circle cx="18" cy="18" r="15" fill="none" stroke="#C9A84C" strokeWidth="2"
                strokeDasharray="94"
                strokeDashoffset={94 - (94 * count / 10)}
                style={{transition:"stroke-dashoffset 1s linear"}}/>
            </svg>
            <span style={{fontSize:12,color:"#333",letterSpacing:"2px",textTransform:"uppercase"}}>
              Redirection dans <strong style={{color:"#C9A84C"}}>{count}s</strong>
            </span>
          </div>
        </div>
      </div>

      <footer style={{padding:"1.5rem 2rem",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"0.5px solid #242424"}}>
        <div style={{fontSize:15,fontWeight:800,letterSpacing:5}}>APXFIT<span style={{color:"#C9A84C"}}>NESS</span></div>
        <div style={{fontSize:11,letterSpacing:"2px",color:"#333",textTransform:"uppercase"}}>© 2026 APXFITNESS</div>
      </footer>
    </div>
  );
}

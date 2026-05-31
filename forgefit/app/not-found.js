"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  const [count, setCount] = useState(10);

  // Compte à rebours avant redirection
  useEffect(() => {
    if (count <= 0) { router.push("/"); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, router]);

  const links = [
    { label: "Accueil",      href: "/",           icon: "🏠" },
    { label: "Mon programme",href: "/bilan",       icon: "⚡" },
    { label: "Blog",         href: "/blog",        icon: "📖" },
    { label: "Calculateur",  href: "/calculateur", icon: "🔢" },
    { label: "FAQ",          href: "/faq",         icon: "💬" },
    { label: "À propos",     href: "/a-propos",    icon: "👤" },
  ];

  return (
    <div style={{
      background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",
      fontFamily:"'Syne',sans-serif",display:"flex",
      flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:"2rem",textAlign:"center",position:"relative",overflow:"hidden",
    }}>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lineGrow{from{width:0}to{width:100%}}
        .a1{animation:fadeUp 0.4s ease 0.1s both}
        .a2{animation:fadeUp 0.4s ease 0.2s both}
        .a3{animation:fadeUp 0.4s ease 0.35s both}
        .a4{animation:fadeUp 0.4s ease 0.5s both}
        .a5{animation:fadeUp 0.4s ease 0.65s both}
        .link-card{background:#111;border:0.5px solid #1A1A1A;padding:14px 18px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:10px;text-align:left}
        .link-card:hover{border-color:#C9A84C;background:#131313;transform:translateX(3px)}
      `}</style>

      {/* Fond décoratif */}
      <div style={{
        position:"absolute",inset:0,
        background:"radial-gradient(ellipse at 50% 40%,rgba(201,168,76,0.04) 0%,transparent 60%)",
        pointerEvents:"none",
      }}/>

      {/* 404 géant */}
      <div className="a1" style={{
        fontFamily:"'Cormorant Garamond',serif",
        fontSize:"clamp(100px,20vw,180px)",fontWeight:600,lineHeight:1,
        color:"#1A1A1A",position:"absolute",top:"50%",left:"50%",
        transform:"translate(-50%,-50%)",
        userSelect:"none",pointerEvents:"none",zIndex:0,
      }}>404</div>

      {/* Contenu */}
      <div style={{position:"relative",zIndex:1,maxWidth:480,width:"100%"}}>

        <div className="a1" style={{
          fontSize:10,letterSpacing:"4px",textTransform:"uppercase",
          color:"#C9A84C",marginBottom:"1rem",
        }}>— Page introuvable</div>

        <h1 className="a2" style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:"clamp(32px,5vw,52px)",fontWeight:600,
          lineHeight:1.1,marginBottom:"1rem",
        }}>
          Cette page a<br/>
          <em style={{fontStyle:"italic",color:"#C9A84C"}}>pris sa retraite.</em>
        </h1>

        <div className="a2" style={{
          width:48,height:1,
          background:"linear-gradient(90deg,#C9A84C,transparent)",
          margin:"0 auto 1.5rem",
        }}/>

        <p className="a3" style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:17,color:"#555",lineHeight:1.9,marginBottom:"2rem",
        }}>
          La page que tu cherches n'existe pas ou a été déplacée.
          Redirection automatique dans <strong style={{color:"#C9A84C"}}>{count}s</strong>.
        </p>

        {/* Barre de progression du compte à rebours */}
        <div className="a3" style={{
          height:2,background:"#1A1A1A",borderRadius:2,marginBottom:"2.5rem",
          overflow:"hidden",
        }}>
          <div style={{
            height:"100%",background:"linear-gradient(90deg,#C9A84C,#E8C87A)",
            borderRadius:2,
            width:`${((10-count)/10)*100}%`,
            transition:"width 1s linear",
          }}/>
        </div>

        {/* CTA principal */}
        <div className="a4" style={{marginBottom:"2rem",display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>router.push("/")} style={{
            background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",
            color:"#0A0A0A",padding:"14px 32px",fontFamily:"'Syne',sans-serif",
            fontSize:12,fontWeight:700,letterSpacing:"2px",
            textTransform:"uppercase",cursor:"pointer",
          }}>
            Retour à l'accueil
          </button>
          <button onClick={()=>router.push("/bilan")} style={{
            background:"transparent",border:"0.5px solid #242424",color:"#555",
            padding:"14px 24px",fontFamily:"'Syne',sans-serif",fontSize:12,
            letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",
            transition:"all 0.2s",
          }}>
            Démarrer un bilan →
          </button>
        </div>

        {/* Liens rapides */}
        <div className="a5">
          <div style={{
            fontSize:9,letterSpacing:"3px",textTransform:"uppercase",
            color:"#333",marginBottom:"1rem",
          }}>Ou va directement vers</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {links.map(link => (
              <div key={link.href} className="link-card"
                onClick={()=>router.push(link.href)}>
                <span style={{fontSize:16,flexShrink:0}}>{link.icon}</span>
                <span style={{fontSize:11,color:"#888",letterSpacing:"1.5px",textTransform:"uppercase"}}>{link.label}</span>
                <span style={{marginLeft:"auto",color:"#333",fontSize:11}}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logo bas */}
      <div style={{
        position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",
        fontSize:14,fontWeight:800,letterSpacing:4,color:"#1A1A1A",
        cursor:"pointer",
      }} onClick={()=>router.push("/")}>
        APXFIT<span style={{color:"#242424"}}>NESS</span>
      </div>
    </div>
  );
}

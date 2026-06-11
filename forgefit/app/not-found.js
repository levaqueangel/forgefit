"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./useLang";

const T = {
  fr: { tag:"— Page introuvable", title:"Cette page a", subtitle:"pris sa retraite.", desc:"La page que tu cherches n existe pas ou a été déplacée. Redirection dans", btn_home:"Retour à l accueil", btn_bilan:"Démarrer un bilan →", shortcuts_label:"Ou va directement vers", links:[["🏠","Accueil","/"],["⚡","Mon programme","/bilan"],["📖","Blog","/blog"],["🔢","Calculateur","/calculateur"],["💬","FAQ","/faq"],["👤","À propos","/a-propos"]] },
  en: { tag:"— Page not found",  title:"This page has", subtitle:"retired.", desc:"The page you are looking for does not exist or has been moved. Redirecting in", btn_home:"Back to home", btn_bilan:"Start assessment →", shortcuts_label:"Or go directly to", links:[["🏠","Home","/"],["⚡","My programme","/bilan"],["📖","Blog","/blog"],["🔢","Calculator","/calculateur"],["💬","FAQ","/faq"],["👤","About","/a-propos"]] },
  de: { tag:"— Seite nicht gefunden", title:"Diese Seite ist", subtitle:"nicht mehr da.", desc:"Die gesuchte Seite existiert nicht oder wurde verschoben. Weiterleitung in", btn_home:"Zurück zur Startseite", btn_bilan:"Assessment starten →", shortcuts_label:"Oder direkt zu", links:[["🏠","Startseite","/"],["⚡","Mein Programm","/bilan"],["📖","Blog","/blog"],["🔢","Rechner","/calculateur"],["💬","FAQ","/faq"],["👤","Über uns","/a-propos"]] },
  es: { tag:"— Página no encontrada", title:"Esta página se ha", subtitle:"jubilado.", desc:"La página que buscas no existe o se ha movido. Redirigiendo en", btn_home:"Volver al inicio", btn_bilan:"Iniciar evaluación →", shortcuts_label:"O ir directamente a", links:[["🏠","Inicio","/"],["⚡","Mi programa","/bilan"],["📖","Blog","/blog"],["🔢","Calculadora","/calculateur"],["💬","FAQ","/faq"],["👤","Acerca de","/a-propos"]] },
};

export default function NotFound() {
  const router = useRouter();
  const { lang } = useLang();
  const t = T[lang] || T.fr;
  const [count, setCount] = useState(10);

  useEffect(() => {
    if (count <= 0) { router.push("/"); return; }
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, router]);

  return (
    <div style={{ background:"#0A0A0A", color:"#F0EDE8", minHeight:"100vh",
      fontFamily:"'Syne',sans-serif", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:"2rem",
      textAlign:"center", position:"relative", overflow:"hidden" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .link-card{background:#111;border:0.5px solid #1A1A1A;padding:14px 18px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:10}
        .link-card:hover{border-color:#E8B000;background:#131313;transform:translateX(3px)}
        .a1{animation:fadeUp 0.4s ease 0.1s both}.a2{animation:fadeUp 0.4s ease 0.2s both}
        .a3{animation:fadeUp 0.4s ease 0.35s both}.a4{animation:fadeUp 0.4s ease 0.5s both}.a5{animation:fadeUp 0.4s ease 0.65s both}
      `}</style>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 40%,rgba(232,176,0,0.04) 0%,transparent 60%)", pointerEvents:"none" }}/>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(100px,20vw,180px)", fontWeight:600, lineHeight:1, color:"#1A1A1A", position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", userSelect:"none", pointerEvents:"none", zIndex:0 }}>404</div>
      <div style={{ position:"relative", zIndex:1, maxWidth:480, width:"100%" }}>
        <div className="a1" style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:"1rem" }}>{t.tag}</div>
        <h1 className="a2" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(32px,5vw,52px)", fontWeight:600, lineHeight:1.1, marginBottom:"1rem" }}>
          {t.title}<br/><em style={{ fontStyle:"italic", color:"#E8B000" }}>{t.subtitle}</em>
        </h1>
        <p className="a3" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#555", lineHeight:1.9, marginBottom:"1.5rem" }}>
          {t.desc} <strong style={{ color:"#E8B000" }}>{count}s</strong>.
        </p>
        <div className="a3" style={{ height:2, background:"#1A1A1A", borderRadius:2, marginBottom:"2.5rem", overflow:"hidden" }}>
          <div style={{ height:"100%", background:"linear-gradient(90deg,#E8B000,#F5C832)", borderRadius:2, width:`${((10-count)/10)*100}%`, transition:"width 1s linear" }}/>
        </div>
        <div className="a4" style={{ marginBottom:"2rem", display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={() => router.push("/")} style={{ background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none", color:"#0A0A0A", padding:"14px 32px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer" }}>
            {t.btn_home}
          </button>
          <button onClick={() => router.push("/bilan")} style={{ background:"transparent", border:"0.5px solid #242424", color:"#555", padding:"14px 24px", fontFamily:"'Syne',sans-serif", fontSize:12, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer" }}>
            {t.btn_bilan}
          </button>
        </div>
        <div className="a5">
          <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#333", marginBottom:"1rem" }}>{t.shortcuts_label}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {t.links.map(([icon, label, href]) => (
              <div key={href} className="link-card" onClick={() => router.push(href)}>
                <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
                <span style={{ fontSize:11, color:"#888", letterSpacing:"1.5px", textTransform:"uppercase" }}>{label}</span>
                <span style={{ marginLeft:"auto", color:"#333", fontSize:11 }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

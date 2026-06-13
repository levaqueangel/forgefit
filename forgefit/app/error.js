"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div style={{ background:"#0A0A0A", color:"#F0EDE8", minHeight:"100vh",
      fontFamily:"'Syne',sans-serif", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:"2rem",
      textAlign:"center", position:"relative", overflow:"hidden" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .a1{animation:fadeUp 0.4s ease 0.1s both}
        .a2{animation:fadeUp 0.4s ease 0.2s both}
        .a3{animation:fadeUp 0.4s ease 0.35s both}
        .a4{animation:fadeUp 0.4s ease 0.5s both}
      `}</style>

      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 40%,rgba(232,176,0,0.04),transparent 60%)", pointerEvents:"none" }}/>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(100px,20vw,180px)", fontWeight:600, lineHeight:1, color:"#1A1A1A", position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", userSelect:"none", pointerEvents:"none" }}>500</div>

      <div style={{ position:"relative", zIndex:1, maxWidth:480, width:"100%" }}>
        <div className="a1" style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:"1rem" }}>— Erreur inattendue</div>

        <h1 className="a2" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,5vw,46px)", fontWeight:600, lineHeight:1.15, marginBottom:"1rem" }}>
          Quelque chose s'est<br/><em style={{ fontStyle:"italic", color:"#E8B000" }}>mal passé.</em>
        </h1>

        <p className="a3" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#555", lineHeight:1.9, marginBottom:"2rem" }}>
          Une erreur s'est produite de notre côté. Tu n'as rien fait de mal — réessaie dans quelques secondes.
        </p>

        <div className="a4" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={() => reset()} style={{
            background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none", color:"#0A0A0A",
            padding:"14px 32px", fontFamily:"'Syne',sans-serif", fontSize:12,
            fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer",
          }}>
            Réessayer →
          </button>
          <button onClick={() => router.push("/")} style={{
            background:"transparent", border:"0.5px solid #242424", color:"#555",
            padding:"14px 24px", fontFamily:"'Syne',sans-serif", fontSize:12,
            letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer",
          }}>
            Retour à l'accueil
          </button>
        </div>

        <div style={{ marginTop:"2rem", fontSize:11, color:"#2A2A2A", fontFamily:"monospace", letterSpacing:"0.5px" }}>
          {error?.message || "Une erreur inattendue s'est produite."}
        </div>
      </div>
    </div>
  );
}

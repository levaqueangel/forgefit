import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "APXFITNESS — Coaching Fitness Personnalise";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#0A0A0A", fontFamily:"sans-serif", position:"relative" }}>
      {/* Background gradient */}
      <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(232,176,0,0.12) 0%, transparent 70%)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", display:"flex" }}/>
      {/* Logo */}
      <div style={{ fontSize:72, fontWeight:900, letterSpacing:12, color:"#F0EDE8", marginBottom:16, display:"flex" }}>
        APXFIT<span style={{ color:"#E8B000" }}>NESS</span>
      </div>
      {/* Tagline */}
      <div style={{ fontSize:24, color:"#555", letterSpacing:4, textTransform:"uppercase", marginBottom:40, display:"flex" }}>
        Coaching Fitness Personnalisé
      </div>
      {/* 3 piliers */}
      <div style={{ display:"flex", gap:32 }}>
        {["Programme Sur Mesure", "Nutrition Calculée", "Résultats Prouvés"].map((label) => (
          <div key={label} style={{ background:"rgba(232,176,0,0.08)", border:"0.5px solid rgba(232,176,0,0.3)", padding:"12px 24px", display:"flex" }}>
            <span style={{ fontSize:13, color:"#E8B000", letterSpacing:2, textTransform:"uppercase" }}>{label}</span>
          </div>
        ))}
      </div>
      {/* URL */}
      <div style={{ position:"absolute", bottom:32, fontSize:14, color:"#333", letterSpacing:2, display:"flex" }}>
        {(process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app").replace("https://", "")}
      </div>
    </div>,
    { ...size }
  );
}

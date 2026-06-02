"use client";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();
  return (
    <div style={{ background:"#0A0A0A", color:"#F0EDE8", minHeight:"100vh",
      fontFamily:"'Syne',sans-serif", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", textAlign:"center", padding:"2rem" }}>
      <div style={{ fontSize:48, marginBottom:"1.5rem" }}>📡</div>
      <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase",
        color:"#C9A84C", marginBottom:"1rem" }}>— Hors connexion</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:44,
        fontWeight:600, lineHeight:1.1, marginBottom:"1.5rem" }}>
        Pas de connexion<br/>
        <em style={{ fontStyle:"italic", color:"#555" }}>pour le moment.</em>
      </div>
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17,
        color:"#555", lineHeight:1.9, maxWidth:420, marginBottom:"2rem" }}>
        Tu peux toujours accéder aux pages que tu as déjà visitées.
        Ton programme et tes mesures sont disponibles hors ligne.
      </p>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
        <button onClick={() => router.push("/client")} style={{
          background:"linear-gradient(135deg,#C9A84C,#A67C2E)", border:"none",
          color:"#0A0A0A", padding:"14px 32px", fontFamily:"'Syne',sans-serif",
          fontSize:12, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer" }}>
          Mon espace →
        </button>
        <button onClick={() => router.refresh()} style={{
          background:"transparent", border:"0.5px solid #242424", color:"#555",
          padding:"14px 24px", fontFamily:"'Syne',sans-serif", fontSize:12,
          letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer" }}>
          Réessayer
        </button>
      </div>
    </div>
  );
}

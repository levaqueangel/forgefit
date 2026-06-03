"use client";
import { useRouter } from "next/navigation";
import { useLang } from "../useLang";

const T = {
  fr: { tag:"— Hors connexion", title:"Pas de connexion", subtitle:"pour le moment.", desc:"Tu peux toujours accéder aux pages déjà visitées. Ton programme et tes mesures sont disponibles hors ligne.", btn_space:"Mon espace →", btn_retry:"Réessayer" },
  en: { tag:"— Offline",       title:"No connection",    subtitle:"right now.",        desc:"You can still access pages you already visited. Your programme and measurements are available offline.", btn_space:"My space →", btn_retry:"Retry" },
  de: { tag:"— Offline",       title:"Keine Verbindung", subtitle:"gerade.",           desc:"Du kannst Seiten aufrufen, die du bereits besucht hast. Dein Programm ist offline verfügbar.", btn_space:"Mein Bereich →", btn_retry:"Erneut versuchen" },
  es: { tag:"— Sin conexión",  title:"Sin conexión",     subtitle:"por ahora.",        desc:"Puedes acceder a las páginas que ya has visitado. Tu programa está disponible sin conexión.", btn_space:"Mi espacio →", btn_retry:"Reintentar" },
};

export default function OfflinePage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = T[lang] || T.fr;
  return (
    <div style={{ background:"#0A0A0A", color:"#F0EDE8", minHeight:"100vh",
      fontFamily:"'Syne',sans-serif", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", textAlign:"center", padding:"2rem" }}>
      <div style={{ fontSize:48, marginBottom:"1.5rem" }}>📡</div>
      <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#C9A84C", marginBottom:"1rem" }}>{t.tag}</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:44, fontWeight:600, lineHeight:1.1, marginBottom:"1.5rem" }}>
        {t.title}<br/><em style={{ fontStyle:"italic", color:"#555" }}>{t.subtitle}</em>
      </div>
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#555", lineHeight:1.9, maxWidth:420, marginBottom:"2rem" }}>
        {t.desc}
      </p>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
        <button onClick={() => router.push("/client")} style={{ background:"linear-gradient(135deg,#C9A84C,#A67C2E)", border:"none", color:"#0A0A0A", padding:"14px 32px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer" }}>
          {t.btn_space}
        </button>
        <button onClick={() => router.refresh()} style={{ background:"transparent", border:"0.5px solid #242424", color:"#555", padding:"14px 24px", fontFamily:"'Syne',sans-serif", fontSize:12, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer" }}>
          {t.btn_retry}
        </button>
      </div>
    </div>
  );
}

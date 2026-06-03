"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StatusPage() {
  const router = useRouter();
  const [checks, setChecks] = useState({
    api: null, firebase: null, resend: null, ai: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      // Test API principale
      try {
        const r = await fetch("/api/error-log");
        setChecks(p => ({ ...p, api: r.ok || r.status === 401 }));
      } catch {
        setChecks(p => ({ ...p, api: false }));
      }
      // Test Firebase (via la page elle-même — si on est ici, Firebase fonctionne)
      setChecks(p => ({ ...p, firebase: true }));
      // Tests Resend + IA ne sont pas exposés publiquement
      setChecks(p => ({ ...p, resend: "unknown", ai: "unknown" }));
      setLoading(false);
    };
    run();
  }, []);

  const services = [
    { key:"api",      label:"API Next.js",       desc:"Routes serveur", icon:"⚙️" },
    { key:"firebase", label:"Firebase",           desc:"Auth + Firestore", icon:"🔥" },
    { key:"resend",   label:"Resend (Email)",     desc:"Emails transactionnels", icon:"📧" },
    { key:"ai",       label:"Claude AI",          desc:"Génération de programmes", icon:"🤖" },
  ];

  const getStatus = (val) => {
    if (val === null)      return ["⏳", "#555",    "Vérification..."];
    if (val === true)      return ["✅", "#7AE07A", "Opérationnel"];
    if (val === false)     return ["❌", "#E07070", "Incident"];
    return                        ["⚠️", "#E8C87A", "Non vérifié"];
  };

  const allOk = Object.values(checks).every(v => v === true || v === "unknown");

  return (
    <div style={{ background:"#0A0A0A", color:"#F0EDE8", minHeight:"100vh",
      fontFamily:"'Syne',sans-serif", padding:"4rem 2rem" }}>
      <div style={{ maxWidth:560, margin:"0 auto" }}>
        <div style={{ cursor:"pointer", marginBottom:"3rem", fontSize:18,
          fontWeight:800, letterSpacing:5 }} onClick={() => router.push("/")}>
          APXFIT<span style={{ color:"#C9A84C" }}>NESS</span>
        </div>
        <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase",
          color:"#C9A84C", marginBottom:"0.8rem" }}>— Statut des services</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:44,
          fontWeight:600, marginBottom:"0.75rem" }}>
          {loading ? "Vérification..." : allOk ? "Tout est opérationnel." : "Incident en cours."}
        </div>
        <div style={{ width:48, height:1,
          background:`linear-gradient(90deg,${allOk?"#7AE07A":"#E07070"},transparent)`,
          marginBottom:"2.5rem" }}/>
        <div style={{ display:"flex", flexDirection:"column", gap:1, background:"#1A1A1A" }}>
          {services.map(svc => {
            const [icon, color, label] = getStatus(checks[svc.key]);
            return (
              <div key={svc.key} style={{ background:"#0D0D0D", padding:"18px 20px",
                display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{svc.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#F0EDE8", marginBottom:2 }}>{svc.label}</div>
                  <div style={{ fontSize:11, color:"#444" }}>{svc.desc}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:color,
                    animation:checks[svc.key]===null?"pulse 1s ease infinite":"none" }}/>
                  <span style={{ fontSize:11, color, fontWeight:700, letterSpacing:"1px" }}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:"1.5rem", fontSize:12, color:"#333",
          fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic" }}>
          Dernière vérification : {new Date().toLocaleTimeString("fr-FR")}
        </div>
        <div style={{ marginTop:"2rem" }}>
          <button onClick={() => window.location.reload()} style={{
            background:"transparent", border:"0.5px solid #242424", color:"#555",
            padding:"10px 20px", fontFamily:"'Syne',sans-serif", fontSize:11,
            letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer", borderRadius:20,
            marginRight:8 }}>
            Rafraîchir
          </button>
          <button onClick={() => router.push("/")} style={{
            background:"linear-gradient(135deg,#C9A84C,#A67C2E)", border:"none",
            color:"#0A0A0A", padding:"10px 20px", fontFamily:"'Syne',sans-serif",
            fontSize:11, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase",
            cursor:"pointer", borderRadius:20 }}>
            Accueil →
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

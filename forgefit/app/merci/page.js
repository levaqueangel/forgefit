"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Composant interne qui utilise useSearchParams
function MerciContent() {
  const router = useRouter();
  const params = useSearchParams();
  const plan   = params.get("plan") || "forge";
  const prenom = params.get("prenom") || "";
  const email  = params.get("email") || "";
  const [step, setStep] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStep(s => { if (s >= 3) { clearInterval(intervalRef.current); return s; } return s + 1; });
    }, 600);
    return () => clearInterval(intervalRef.current);
  }, []);

  const PLAN_COLORS = { starter: "#7AE07A", forge: "#C9A84C", elite: "#E8C87A" };
  const planColor = PLAN_COLORS[plan.toLowerCase()] || "#C9A84C";
  const planName  = plan.charAt(0).toUpperCase() + plan.slice(1);

  const STEPS = [
    { icon: "✓",  label: "Paiement confirme",        desc: "Ta commande est enregistree.",                                color: "#7AE07A" },
    { icon: "⚡", label: "Programme en generation",   desc: "L IA calibre ton programme sur mesure.",                     color: "#C9A84C" },
    { icon: "📧", label: "Email envoye",              desc: `Tes identifiants arrivent sur ${email || "ton email"}.`,    color: "#5DCAA5" },
    { icon: "🚀", label: "Ton espace est pret",       desc: "Tu peux acceder a ton programme des maintenant.",            color: "#E8C87A" },
  ];

  return (
    <div style={{
      background: "#0A0A0A", color: "#F0EDE8", minHeight: "100vh",
      fontFamily: "'Syne',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "2rem", textAlign: "center", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.7) } to { opacity:1; transform:scale(1) } }
        @keyframes spin { to { transform:rotate(360deg) } }
        .a1 { animation:fadeUp 0.5s ease 0.1s both }
        .a2 { animation:fadeUp 0.5s ease 0.3s both }
        .a3 { animation:fadeUp 0.5s ease 0.5s both }
        .a4 { animation:fadeUp 0.5s ease 0.7s both }
        .btn-cta { background:linear-gradient(135deg,#C9A84C,#A67C2E); border:none; color:#0A0A0A; padding:16px 40px; font-family:'Syne',sans-serif; font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase; cursor:pointer }
        .btn-sec { background:transparent; border:0.5px solid #242424; color:#555; padding:14px 28px; font-family:'Syne',sans-serif; font-size:12px; letter-spacing:2px; text-transform:uppercase; cursor:pointer }
      `}</style>

      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 30%, rgba(${planColor==="#7AE07A"?"122,224,122":planColor==="#C9A84C"?"201,168,76":"232,200,122"},0.06) 0%, transparent 60%)`, pointerEvents:"none" }}/>

      <div style={{ position:"relative", zIndex:1, maxWidth:540, width:"100%" }}>
        <div className="a1" style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:"2rem",
          background:`rgba(${planColor==="#7AE07A"?"122,224,122":planColor==="#C9A84C"?"201,168,76":"232,200,122"},0.1)`,
          border:`0.5px solid ${planColor}`, padding:"6px 18px" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:planColor }}/>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:planColor }}>
            Plan {planName} — Active
          </span>
        </div>

        <div className="a2" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(36px,6vw,60px)", fontWeight:600, lineHeight:1.05, marginBottom:"0.75rem" }}>
          {prenom ? `Bienvenue ${prenom} !` : "Bienvenue !"}<br/>
          <em style={{ fontStyle:"italic", color:planColor }}>C est parti.</em>
        </div>

        <div className="a2" style={{ width:48, height:1, background:`linear-gradient(90deg,${planColor},transparent)`, margin:"0 auto 1.5rem" }}/>

        <p className="a3" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#555", lineHeight:1.9, marginBottom:"2.5rem" }}>
          Ton achat est confirme. Voici ce qui se passe maintenant.
        </p>

        <div className="a3" style={{ background:"#0D0D0D", border:"0.5px solid #1A1A1A", padding:"6px 20px", marginBottom:"2.5rem", textAlign:"left" }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:16, padding:"14px 0", borderBottom:i<3?"0.5px solid #111":"none", opacity: step > i ? 1 : 0.2, transition:"opacity 0.4s" }}>
              <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0,
                background: step > i ? `rgba(${s.color==="#7AE07A"?"122,224,122":s.color==="#C9A84C"?"201,168,76":s.color==="#5DCAA5"?"93,202,165":"232,200,122"},0.12)` : "rgba(255,255,255,0.03)",
                border: `1.5px solid ${step > i ? s.color : "#1A1A1A"}`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, transition:"all 0.4s",
              }}>
                {step > i ? s.icon : i === step ? <div style={{ width:12, height:12, border:`2px solid ${s.color}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/> : <div style={{ width:8, height:8, borderRadius:"50%", background:"#1A1A1A" }}/>}
              </div>
              <div style={{ paddingTop:4 }}>
                <div style={{ fontSize:13, fontWeight:700, color: step > i ? "#F0EDE8" : "#333", marginBottom:2 }}>{s.label}</div>
                <div style={{ fontSize:12, color: step > i ? "#555" : "#222" }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="a4" style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginBottom:"3rem" }}>
          <button className="btn-cta" onClick={() => router.push("/client")}>Acceder a mon espace →</button>
          <button className="btn-sec" onClick={() => router.push("/bilan")}>Completer mon bilan</button>
        </div>

        <div className="a4" style={{ background:"rgba(255,255,255,0.02)", border:"0.5px solid #1A1A1A", padding:"16px 20px", textAlign:"left" }}>
          <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#444", marginBottom:12 }}>Recapitulatif</div>
          {[["Plan", planName, planColor], ["Email", email||"—", "#F0EDE8"], ["Acces", "Immediat via /client", "#7AE07A"], ["Support", "levaqueangel@gmail.com", "#555"]].map(([k,v,c]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:11, color:"#444", letterSpacing:"1px", textTransform:"uppercase" }}>{k}</span>
              <span style={{ fontSize:12, color:c, fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Wrapper avec Suspense requis par Next.js 14 pour useSearchParams
export default function MerciPage() {
  return (
    <Suspense fallback={
      <div style={{ background:"#0A0A0A", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:20, height:20, border:"2px solid rgba(201,168,76,0.2)", borderTopColor:"#C9A84C", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
      </div>
    }>
      <MerciContent />
    </Suspense>
  );
}

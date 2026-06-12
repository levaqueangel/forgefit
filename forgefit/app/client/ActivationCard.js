"use client";
import { useState, useEffect, useRef } from "react";

// ── Carte d'activation 14 jours ──────────────────────────────────────────────
// Levier anti-churn n°1 du secteur : un client qui fait <3 séances sur ses
// 14 premiers jours churn 3-4× plus. Cette carte pousse activement vers 3 séances
// pendant la fenêtre d'activation, puis disparaît (succès ou fenêtre écoulée).

const TARGET = 3;
const WINDOW_DAYS = 14;
const SUCCESS_KEY = "activation-14j-celebrated";

const STYLES = `
  @keyframes act-in { from { opacity:0; transform:translateY(12px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes act-glow { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
  @keyframes act-fill { from { transform:scaleX(0); } to { transform:scaleX(1); } }
  @keyframes act-pop { 0% { transform:scale(0.7); opacity:0; } 60% { transform:scale(1.12); } 100% { transform:scale(1); opacity:1; } }
`;

export function ActivationCard({ clientData }) {
  const [mounted, setMounted] = useState(false);
  const celebrated = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !clientData?.createdAt) return null;

  const start = new Date(clientData.createdAt).getTime();
  if (!start) return null;

  const now = Date.now();
  const windowEnd = start + WINDOW_DAYS * 86400000;
  const dayNumber = Math.floor((now - start) / 86400000) + 1;

  // Compte les séances réellement loggées dans la fenêtre d'activation
  const hist = Array.isArray(clientData.seanceHistorique) ? clientData.seanceHistorique : [];
  const done = hist.filter(s => {
    const t = s?.dateTs || (s?.date ? Date.parse(s.date) : NaN);
    return t >= start && t <= windowEnd;
  }).length;

  // Fenêtre écoulée → on n'affiche plus rien
  if (dayNumber > WINDOW_DAYS) return null;

  const remaining = Math.max(0, TARGET - done);
  const daysLeft = Math.max(0, Math.ceil((windowEnd - now) / 86400000));
  const success = done >= TARGET;

  // ── État succès : on félicite une seule fois ──
  if (success) {
    let alreadySeen = false;
    try { alreadySeen = localStorage.getItem(SUCCESS_KEY) === "1"; } catch {}
    if (alreadySeen) return null;
    if (!celebrated.current) {
      celebrated.current = true;
      try { localStorage.setItem(SUCCESS_KEY, "1"); } catch {}
    }
    return (
      <>
        <style>{STYLES}</style>
        <div style={{
          animation: "act-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
          position: "relative", borderRadius: 16, overflow: "hidden",
          border: "1px solid rgba(122,224,122,0.35)",
          background: "linear-gradient(135deg,#0D0D0D 0%,#0C140C 100%)",
          padding: "18px 20px",
        }}>
          <div style={{ position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,#7AE07A,transparent)",animation:"act-glow 2.5s ease infinite" }}/>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ fontSize:30,animation:"act-pop 0.5s 0.2s both" }}>🔥</div>
            <div>
              <div style={{ fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#7AE07A",marginBottom:4 }}>Activation réussie</div>
              <div style={{ fontSize:16,fontWeight:800,color:"#F0EDE8",fontFamily:"'Syne',sans-serif",lineHeight:1.3 }}>
                3 séances en 2 semaines — tu es lancé.
              </div>
              <div style={{ fontSize:12,color:"#666",marginTop:4,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic" }}>
                C'est exactement comme ça que les résultats arrivent. Continue sur ta lancée.
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── État progression : pousse vers les 3 séances ──
  const urgent = daysLeft <= 4;
  const accent = urgent ? "#E8B000" : "#E8B000";

  const goToSeances = () => {
    document.getElementById("dash-seances")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <style>{STYLES}</style>
      <div style={{
        animation: "act-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
        position: "relative", borderRadius: 16, overflow: "hidden",
        border: "1px solid rgba(232,176,0,0.3)",
        background: "linear-gradient(135deg,#0D0D0D 0%,#111008 100%)",
      }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,#E8B000,#F5C832,#E8B000,transparent)",animation:"act-glow 2.5s ease infinite" }}/>

        <div style={{ padding:"16px 18px 18px" }}>
          {/* Header */}
          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14,gap:12 }}>
            <div>
              <span style={{
                fontSize:9,fontWeight:800,letterSpacing:"2px",textTransform:"uppercase",color:"#0A0A0A",
                background:"linear-gradient(135deg,#E8B000,#F5C832)",padding:"3px 8px",borderRadius:20,display:"inline-block",marginBottom:8,
              }}>
                Défi des 14 jours
              </span>
              <div style={{ fontSize:15,fontWeight:800,color:"#F0EDE8",fontFamily:"'Syne',sans-serif",lineHeight:1.3 }}>
                {remaining === TARGET
                  ? "Lance ta 1ère séance pour démarrer fort"
                  : <>Plus que <span style={{ color:"#E8B000" }}>{remaining} séance{remaining > 1 ? "s" : ""}</span> pour activer ton programme</>}
              </div>
              <div style={{ fontSize:12,color:"#666",marginTop:5,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic" }}>
                Les clients qui font 3 séances en 2 semaines tiennent leurs résultats. C'est le départ qui compte.
              </div>
            </div>
            <div style={{ textAlign:"center",flexShrink:0 }}>
              <div style={{ fontSize:22,fontWeight:800,color:urgent ? "#E8B000" : "#888",fontFamily:"'Syne',sans-serif",lineHeight:1 }}>{daysLeft}</div>
              <div style={{ fontSize:9,letterSpacing:"1px",textTransform:"uppercase",color:"#444",marginTop:2 }}>jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}</div>
            </div>
          </div>

          {/* Progression — 3 segments */}
          <div style={{ display:"flex",gap:6,marginBottom:14 }}>
            {Array.from({ length: TARGET }, (_, i) => {
              const filled = i < done;
              return (
                <div key={i} style={{ flex:1,height:8,borderRadius:4,background:"#161616",overflow:"hidden",position:"relative" }}>
                  {filled && (
                    <div style={{
                      position:"absolute",inset:0,borderRadius:4,transformOrigin:"left",
                      background:"linear-gradient(90deg,#E8B000,#F5C832)",
                      animation:`act-fill 0.5s ${i * 0.12}s cubic-bezier(0.34,1.56,0.64,1) both`,
                    }}/>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <button
            onClick={goToSeances}
            style={{
              width:"100%",padding:"13px",
              background:"linear-gradient(135deg,#E8B000 0%,#F5C832 50%,#E8B000 100%)",
              backgroundSize:"200% auto",border:"none",borderRadius:10,color:"#0A0A0A",
              fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:800,letterSpacing:"2px",textTransform:"uppercase",
              cursor:"pointer",transition:"all 0.3s",boxShadow:"0 4px 20px rgba(232,176,0,0.22)",
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundPosition = "right center"}
            onMouseLeave={e => e.currentTarget.style.backgroundPosition = "left center"}
          >
            {done > 0 ? `Continuer — ${done}/${TARGET} fait${done > 1 ? "s" : ""} →` : "Voir ma séance du jour →"}
          </button>
        </div>
      </div>
    </>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const OBJECTIFS = [
  { id: "prise_de_masse",   icon: "💪", label: "Prise de masse",    desc: "Construire du muscle et gagner en force" },
  { id: "seche",            icon: "🔥", label: "Sèche",             desc: "Perdre du gras en préservant le muscle" },
  { id: "remise_en_forme",  icon: "⚡", label: "Remise en forme",   desc: "Retrouver énergie et bien-être" },
  { id: "performance",      icon: "🏆", label: "Performance",        desc: "Améliorer mes résultats sportifs" },
];

const NIVEAUX = [
  { id: "débutant",       label: "Débutant",       sub: "Moins d'1 an de pratique" },
  { id: "intermédiaire",  label: "Intermédiaire",  sub: "1 à 3 ans de pratique" },
  { id: "avancé",         label: "Avancé",          sub: "Plus de 3 ans" },
];

const STYLES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideOutLeft {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(-40px); }
  }
  @keyframes fillBar {
    from { width: 0%; }
    to   { width: var(--target-width); }
  }
  @keyframes pulse {
    0%,100% { transform: scale(1); }
    50%      { transform: scale(1.06); }
  }
  @keyframes sparkle {
    0%   { opacity:0; transform: scale(0) rotate(0deg); }
    50%  { opacity:1; transform: scale(1.2) rotate(180deg); }
    100% { opacity:0; transform: scale(0) rotate(360deg); }
  }
  @keyframes countUp {
    from { opacity:0; transform: translateY(8px); }
    to   { opacity:1; transform: translateY(0); }
  }
`;

function StepIndicator({ step, total }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 28 : 8, height: 8,
          borderRadius: 4,
          background: i < step ? "#C9A84C" : i === step ? "linear-gradient(90deg,#C9A84C,#E8C87A)" : "#1A1A1A",
          transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: i === step ? "0 0 12px rgba(201,168,76,0.5)" : "none",
        }} />
      ))}
    </div>
  );
}

function ObjectifCard({ obj, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: selected ? "rgba(201,168,76,0.10)" : "#0D0D0D",
      border: `1px solid ${selected ? "#C9A84C" : "#1A1A1A"}`,
      borderRadius: 14, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 14,
      cursor: "pointer", width: "100%", textAlign: "left",
      transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      transform: selected ? "scale(1.02)" : "scale(1)",
      boxShadow: selected ? "0 4px 20px rgba(201,168,76,0.15)" : "none",
    }}>
      <span style={{
        fontSize: 26, width: 44, height: 44, borderRadius: 12,
        background: selected ? "rgba(201,168,76,0.15)" : "#111",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 0.2s",
      }}>{obj.icon}</span>
      <div>
        <div style={{
          fontSize: 13, fontWeight: 700, color: selected ? "#C9A84C" : "#F0EDE8",
          fontFamily: "'Syne',sans-serif", letterSpacing: "0.5px", marginBottom: 2,
          transition: "color 0.2s",
        }}>{obj.label}</div>
        <div style={{ fontSize: 11, color: "#555" }}>{obj.desc}</div>
      </div>
      <div style={{
        marginLeft: "auto", flexShrink: 0,
        width: 18, height: 18, borderRadius: "50%",
        border: `1.5px solid ${selected ? "#C9A84C" : "#242424"}`,
        background: selected ? "#C9A84C" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}>
        {selected && <span style={{ fontSize: 10, color: "#0A0A0A", fontWeight: 700 }}>✓</span>}
      </div>
    </button>
  );
}

function NiveauCard({ niv, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: selected ? "rgba(201,168,76,0.10)" : "#0D0D0D",
      border: `1px solid ${selected ? "#C9A84C" : "#1A1A1A"}`,
      borderRadius: 12, padding: "12px 16px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      cursor: "pointer", width: "100%", textAlign: "left",
      transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      transform: selected ? "scale(1.02)" : "scale(1)",
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: selected ? "#C9A84C" : "#F0EDE8", fontFamily: "'Syne',sans-serif" }}>
          {niv.label}
        </div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{niv.sub}</div>
      </div>
      <div style={{
        width: 16, height: 16, borderRadius: "50%",
        border: `1.5px solid ${selected ? "#C9A84C" : "#242424"}`,
        background: selected ? "#C9A84C" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", flexShrink: 0,
      }}>
        {selected && <span style={{ fontSize: 9, color: "#0A0A0A", fontWeight: 700 }}>✓</span>}
      </div>
    </button>
  );
}

function NumberInput({ label, unit, value, onChange, min, max, step = 1 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#555", fontFamily:"'Syne',sans-serif" }}>
        {label}
      </label>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <button onClick={() => onChange(Math.max(min, value - step))} style={{
          width:36, height:36, borderRadius:8, background:"#0D0D0D",
          border:"0.5px solid #242424", color:"#888", fontSize:18,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all 0.15s", flexShrink:0,
        }}>−</button>
        <div style={{
          flex:1, background:"#0D0D0D", border:"0.5px solid #242424",
          borderRadius:10, padding:"10px 14px", display:"flex",
          alignItems:"center", justifyContent:"space-between",
        }}>
          <span style={{ fontSize:22, fontWeight:700, color:"#F0EDE8", fontFamily:"'Syne',sans-serif" }}>
            {value}
          </span>
          <span style={{ fontSize:11, color:"#555" }}>{unit}</span>
        </div>
        <button onClick={() => onChange(Math.min(max, value + step))} style={{
          width:36, height:36, borderRadius:8, background:"#0D0D0D",
          border:"0.5px solid #242424", color:"#888", fontSize:18,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all 0.15s", flexShrink:0,
        }}>+</button>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  const colors = ["#C9A84C","#E8C87A","#F0EDE8","#7AE07A","#88A0E0"];
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      {pieces.map(i => (
        <div key={i} style={{
          position:"absolute",
          left: `${10 + (i * 73 % 80)}%`,
          top: `${-5 + (i * 37 % 20)}%`,
          width: 8, height: i % 3 === 0 ? 16 : 8,
          borderRadius: i % 3 === 0 ? 2 : "50%",
          background: colors[i % colors.length],
          animation: `sparkle ${0.8 + (i % 5) * 0.15}s ease-out ${(i % 7) * 0.08}s both`,
        }} />
      ))}
    </div>
  );
}

export function OnboardingWizard({ user, clientData, onComplete }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState("right");
  const [animating, setAnimating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [objectif, setObjectif] = useState(clientData?.programmeData?.objectif_principal || "");
  const [niveau, setNiveau] = useState(clientData?.programmeData?.niveau || "");
  const [poids, setPoids] = useState(clientData?.poids || 75);
  const [taille, setTaille] = useState(clientData?.taille || 175);
  const [age, setAge] = useState(clientData?.age || 25);

  const TOTAL_STEPS = 3;

  const goNext = () => {
    if (animating) return;
    setDirection("right");
    setAnimating(true);
    setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 300);
  };

  const goPrev = () => {
    if (animating || step === 0) return;
    setDirection("left");
    setAnimating(true);
    setTimeout(() => { setStep(s => s - 1); setAnimating(false); }, 300);
  };

  const handleFinish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const updates = {
        onboardingCompleted: true,
        onboardingAt: new Date().toISOString(),
        poids: Number(poids),
        taille: Number(taille),
        age: Number(age),
      };
      if (objectif) updates["programmeData.objectif_principal"] = objectif;
      if (niveau)   updates["programmeData.niveau"] = niveau;

      await updateDoc(doc(db, "clients", user.uid), updates);
      setTimeout(() => onComplete?.(), 600);
    } catch (e) {
      console.error("onboarding save:", e);
      onComplete?.();
    }
    setSaving(false);
  };

  const slideAnim = direction === "right"
    ? (animating ? "slideOutLeft" : "slideInRight")
    : (animating ? "slideOutLeft" : "slideInLeft");

  const canNext0 = objectif !== "" && niveau !== "";
  const canNext1 = true;

  return (
    <>
      <style>{STYLES}</style>
      <div style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(10,10,10,0.96)",
        backdropFilter: "blur(12px)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Fond décoratif */}
        <div style={{
          position: "absolute", top: "-20%", right: "-10%",
          width: 340, height: 340, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-15%", left: "-10%",
          width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Header */}
        <div style={{ padding: "20px 20px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, letterSpacing:"2px", color:"#C9A84C" }}>APX</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, letterSpacing:"2px", color:"#F0EDE8" }}>FITNESS</span>
          </div>
          <StepIndicator step={step} total={TOTAL_STEPS} />
          <div style={{ fontSize:10, color:"#444", fontFamily:"'Syne',sans-serif" }}>
            {step + 1}/{TOTAL_STEPS}
          </div>
        </div>

        {/* Contenu principal */}
        <div style={{
          flex: 1, overflow: "hidden", position: "relative",
          display: "flex", flexDirection: "column",
        }}>
          <div
            key={step}
            style={{
              flex: 1, overflowY: "auto", padding: "24px 20px 0",
              animation: `${slideAnim} 0.3s cubic-bezier(0.34,1.56,0.64,1) both`,
            }}
          >
            {/* ── ÉTAPE 0 : Objectif + niveau ── */}
            {step === 0 && (
              <div>
                <div style={{ marginBottom: 28, animation: "fadeUp 0.4s ease both" }}>
                  <div style={{
                    fontSize: 11, letterSpacing: "3px", textTransform: "uppercase",
                    color: "#C9A84C", fontFamily: "'Syne',sans-serif", marginBottom: 8,
                  }}>
                    Bienvenue
                  </div>
                  <h2 style={{
                    fontFamily: "'Syne',sans-serif", fontWeight: 800,
                    fontSize: 26, color: "#F0EDE8", margin: 0, lineHeight: 1.2,
                  }}>
                    Quel est ton<br />
                    <span style={{ color: "#C9A84C" }}>objectif principal ?</span>
                  </h2>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28, animation:"fadeUp 0.4s 0.1s ease both" }}>
                  {OBJECTIFS.map(obj => (
                    <ObjectifCard
                      key={obj.id}
                      obj={obj}
                      selected={objectif === obj.id}
                      onClick={() => setObjectif(obj.id)}
                    />
                  ))}
                </div>

                <div style={{ marginBottom: 12, animation:"fadeUp 0.4s 0.15s ease both" }}>
                  <div style={{
                    fontSize: 11, letterSpacing: "3px", textTransform: "uppercase",
                    color: "#555", fontFamily: "'Syne',sans-serif", marginBottom: 12,
                  }}>
                    Ton niveau
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {NIVEAUX.map(niv => (
                      <NiveauCard
                        key={niv.id}
                        niv={niv}
                        selected={niveau === niv.id}
                        onClick={() => setNiveau(niv.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 1 : Profil physique ── */}
            {step === 1 && (
              <div>
                <div style={{ marginBottom: 28, animation: "fadeUp 0.4s ease both" }}>
                  <div style={{
                    fontSize: 11, letterSpacing: "3px", textTransform: "uppercase",
                    color: "#C9A84C", fontFamily: "'Syne',sans-serif", marginBottom: 8,
                  }}>
                    Ton profil
                  </div>
                  <h2 style={{
                    fontFamily: "'Syne',sans-serif", fontWeight: 800,
                    fontSize: 26, color: "#F0EDE8", margin: 0, lineHeight: 1.2,
                  }}>
                    Quelques données<br />
                    <span style={{ color: "#C9A84C" }}>pour personnaliser</span>
                  </h2>
                  <p style={{
                    fontSize: 12, color: "#555", marginTop: 8,
                    fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic",
                  }}>
                    Ces informations permettent de calculer tes macros avec précision.
                  </p>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:20, animation:"fadeUp 0.4s 0.1s ease both" }}>
                  <NumberInput label="Poids actuel" unit="kg" value={poids} onChange={setPoids} min={40} max={200} step={0.5} />
                  <NumberInput label="Taille" unit="cm" value={taille} onChange={setTaille} min={140} max={220} />
                  <NumberInput label="Âge" unit="ans" value={age} onChange={setAge} min={14} max={80} />
                </div>

                {/* Aperçu IMC */}
                {poids && taille ? (() => {
                  const imc = (poids / ((taille / 100) ** 2)).toFixed(1);
                  const label = imc < 18.5 ? "Sous-poids" : imc < 25 ? "Poids normal" : imc < 30 ? "Surpoids" : "Obésité";
                  const color = imc < 18.5 ? "#88A0E0" : imc < 25 ? "#7AE07A" : imc < 30 ? "#E8C87A" : "#E07070";
                  return (
                    <div style={{
                      marginTop: 20, padding: "12px 16px",
                      background: "rgba(201,168,76,0.04)", borderRadius: 12,
                      border: "0.5px solid #1A1A1A", animation: "fadeUp 0.3s ease both",
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:10, color:"#555", fontFamily:"'Syne',sans-serif", letterSpacing:"1px" }}>IMC</span>
                        <span style={{ fontSize:11, color, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>
                          {imc} — {label}
                        </span>
                      </div>
                    </div>
                  );
                })() : null}
              </div>
            )}

            {/* ── ÉTAPE 2 : Confirmation ── */}
            {step === 2 && (
              <div style={{ textAlign: "center", paddingTop: 20, position: "relative" }}>
                <Confetti />

                <div style={{
                  width: 90, height: 90, borderRadius: "50%", margin: "0 auto 24px",
                  background: "linear-gradient(135deg,#C9A84C,#A67C2E)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 40, animation: "pulse 1.5s ease infinite",
                  boxShadow: "0 0 40px rgba(201,168,76,0.35)",
                }}>
                  💪
                </div>

                <h2 style={{
                  fontFamily: "'Syne',sans-serif", fontWeight: 800,
                  fontSize: 28, color: "#F0EDE8", margin: "0 0 8px",
                  animation: "fadeUp 0.4s ease both",
                }}>
                  {clientData?.nom?.split(" ")[0] || "Toi"}, t'es prêt.
                </h2>
                <p style={{
                  fontSize: 14, color: "#888",
                  fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic",
                  margin: "0 0 32px", lineHeight: 1.6,
                  animation: "fadeUp 0.4s 0.1s ease both",
                }}>
                  Ton profil est configuré.<br />Ton coach travaille déjà sur ton programme.
                </p>

                {/* Récap */}
                <div style={{
                  background: "#0D0D0D", borderRadius: 14, padding: "16px",
                  border: "0.5px solid #1A1A1A", textAlign: "left", marginBottom: 12,
                  animation: "fadeUp 0.4s 0.2s ease both",
                }}>
                  {[
                    { label: "Objectif", value: OBJECTIFS.find(o => o.id === objectif)?.label || "—" },
                    { label: "Niveau",   value: NIVEAUX.find(n => n.id === niveau)?.label || "—" },
                    { label: "Profil",   value: `${poids}kg · ${taille}cm · ${age} ans` },
                  ].map(row => (
                    <div key={row.label} style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding: "8px 0", borderBottom: "0.5px solid #111",
                    }}>
                      <span style={{ fontSize:10, color:"#555", fontFamily:"'Syne',sans-serif", letterSpacing:"1px" }}>
                        {row.label.toUpperCase()}
                      </span>
                      <span style={{ fontSize:12, color:"#F0EDE8", fontWeight:600, fontFamily:"'Syne',sans-serif" }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                <p style={{
                  fontSize: 11, color: "#444", textAlign: "center",
                  fontFamily: "'Cormorant Garamond',serif",
                  animation: "fadeUp 0.4s 0.3s ease both",
                }}>
                  Tu pourras modifier ces informations<br />depuis ton espace client.
                </p>
              </div>
            )}
          </div>

          {/* Boutons */}
          <div style={{
            padding: "16px 20px 32px",
            display:"flex", gap:10, flexShrink:0,
          }}>
            {step > 0 && step < TOTAL_STEPS - 1 && (
              <button onClick={goPrev} style={{
                background: "transparent", border: "0.5px solid #242424",
                color: "#555", fontFamily: "'Syne',sans-serif", fontSize: 10,
                fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase",
                padding: "14px 20px", borderRadius: 12, cursor: "pointer",
                flexShrink: 0, transition: "all 0.15s",
              }}>
                ← Retour
              </button>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <button
                onClick={goNext}
                disabled={step === 0 ? !canNext0 : false}
                style={{
                  flex: 1,
                  background: (step === 0 && !canNext0)
                    ? "#111"
                    : "linear-gradient(135deg,#C9A84C,#A67C2E)",
                  border: "none", color: (step === 0 && !canNext0) ? "#333" : "#0A0A0A",
                  fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800,
                  letterSpacing: "2px", textTransform: "uppercase",
                  padding: "16px", borderRadius: 12,
                  cursor: (step === 0 && !canNext0) ? "not-allowed" : "pointer",
                  transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  transform: (step === 0 && !canNext0) ? "scale(1)" : "scale(1)",
                }}>
                Continuer →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                style={{
                  flex: 1,
                  background: saving ? "#111" : "linear-gradient(135deg,#C9A84C,#A67C2E)",
                  border: "none", color: saving ? "#333" : "#0A0A0A",
                  fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800,
                  letterSpacing: "2px", textTransform: "uppercase",
                  padding: "16px", borderRadius: 12,
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                  boxShadow: saving ? "none" : "0 4px 20px rgba(201,168,76,0.3)",
                  animation: saving ? "none" : "pulse 2s ease infinite",
                }}>
                {saving ? "Enregistrement…" : "Accéder à mon espace →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

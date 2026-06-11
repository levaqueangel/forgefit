"use client";
import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

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
  @keyframes pulse {
    0%,100% { transform: scale(1); }
    50%      { transform: scale(1.06); }
  }
  @keyframes sparkle {
    0%   { opacity:0; transform: scale(0) rotate(0deg); }
    50%  { opacity:1; transform: scale(1.2) rotate(180deg); }
    100% { opacity:0; transform: scale(0) rotate(360deg); }
  }
  @keyframes drawLine {
    from { stroke-dashoffset: 1000; }
    to   { stroke-dashoffset: 0; }
  }
`;

// ── Indicateur d'étapes ────────────────────────────────────────────────────
function StepIndicator({ step, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
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

// ── Input numérique +/- ────────────────────────────────────────────────────
function NumberInput({ label, unit, value, onChange, min, max, step = 1, icon }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", fontFamily: "'Syne',sans-serif" }}>
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}{label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => onChange(Math.max(min, parseFloat((value - step).toFixed(1))))} style={{
          width: 36, height: 36, borderRadius: 8, background: "#0D0D0D",
          border: "0.5px solid #242424", color: "#888", fontSize: 18,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s", flexShrink: 0,
        }}>−</button>
        <div style={{
          flex: 1, background: "#0D0D0D", border: "0.5px solid #242424",
          borderRadius: 10, padding: "10px 14px", display: "flex",
          alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#F0EDE8", fontFamily: "'Syne',sans-serif" }}>
            {value}
          </span>
          <span style={{ fontSize: 11, color: "#555" }}>{unit}</span>
        </div>
        <button onClick={() => onChange(Math.min(max, parseFloat((value + step).toFixed(1))))} style={{
          width: 36, height: 36, borderRadius: 8, background: "#0D0D0D",
          border: "0.5px solid #242424", color: "#888", fontSize: 18,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s", flexShrink: 0,
        }}>+</button>
      </div>
    </div>
  );
}

// ── Confetti ───────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  const colors = ["#C9A84C", "#E8C87A", "#F0EDE8", "#7AE07A", "#88A0E0"];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {pieces.map(i => (
        <div key={i} style={{
          position: "absolute",
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

// ── Graphique poids mini ───────────────────────────────────────────────────
function WeightChart({ entries, targetWeight }) {
  const sorted = [...entries].filter(e => e.poids).sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sorted.length < 2) return null;

  const vals = sorted.map(e => parseFloat(e.poids));
  const W = 320, H = 90, PX = 10, PY = 12;
  const target = targetWeight ? parseFloat(targetWeight) : null;
  const allVals = target ? [...vals, target] : vals;
  const minV = Math.min(...allVals) - 1.5;
  const maxV = Math.max(...allVals) + 1.5;
  const range = maxV - minV || 1;

  const toX = i => PX + (i / (sorted.length - 1)) * (W - PX * 2);
  const toY = v => PY + (H - PY * 2) - ((v - minV) / range) * (H - PY * 2);
  const pts = vals.map((v, i) => [toX(i), toY(v)]);

  const pathD = pts.map((p, i) => {
    if (i === 0) return `M ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const prev = pts[i - 1];
    const cx = ((prev[0] + p[0]) / 2).toFixed(1);
    return `C ${cx} ${prev[1].toFixed(1)} ${cx} ${p[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  }).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1][0].toFixed(1)} ${H} L ${pts[0][0].toFixed(1)} ${H} Z`;
  const total = vals[vals.length - 1] - vals[0];
  const trendColor = total < -0.1 ? "#7AE07A" : total > 0.1 ? "#E07070" : "#C9A84C";
  const trendLabel = total < -0.1 ? `↓ ${Math.abs(total).toFixed(1)} kg` : total > 0.1 ? `↑ ${total.toFixed(1)} kg` : "→ stable";

  return (
    <div style={{ background: "#0D0D0D", borderRadius: 12, padding: "12px 14px", border: "0.5px solid #1A1A1A" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555" }}>Évolution du poids</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: trendColor, fontFamily: "'Syne',sans-serif" }}>{trendLabel}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="cjGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#C9A84C" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((v, i) => (
          <line key={i} x1={PX} x2={W-PX}
            y1={(PY + (H-PY*2)*(1-v)).toFixed(1)} y2={(PY + (H-PY*2)*(1-v)).toFixed(1)}
            stroke="#1A1A1A" strokeWidth="0.5"/>
        ))}
        {target && !isNaN(target) && (
          <line x1={PX} x2={W-PX} y1={toY(target).toFixed(1)} y2={toY(target).toFixed(1)}
            stroke="#7AE07A" strokeWidth="1" strokeDasharray="4 4" opacity="0.6"/>
        )}
        <path d={areaD} fill="url(#cjGrad)"/>
        <path d={pathD} fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"
          style={{ strokeDasharray: 1000, animation: "drawLine 1.2s ease both" }}/>
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3"
            fill="#0A0A0A" stroke="#C9A84C" strokeWidth="2"/>
        ))}
        {pts.map(([x, y], i) => (
          <text key={i} x={x.toFixed(1)} y={(y-6).toFixed(1)}
            textAnchor="middle" fontSize="7.5" fill="#666">{vals[i].toFixed(1)}</text>
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {[sorted[0], sorted[Math.floor(sorted.length/2)], sorted[sorted.length-1]].filter(Boolean).map((e, i) => (
          <span key={i} style={{ fontSize: 8, color: "#444" }}>
            {new Date(e.date).toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
export function CorpsJournal({ uid, addToast, programmeData }) {
  const TOTAL_STEPS = 3;
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState("right");
  const [animating, setAnimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState([]);
  const [targetWeight, setTargetWeight] = useState("");

  // Valeurs du formulaire
  const [poids, setPoids] = useState(75);
  const [tailleCm, setTailleCm] = useState(175);
  const [tailleTour, setTailleTour] = useState(80);
  const [bras, setBras] = useState(35);
  const [cuisses, setCuisses] = useState(55);
  const [poitrine, setPoitrine] = useState(95);
  const [epaules, setEpaules] = useState(110);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "clients", uid)).then(snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      setEntries(data.corpsMesures || []);
      if (data.programmeData?.poids_cible) setTargetWeight(String(data.programmeData.poids_cible));
      // Pré-remplir avec la dernière mesure
      const last = (data.corpsMesures || []).slice(-1)[0];
      if (last) {
        if (last.poids)       setPoids(last.poids);
        if (last.taille_tour) setTailleTour(last.taille_tour);
        if (last.bras)        setBras(last.bras);
        if (last.cuisses)     setCuisses(last.cuisses);
        if (last.poitrine)    setPoitrine(last.poitrine);
        if (last.epaules)     setEpaules(last.epaules);
      }
      if (data.taille) setTailleCm(data.taille);
    }).catch(() => {});
  }, [uid]);

  const goNext = () => {
    if (animating) return;
    setDirection("right");
    setAnimating(true);
    setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 280);
  };

  const goPrev = () => {
    if (animating || step === 0) return;
    setDirection("left");
    setAnimating(true);
    setTimeout(() => { setStep(s => s - 1); setAnimating(false); }, 280);
  };

  const goNewEntry = () => {
    setDirection("right");
    setAnimating(true);
    setSaved(false);
    setTimeout(() => { setStep(0); setAnimating(false); }, 280);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const entry = {
        date: new Date().toISOString(),
        poids,
        taille_tour: tailleTour,
        bras,
        cuisses,
        poitrine,
        epaules,
      };
      const newEntries = [...entries, entry].slice(-52);
      await updateDoc(doc(db, "clients", uid), {
        corpsMesures: newEntries,
        taille: tailleCm,
      });
      setEntries(newEntries);
      setSaved(true);
      addToast?.("Mesures enregistrées ✓", "success");
    } catch {
      addToast?.("Erreur de sauvegarde", "error");
    }
    setSaving(false);
  };

  const slideAnim = direction === "right"
    ? (animating ? "slideOutLeft" : "slideInRight")
    : (animating ? "slideOutLeft" : "slideInLeft");

  const imc = poids && tailleCm
    ? (poids / Math.pow(tailleCm / 100, 2)).toFixed(1)
    : null;
  const imcLabel = imc
    ? (imc < 18.5 ? "Sous-poids" : imc < 25 ? "Poids normal" : imc < 30 ? "Surpoids" : "Obésité")
    : null;
  const imcColor = imc
    ? (imc < 18.5 ? "#88A0E0" : imc < 25 ? "#7AE07A" : imc < 30 ? "#E8C87A" : "#E07070")
    : "#C9A84C";

  const last = entries.slice(-1)[0];
  const poidsObjectif = parseFloat(targetWeight) || null;
  const progressionPct = poidsObjectif && entries.length >= 2
    ? Math.min(100, Math.max(0,
        Math.abs((entries[0].poids || poids) - poids) /
        Math.abs((entries[0].poids || poids) - poidsObjectif) * 100
      ))
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <style>{STYLES}</style>

      {/* ── Header wizard ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: "#444", fontFamily: "'Syne',sans-serif", letterSpacing: "1px" }}>
          {saved ? "Bilan enregistré" : `Étape ${step + 1}/${TOTAL_STEPS}`}
        </div>
        <StepIndicator step={saved ? TOTAL_STEPS : step} total={TOTAL_STEPS} />
        <div style={{ width: 60 }} />
      </div>

      {/* ── Contenu animé ── */}
      <div
        key={`${step}-${saved}`}
        style={{ animation: `${slideAnim} 0.28s cubic-bezier(0.34,1.56,0.64,1) both` }}
      >

        {/* ── ÉTAPE 0 : Poids + taille ── */}
        {step === 0 && !saved && (
          <div>
            <div style={{ marginBottom: 28, animation: "fadeUp 0.4s ease both" }}>
              <div style={{ fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>
                Bilan corporel
              </div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "#F0EDE8", margin: 0, lineHeight: 1.2 }}>
                Ton poids<br />
                <span style={{ color: "#C9A84C" }}>et ta taille aujourd'hui</span>
              </h2>
              <p style={{ fontSize: 12, color: "#555", marginTop: 8, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>
                Note tes mesures le matin, à jeun, pour un suivi précis.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp 0.4s 0.1s ease both", opacity: 0, animationFillMode: "forwards" }}>
              <NumberInput label="Poids actuel" unit="kg" value={poids} onChange={setPoids} min={30} max={200} step={0.5} icon="⚖️" />
              <NumberInput label="Taille" unit="cm" value={tailleCm} onChange={setTailleCm} min={130} max={230} step={1} icon="📏" />
            </div>

            {imc && (
              <div style={{
                marginTop: 20, padding: "12px 16px",
                background: "rgba(201,168,76,0.04)", borderRadius: 12,
                border: "0.5px solid #1A1A1A", animation: "fadeUp 0.3s 0.2s ease both",
                opacity: 0, animationFillMode: "forwards",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#555", fontFamily: "'Syne',sans-serif", letterSpacing: "1px" }}>IMC</span>
                  <span style={{ fontSize: 12, color: imcColor, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>
                    {imc} — {imcLabel}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ÉTAPE 1 : Mensurations ── */}
        {step === 1 && !saved && (
          <div>
            <div style={{ marginBottom: 28, animation: "fadeUp 0.4s ease both" }}>
              <div style={{ fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>
                Mensurations
              </div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "#F0EDE8", margin: 0, lineHeight: 1.2 }}>
                Tes mesures<br />
                <span style={{ color: "#C9A84C" }}>du corps</span>
              </h2>
              <p style={{ fontSize: 12, color: "#555", marginTop: 8, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>
                Utilise un mètre ruban, tape à la même hauteur chaque semaine.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "fadeUp 0.4s 0.1s ease both", opacity: 0, animationFillMode: "forwards" }}>
              <NumberInput label="Tour de taille" unit="cm" value={tailleTour} onChange={setTailleTour} min={40} max={160} icon="📐" />
              <NumberInput label="Bras" unit="cm" value={bras} onChange={setBras} min={20} max={80} icon="💪" />
              <NumberInput label="Cuisses" unit="cm" value={cuisses} onChange={setCuisses} min={30} max={120} icon="🦵" />
              <NumberInput label="Poitrine" unit="cm" value={poitrine} onChange={setPoitrine} min={50} max={160} icon="📋" />
              <NumberInput label="Épaules" unit="cm" value={epaules} onChange={setEpaules} min={60} max={180} icon="🏋️" />
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 : Récap ── */}
        {step === 2 && !saved && (
          <div>
            <div style={{ marginBottom: 24, animation: "fadeUp 0.4s ease both" }}>
              <div style={{ fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>
                Récapitulatif
              </div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "#F0EDE8", margin: 0, lineHeight: 1.2 }}>
                Vérifie tes<br />
                <span style={{ color: "#C9A84C" }}>mesures</span>
              </h2>
            </div>

            <div style={{ background: "#0D0D0D", borderRadius: 14, padding: "4px 0", border: "0.5px solid #1A1A1A", marginBottom: 16, animation: "fadeUp 0.4s 0.1s ease both", opacity: 0, animationFillMode: "forwards" }}>
              {[
                { icon: "⚖️", label: "Poids",         value: `${poids} kg`,        color: "#C9A84C" },
                { icon: "📏", label: "Taille",         value: `${tailleCm} cm`,     color: "#F0EDE8" },
                { icon: "📐", label: "Tour de taille", value: `${tailleTour} cm`,   color: "#7AE07A" },
                { icon: "💪", label: "Bras",           value: `${bras} cm`,         color: "#5DCAA5" },
                { icon: "🦵", label: "Cuisses",        value: `${cuisses} cm`,      color: "#E8C87A" },
                { icon: "📋", label: "Poitrine",       value: `${poitrine} cm`,     color: "#88A0E0" },
                { icon: "🏋️", label: "Épaules",        value: `${epaules} cm`,      color: "#E07070" },
                ...(imc ? [{ icon: "🧮", label: "IMC", value: `${imc} — ${imcLabel}`, color: imcColor }] : []),
              ].map((row, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 16px", borderBottom: i < 7 ? "0.5px solid #111" : "none",
                }}>
                  <span style={{ fontSize: 11, color: "#555", fontFamily: "'Syne',sans-serif" }}>
                    {row.icon} {row.label}
                  </span>
                  <span style={{ fontSize: 13, color: row.color, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Progression objectif */}
            {poidsObjectif && progressionPct !== null && (
              <div style={{
                background: "rgba(201,168,76,0.04)", border: "0.5px solid rgba(201,168,76,0.2)",
                borderRadius: 10, padding: "12px 14px", marginBottom: 16,
                animation: "fadeUp 0.4s 0.2s ease both", opacity: 0, animationFillMode: "forwards",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#C9A84C" }}>
                    Progression objectif
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#C9A84C", fontFamily: "'Syne',sans-serif" }}>
                    {progressionPct.toFixed(0)}%
                  </span>
                </div>
                <div style={{ height: 5, background: "#1A1A1A", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progressionPct}%`, background: "linear-gradient(90deg,#C9A84C,#E8C87A)", borderRadius: 3, transition: "width 1s ease" }} />
                </div>
                <div style={{ fontSize: 10, color: "#444", marginTop: 6 }}>
                  {poids} kg · Objectif : {poidsObjectif} kg
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VUE POST-SAVE : résultats ── */}
        {saved && (
          <div style={{ position: "relative" }}>
            <Confetti />

            <div style={{ textAlign: "center", paddingTop: 8, marginBottom: 24, animation: "fadeUp 0.4s ease both" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px",
                background: "linear-gradient(135deg,#C9A84C,#A67C2E)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, boxShadow: "0 0 30px rgba(201,168,76,0.35)",
                animation: "pulse 1.5s ease infinite",
              }}>📊</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: "#F0EDE8", marginBottom: 6 }}>
                Bilan enregistré !
              </div>
              <div style={{ fontSize: 12, color: "#555", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </div>

            {/* Graphique si assez de données */}
            {entries.length >= 2 && (
              <div style={{ marginBottom: 16, animation: "fadeUp 0.4s 0.15s ease both", opacity: 0, animationFillMode: "forwards" }}>
                <WeightChart entries={entries} targetWeight={targetWeight} />
              </div>
            )}

            {/* Historique */}
            {entries.length > 0 && (
              <div style={{ animation: "fadeUp 0.4s 0.2s ease both", opacity: 0, animationFillMode: "forwards" }}>
                <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>
                  Historique · {entries.length} mesure{entries.length > 1 ? "s" : ""}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 220, overflowY: "auto" }}>
                  {[...entries].reverse().slice(0, 8).map((e, i) => {
                    const prevIdx = entries.length - 1 - i - 1;
                    const prev = entries[prevIdx];
                    const delta = prev?.poids ? (e.poids - prev.poids) : null;
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px", background: "#0D0D0D", borderRadius: 9,
                        border: "0.5px solid #141414",
                      }}>
                        <div style={{ fontSize: 9, color: "#555" }}>
                          {new Date(e.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {delta !== null && (
                            <span style={{ fontSize: 9, color: delta < 0 ? "#7AE07A" : delta > 0 ? "#E07070" : "#555" }}>
                              {delta > 0 ? "+" : ""}{delta.toFixed(1)} kg
                            </span>
                          )}
                          {e.poids && <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "#C9A84C" }}>{e.poids} kg</span>}
                          {e.taille_tour && <span style={{ fontSize: 10, color: "#7AE07A" }}>{e.taille_tour}cm</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Boutons de navigation ── */}
      <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
        {saved ? (
          <button onClick={goNewEntry} style={{
            flex: 1, padding: "15px",
            background: "transparent", border: "0.5px solid #242424",
            color: "#888", fontFamily: "'Syne',sans-serif", fontSize: 11,
            fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase",
            cursor: "pointer", borderRadius: 12, transition: "all 0.15s",
          }}>
            + Nouvelle mesure
          </button>
        ) : (
          <>
            {step > 0 && (
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
              <button onClick={goNext} style={{
                flex: 1, padding: "15px",
                background: "linear-gradient(135deg,#C9A84C,#A67C2E)",
                border: "none", color: "#0A0A0A",
                fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800,
                letterSpacing: "2px", textTransform: "uppercase",
                cursor: "pointer", borderRadius: 12, transition: "all 0.3s",
              }}>
                Continuer →
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving} style={{
                flex: 1, padding: "15px",
                background: saving ? "#111" : "linear-gradient(135deg,#C9A84C,#A67C2E)",
                border: "none", color: saving ? "#333" : "#0A0A0A",
                fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800,
                letterSpacing: "2px", textTransform: "uppercase",
                cursor: saving ? "not-allowed" : "pointer", borderRadius: 12,
                transition: "all 0.3s",
                boxShadow: saving ? "none" : "0 4px 20px rgba(201,168,76,0.3)",
              }}>
                {saving ? "Enregistrement…" : "Enregistrer le bilan →"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

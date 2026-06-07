"use client";
import { useState } from "react";

// Formule d'Epley : 1RM = poids × (1 + reps/30)
function calcOneRM(poids, reps) {
  if (!poids || !reps || poids <= 0 || reps <= 0) return null;
  if (reps === 1) return poids;
  return Math.round(poids * (1 + reps / 30));
}

// Pourcentages courants du 1RM
const PCT_TABLE = [
  { pct: 100, reps: 1,  label: "Max" },
  { pct: 95,  reps: 2,  label: "2 reps" },
  { pct: 90,  reps: 3,  label: "3 reps" },
  { pct: 85,  reps: 5,  label: "5 reps" },
  { pct: 80,  reps: 8,  label: "8 reps" },
  { pct: 75,  reps: 10, label: "10 reps" },
  { pct: 70,  reps: 12, label: "12 reps" },
  { pct: 65,  reps: 15, label: "15 reps" },
];

const EXERCICES_PRINCIPAUX = [
  "Développé couché",
  "Squat",
  "Soulevé de terre",
  "Développé militaire",
  "Rowing barre",
  "Curl barre",
  "Tractions lestées",
];

export function OneRMCalc() {
  const [exercice, setExercice] = useState(EXERCICES_PRINCIPAUX[0]);
  const [poids, setPoids] = useState("");
  const [reps, setReps] = useState("");
  const [resultat, setResultat] = useState(null);

  const calculer = () => {
    const p = parseFloat(poids);
    const r = parseInt(reps);
    const rm = calcOneRM(p, r);
    if (!rm) return;
    setResultat({ oneRM: rm, exercice, poids: p, reps: r });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555" }}>
        💪 Calculateur 1RM — Formule d'Epley
      </div>

      {/* Sélecteur exercice */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {EXERCICES_PRINCIPAUX.map(ex => (
          <button key={ex} onClick={() => { setExercice(ex); setResultat(null); }} style={{
            fontSize:9, letterSpacing:"1px", textTransform:"uppercase",
            fontFamily:"'Syne',sans-serif", padding:"5px 10px", cursor:"pointer",
            borderRadius:20, transition:"all 0.15s",
            background: exercice === ex ? "rgba(201,168,76,0.12)" : "transparent",
            border: `0.5px solid ${exercice === ex ? "rgba(201,168,76,0.5)" : "#1E1E1E"}`,
            color: exercice === ex ? "#C9A84C" : "#555",
          }}>{ex}</button>
        ))}
      </div>

      {/* Formulaire */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[
          { label:"Poids soulevé (kg)", key:"poids", val:poids, set:setPoids, placeholder:"ex: 80", step:"0.5" },
          { label:"Répétitions faites", key:"reps",  val:reps,  set:setReps,  placeholder:"ex: 5",  step:"1" },
        ].map(({ label, key, val, set, placeholder, step }) => (
          <div key={key} style={{ background:"#0D0D0D", border:"0.5px solid #1A1A1A", borderRadius:10, padding:"10px 12px" }}>
            <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#555", marginBottom:6 }}>{label}</div>
            <input
              type="number" step={step} min="0" value={val}
              onChange={e => { set(e.target.value); setResultat(null); }}
              placeholder={placeholder}
              style={{ width:"100%", background:"transparent", border:"none", color:"#F0EDE8",
                fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, outline:"none" }}
            />
          </div>
        ))}
      </div>

      <button onClick={calculer} disabled={!poids || !reps} style={{
        padding:"12px", width:"100%",
        background: poids && reps ? "linear-gradient(135deg,#C9A84C,#A67C2E)" : "#111",
        border: "none", color: poids && reps ? "#0A0A0A" : "#333",
        fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700,
        letterSpacing:"2px", textTransform:"uppercase",
        cursor: poids && reps ? "pointer" : "not-allowed",
        borderRadius:10, transition:"all 0.2s",
      }}>
        Calculer mon 1RM →
      </button>

      {/* Résultat */}
      {resultat && (
        <div style={{ animation:"fadeUp 0.3s ease forwards" }}>
          {/* 1RM principal */}
          <div style={{ background:"rgba(201,168,76,0.06)", border:"0.5px solid rgba(201,168,76,0.3)", borderRadius:12, padding:"16px", textAlign:"center", marginBottom:12 }}>
            <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:6 }}>
              {resultat.exercice} — 1RM estimé
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:56, fontWeight:600, color:"#C9A84C", lineHeight:1 }}>
              {resultat.oneRM}
            </div>
            <div style={{ fontSize:12, color:"#555", marginTop:4 }}>kg</div>
            <div style={{ fontSize:10, color:"#333", marginTop:8 }}>
              Calculé depuis {resultat.poids} kg × {resultat.reps} répétitions
            </div>
          </div>

          {/* Table des %  */}
          <div style={{ background:"#0D0D0D", border:"0.5px solid #1A1A1A", borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"10px 14px", borderBottom:"0.5px solid #1A1A1A" }}>
              <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#555" }}>
                Tableau de charges
              </div>
            </div>
            {PCT_TABLE.map(({ pct, reps: r, label }, i) => {
              const charge = Math.round(resultat.oneRM * pct / 100 * 2) / 2;
              return (
                <div key={i} style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"10px 14px",
                  borderBottom: i < PCT_TABLE.length - 1 ? "0.5px solid #141414" : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                }}>
                  <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#C9A84C", fontFamily:"'Syne',sans-serif", minWidth:36 }}>
                      {pct}%
                    </div>
                    <div style={{ fontSize:11, color:"#555", fontFamily:"'Cormorant Garamond',serif" }}>
                      {label}
                    </div>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#F0EDE8", fontFamily:"'Syne',sans-serif" }}>
                    {charge} kg
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize:10, color:"#333", textAlign:"center", marginTop:8, fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic" }}>
            Le 1RM est une estimation. Ne l'atteins jamais sans pareur.
          </div>
        </div>
      )}
    </div>
  );
}

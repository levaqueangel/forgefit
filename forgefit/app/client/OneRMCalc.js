"use client";
import { useState } from "react";

/* ── Formules 1RM ─────────────────────────────────────────────────────────── */
const FORMULES = [
  {
    id: "epley",
    nom: "Epley",
    annee: "1985",
    calc: (w, r) => r === 1 ? w : Math.round(w * (1 + r / 30)),
    info: "La plus utilisée en salle. Légèrement optimiste sur ≥ 10 reps.",
  },
  {
    id: "brzycki",
    nom: "Brzycki",
    annee: "1993",
    calc: (w, r) => r === 1 ? w : Math.round(w * 36 / (37 - r)),
    info: "Plus précise pour 2–10 reps. Recommandée en force pure.",
  },
  {
    id: "lombardi",
    nom: "Lombardi",
    annee: "1989",
    calc: (w, r) => Math.round(w * Math.pow(r, 0.10)),
    info: "Utilisée dans les sports de force. Légèrement conservative.",
  },
  {
    id: "oconner",
    nom: "O'Conner",
    annee: "1989",
    calc: (w, r) => Math.round(w * (1 + 0.025 * r)),
    info: "Conservative. Idéale pour les débutants (moins de blessures).",
  },
  {
    id: "mayhew",
    nom: "Mayhew",
    annee: "1992",
    calc: (w, r) => Math.round((100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r))),
    info: "Validée scientifiquement sur populations mixtes.",
  },
];

/* ── Table %1RM → charges ─────────────────────────────────────────────────── */
const PCT_TABLE = [
  { pct: 100, reps: 1,  label: "1RM — Max absolu" },
  { pct: 95,  reps: 2,  label: "Force maximale" },
  { pct: 90,  reps: 3,  label: "Force" },
  { pct: 85,  reps: 5,  label: "Force-hypertrophie" },
  { pct: 80,  reps: 8,  label: "Hypertrophie" },
  { pct: 75,  reps: 10, label: "Hypertrophie-endurance" },
  { pct: 70,  reps: 12, label: "Endurance musculaire" },
  { pct: 65,  reps: 15, label: "Endurance" },
  { pct: 60,  reps: 20, label: "Cardio-force" },
];

const EXERCICES = [
  "Développé couché", "Squat", "Soulevé de terre",
  "Développé militaire", "Rowing barre", "Curl barre", "Tractions lestées",
];

/* ── Mini bar de comparaison formules ─────────────────────────────────────── */
function FormulaBar({ formule, val, max, selected, onSelect }) {
  const pct = max > 0 ? (val / max) * 100 : 0;
  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 10, cursor: "pointer",
        border: `0.5px solid ${selected ? "rgba(201,168,76,0.5)" : "#1A1A1A"}`,
        background: selected ? "rgba(201,168,76,0.07)" : "#0D0D0D",
        transition: "all 0.15s",
      }}
    >
      <div style={{ minWidth: 64 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: selected ? "#C9A84C" : "#F0EDE8", fontFamily: "'Syne',sans-serif" }}>
          {formule.nom}
        </div>
        <div style={{ fontSize: 9, color: "#444", letterSpacing: "1px" }}>{formule.annee}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ height: 5, background: "#111", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: selected
              ? "linear-gradient(90deg,#C9A84C,#E8C87A)"
              : "linear-gradient(90deg,#333,#444)",
            borderRadius: 3, transition: "width 0.5s ease",
          }} />
        </div>
      </div>
      <div style={{
        fontSize: 15, fontWeight: 700, color: selected ? "#C9A84C" : "#888",
        fontFamily: "'Syne',sans-serif", minWidth: 48, textAlign: "right",
      }}>
        {val} kg
      </div>
    </div>
  );
}

export function OneRMCalc() {
  const [exercice, setExercice] = useState(EXERCICES[0]);
  const [poids, setPoids]     = useState("");
  const [reps, setReps]       = useState("");
  const [formuleId, setFormuleId] = useState("brzycki");
  const [resultat, setResultat]   = useState(null);

  const selectedFormule = FORMULES.find(f => f.id === formuleId) || FORMULES[0];

  const calculer = () => {
    const p = parseFloat(poids);
    const r = parseInt(reps);
    if (!p || !r || p <= 0 || r <= 0) return;
    const resultats = FORMULES.map(f => ({ ...f, val: f.calc(p, r) }));
    const avg = Math.round(resultats.reduce((s, r) => s + r.val, 0) / resultats.length);
    setResultat({ exercice, poids: p, reps: r, resultats, avg, selected: formuleId });
  };

  const oneRM = resultat
    ? (resultat.resultats.find(r => r.id === formuleId)?.val || resultat.avg)
    : null;
  const maxRM = resultat ? Math.max(...resultat.resultats.map(r => r.val)) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <div style={{ fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "#555" }}>
        💪 Calculateur 1RM — 5 formules scientifiques
      </div>

      {/* Exercice */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {EXERCICES.map(ex => (
          <button key={ex} onClick={() => { setExercice(ex); setResultat(null); }} style={{
            fontSize: 9, letterSpacing: "1px", textTransform: "uppercase",
            fontFamily: "'Syne',sans-serif", padding: "5px 10px", cursor: "pointer",
            borderRadius: 20, transition: "all 0.15s",
            background: exercice === ex ? "rgba(201,168,76,0.12)" : "transparent",
            border: `0.5px solid ${exercice === ex ? "rgba(201,168,76,0.5)" : "#1E1E1E"}`,
            color: exercice === ex ? "#C9A84C" : "#555",
          }}>{ex}</button>
        ))}
      </div>

      {/* Formulaire poids / reps */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Poids soulevé (kg)", val: poids, set: setPoids, placeholder: "ex: 100", step: "0.5" },
          { label: "Répétitions faites", val: reps,  set: setReps,  placeholder: "ex: 5",   step: "1" },
        ].map(({ label, val, set, placeholder, step }, i) => (
          <div key={i} style={{ background: "#0D0D0D", border: "0.5px solid #1A1A1A", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 6 }}>{label}</div>
            <input
              type="number" step={step} min="0" value={val}
              onChange={e => { set(e.target.value); setResultat(null); }}
              placeholder={placeholder}
              style={{ width: "100%", background: "transparent", border: "none", color: "#F0EDE8",
                fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, outline: "none" }}
            />
          </div>
        ))}
      </div>

      <button onClick={calculer} disabled={!poids || !reps} style={{
        padding: "12px", width: "100%",
        background: poids && reps ? "linear-gradient(135deg,#C9A84C,#A67C2E)" : "#111",
        border: "none", color: poids && reps ? "#0A0A0A" : "#333",
        fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700,
        letterSpacing: "2px", textTransform: "uppercase",
        cursor: poids && reps ? "pointer" : "not-allowed",
        borderRadius: 10, transition: "all 0.2s",
      }}>
        Calculer mon 1RM →
      </button>

      {/* Résultats */}
      {resultat && (
        <div style={{ animation: "fadeUp 0.3s ease forwards" }}>

          {/* Consensus */}
          <div style={{
            background: "rgba(201,168,76,0.06)", border: "0.5px solid rgba(201,168,76,0.3)",
            borderRadius: 12, padding: "16px", textAlign: "center", marginBottom: 14,
          }}>
            <div style={{ fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>
              {resultat.exercice} — Consensus 5 formules
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 60, fontWeight: 600, color: "#C9A84C", lineHeight: 1 }}>
              {resultat.avg}
            </div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>kg — moyenne</div>
            <div style={{ fontSize: 10, color: "#333", marginTop: 8 }}>
              {resultat.poids} kg × {resultat.reps} répétitions
            </div>
          </div>

          {/* Comparaison des 5 formules */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>
              Comparaison — clique pour sélectionner
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {resultat.resultats.map(f => (
                <FormulaBar
                  key={f.id}
                  formule={f}
                  val={f.val}
                  max={maxRM}
                  selected={formuleId === f.id}
                  onSelect={() => setFormuleId(f.id)}
                />
              ))}
            </div>
            {/* Info formule sélectionnée */}
            <div style={{
              marginTop: 8, padding: "8px 12px", borderRadius: 8,
              background: "#0D0D0D", border: "0.5px solid #1A1A1A",
              fontSize: 11, color: "#666", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic",
            }}>
              {selectedFormule.info}
            </div>
          </div>

          {/* Table charges selon formule sélectionnée */}
          <div style={{ background: "#0D0D0D", border: "0.5px solid #1A1A1A", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "0.5px solid #1A1A1A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555" }}>
                Tableau de charges — {selectedFormule.nom} ({oneRM} kg)
              </div>
            </div>
            {PCT_TABLE.map(({ pct, reps: r, label }, i) => {
              const charge = Math.round((oneRM * pct / 100) * 2) / 2;
              const isTarget = pct === 80 || pct === 75;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 14px",
                  borderBottom: i < PCT_TABLE.length - 1 ? "0.5px solid #141414" : "none",
                  background: isTarget ? "rgba(201,168,76,0.04)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: isTarget ? "#C9A84C" : "#888", fontFamily: "'Syne',sans-serif", minWidth: 36 }}>
                      {pct}%
                    </div>
                    <div style={{ fontSize: 11, color: "#555", fontFamily: "'Cormorant Garamond',serif" }}>
                      {label}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 9, color: "#333" }}>{r} × </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isTarget ? "#C9A84C" : "#F0EDE8", fontFamily: "'Syne',sans-serif" }}>
                      {charge} kg
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 10, color: "#2A2A2A", textAlign: "center", marginTop: 8, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>
            Le 1RM est une estimation. Ne l'atteins jamais sans pareur.
          </div>
        </div>
      )}
    </div>
  );
}

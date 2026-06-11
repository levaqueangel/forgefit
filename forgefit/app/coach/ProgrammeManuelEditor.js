"use client";
import { useState, useCallback } from "react";

const INPUT_STYLE = {
  background:"#111", border:"0.5px solid #242424", color:"#F0EDE8",
  padding:"7px 10px", borderRadius:6, fontSize:12, outline:"none",
  fontFamily:"'Syne',sans-serif", width:"100%", boxSizing:"border-box",
};
const LABEL_STYLE = { fontSize:10, color:"#555", marginBottom:4 };
const BTN_GHOST = {
  background:"none", border:"0.5px solid #2A2A2A", color:"#888",
  padding:"5px 10px", borderRadius:4, fontSize:11, cursor:"pointer", fontFamily:"'Syne',sans-serif",
};
const BTN_GOLD = {
  background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none",
  color:"#0A0A0A", padding:"12px", borderRadius:6, fontSize:11, fontWeight:700,
  letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer", fontFamily:"'Syne',sans-serif",
  width:"100%",
};

function newExo() {
  return { nom:"", series:3, reps:"8-12", charge:"Léger", repos_sec:90, notes:"" };
}
function newSeance(index) {
  return { nom:`Séance ${index + 1}`, jour:"Lundi", duree_min:60, exercices:[newExo()] };
}

export function ProgrammeManuelEditor({ clientNom, onSave, saving }) {
  const [meta, setMeta] = useState({
    objectif_principal: "Prise de masse",
    niveau: "intermédiaire",
    duree_programme_semaines: 8,
    seances_par_semaine: 3,
    notes_coach: "",
  });
  const [nutrition, setNutrition] = useState({
    calories_jour: "", proteines_g: "", glucides_g: "", lipides_g: "",
  });
  const [seances, setSeances] = useState([newSeance(0)]);

  // ── Séances ────────────────────────────────────────────────────────────────
  const addSeance = () => setSeances(s => [...s, newSeance(s.length)]);
  const removeSeance = (si) => setSeances(s => s.filter((_, i) => i !== si));
  const updateSeance = (si, key, val) =>
    setSeances(s => s.map((s2, i) => i === si ? { ...s2, [key]: val } : s2));

  // ── Exercices ──────────────────────────────────────────────────────────────
  const addExo = (si) =>
    setSeances(s => s.map((s2, i) => i === si ? { ...s2, exercices: [...s2.exercices, newExo()] } : s2));
  const removeExo = (si, ei) =>
    setSeances(s => s.map((s2, i) => i === si
      ? { ...s2, exercices: s2.exercices.filter((_, j) => j !== ei) } : s2));
  const updateExo = (si, ei, key, val) =>
    setSeances(s => s.map((s2, i) => i === si
      ? { ...s2, exercices: s2.exercices.map((e, j) => j === ei ? { ...e, [key]: val } : e) } : s2));

  // ── Construire programmeData au format standard ────────────────────────────
  const buildProgrammeData = useCallback(() => ({
    objectif_principal: meta.objectif_principal,
    niveau: meta.niveau,
    duree_programme_semaines: parseInt(meta.duree_programme_semaines) || 8,
    seances_par_semaine: parseInt(meta.seances_par_semaine) || seances.length,
    notes_coach: meta.notes_coach,
    nutrition: {
      calories_jour: parseInt(nutrition.calories_jour) || null,
      proteines_g: parseInt(nutrition.proteines_g) || null,
      glucides_g: parseInt(nutrition.glucides_g) || null,
      lipides_g: parseInt(nutrition.lipides_g) || null,
    },
    seances: seances.map(s => ({
      nom: s.nom,
      jour: s.jour,
      duree_min: parseInt(s.duree_min) || 60,
      exercices: s.exercices.map(e => ({
        nom: e.nom,
        series: parseInt(e.series) || 3,
        reps: e.reps,
        charge: e.charge,
        repos_sec: parseInt(e.repos_sec) || 90,
        notes: e.notes || "",
      })),
    })),
    _source: "manuel",
  }), [meta, nutrition, seances]);

  const handleSave = () => {
    const pd = buildProgrammeData();
    const hasEmptyExo = pd.seances.some(s => s.exercices.some(e => !e.nom.trim()));
    if (hasEmptyExo) { alert("Tous les exercices doivent avoir un nom."); return; }
    onSave(pd);
  };

  const JOURS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Méta programme ──────────────────────────────────────────────────── */}
      <div>
        <div style={{fontSize:10,color:"#E8B000",letterSpacing:"2px",textTransform:"uppercase",marginBottom:12}}>— Infos programme</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <div style={LABEL_STYLE}>Objectif principal</div>
            <input style={INPUT_STYLE} value={meta.objectif_principal}
              onChange={e => setMeta(m => ({ ...m, objectif_principal: e.target.value }))} />
          </div>
          <div>
            <div style={LABEL_STYLE}>Niveau</div>
            <select style={INPUT_STYLE} value={meta.niveau}
              onChange={e => setMeta(m => ({ ...m, niveau: e.target.value }))}>
              {["débutant","intermédiaire","avancé"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <div style={LABEL_STYLE}>Durée (semaines)</div>
            <input style={INPUT_STYLE} type="number" min={1} max={52} value={meta.duree_programme_semaines}
              onChange={e => setMeta(m => ({ ...m, duree_programme_semaines: e.target.value }))} />
          </div>
          <div>
            <div style={LABEL_STYLE}>Séances / semaine</div>
            <input style={INPUT_STYLE} type="number" min={1} max={7} value={meta.seances_par_semaine}
              onChange={e => setMeta(m => ({ ...m, seances_par_semaine: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop:10 }}>
          <div style={LABEL_STYLE}>Notes coach (visibles par le client)</div>
          <textarea style={{ ...INPUT_STYLE, minHeight:60, resize:"vertical" }}
            value={meta.notes_coach} placeholder="Consignes générales, progressions attendues…"
            onChange={e => setMeta(m => ({ ...m, notes_coach: e.target.value }))} />
        </div>
      </div>

      {/* ── Nutrition ───────────────────────────────────────────────────────── */}
      <div>
        <div style={{fontSize:10,color:"#E8B000",letterSpacing:"2px",textTransform:"uppercase",marginBottom:12}}>— Nutrition (optionnel)</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {[
            { label:"Calories", key:"calories_jour", unit:"kcal" },
            { label:"Protéines", key:"proteines_g", unit:"g" },
            { label:"Glucides", key:"glucides_g", unit:"g" },
            { label:"Lipides", key:"lipides_g", unit:"g" },
          ].map(n => (
            <div key={n.key}>
              <div style={LABEL_STYLE}>{n.label} ({n.unit})</div>
              <input style={INPUT_STYLE} type="number" min={0} value={nutrition[n.key]}
                placeholder="—"
                onChange={e => setNutrition(v => ({ ...v, [n.key]: e.target.value }))} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Séances ─────────────────────────────────────────────────────────── */}
      <div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{fontSize:10,color:"#E8B000",letterSpacing:"2px",textTransform:"uppercase"}}>— Séances ({seances.length})</div>
          <button style={{ ...BTN_GHOST, borderColor:"rgba(232,176,0,0.3)", color:"#E8B000" }} onClick={addSeance}>
            + Ajouter une séance
          </button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {seances.map((seance, si) => (
            <div key={si} style={{ background:"#0D0D0D", border:"0.5px solid #242424", borderRadius:8, padding:"14px 16px" }}>
              {/* Header séance */}
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12 }}>
                <input style={{ ...INPUT_STYLE, flex:2 }} placeholder="Nom de la séance"
                  value={seance.nom} onChange={e => updateSeance(si, "nom", e.target.value)} />
                <select style={{ ...INPUT_STYLE, flex:1 }} value={seance.jour}
                  onChange={e => updateSeance(si, "jour", e.target.value)}>
                  {JOURS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                <div style={{ display:"flex", alignItems:"center", gap:4, flex:1 }}>
                  <input style={{ ...INPUT_STYLE, width:60 }} type="number" min={10} max={180}
                    value={seance.duree_min} onChange={e => updateSeance(si, "duree_min", e.target.value)} />
                  <span style={{ fontSize:10, color:"#555", whiteSpace:"nowrap" }}>min</span>
                </div>
                {seances.length > 1 && (
                  <button style={{ ...BTN_GHOST, color:"#E07070", borderColor:"rgba(224,112,112,0.3)", flexShrink:0 }}
                    onClick={() => removeSeance(si)}>✕</button>
                )}
              </div>

              {/* Exercices */}
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {/* Header colonnes */}
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 28px", gap:6, padding:"0 2px" }}>
                  {["Exercice","Séries","Reps","Charge","Repos(s)",""].map((h, i) => (
                    <div key={i} style={{ fontSize:9, color:"#444", textTransform:"uppercase", letterSpacing:"1px" }}>{h}</div>
                  ))}
                </div>

                {seance.exercices.map((exo, ei) => (
                  <div key={ei} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 28px", gap:6, alignItems:"center" }}>
                    <input style={INPUT_STYLE} placeholder="Nom exercice" value={exo.nom}
                      onChange={e => updateExo(si, ei, "nom", e.target.value)} />
                    <input style={INPUT_STYLE} type="number" min={1} max={10} value={exo.series}
                      onChange={e => updateExo(si, ei, "series", e.target.value)} />
                    <input style={INPUT_STYLE} placeholder="8-12" value={exo.reps}
                      onChange={e => updateExo(si, ei, "reps", e.target.value)} />
                    <input style={INPUT_STYLE} placeholder="60kg" value={exo.charge}
                      onChange={e => updateExo(si, ei, "charge", e.target.value)} />
                    <input style={INPUT_STYLE} type="number" min={0} value={exo.repos_sec}
                      onChange={e => updateExo(si, ei, "repos_sec", e.target.value)} />
                    <button style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:14, padding:0 }}
                      onClick={() => removeExo(si, ei)}>✕</button>
                  </div>
                ))}

                <button style={{ ...BTN_GHOST, alignSelf:"flex-start", marginTop:4 }}
                  onClick={() => addExo(si)}>+ Exercice</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sauvegarde ─────────────────────────────────────────────────────── */}
      <button style={{ ...BTN_GOLD, opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer" }}
        onClick={handleSave} disabled={saving}>
        {saving ? "Sauvegarde en cours..." : `💾 Sauvegarder le programme de ${clientNom?.split(" ")[0] || "ce client"}`}
      </button>
    </div>
  );
}

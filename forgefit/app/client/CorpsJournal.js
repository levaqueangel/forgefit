"use client";
import { useState, useEffect, useRef } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// ── Graphique poids SVG ────────────────────────────────────────────────────
function WeightChart({ entries, targetWeight }) {
  if (entries.length < 2) return (
    <div style={{ textAlign:"center", padding:"2rem 1rem", color:"#333",
      fontFamily:"'Cormorant Garamond',serif", fontSize:15, fontStyle:"italic" }}>
      Saisis au moins 2 mesures pour voir le graphique.
    </div>
  );

  const vals = entries.map(e => parseFloat(e.poids)).filter(v => !isNaN(v));
  if (vals.length < 2) return null;

  const W = 320, H = 100, PADX = 8, PADY = 10;
  const min = Math.min(...vals, targetWeight ? parseFloat(targetWeight) : Infinity) - 2;
  const max = Math.max(...vals) + 2;
  const range = max - min || 1;

  const toX = (i) => PADX + (i / (vals.length - 1)) * (W - PADX * 2);
  const toY = (v) => PADY + (H - PADY * 2) - ((v - min) / range) * (H - PADY * 2);

  const pts = vals.map((v, i) => [toX(i), toY(v)]);
  const pathD = pts.map((p, i) => {
    if (i === 0) return `M ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const prev = pts[i - 1];
    const cx = ((prev[0] + p[0]) / 2).toFixed(1);
    return `C ${cx} ${prev[1].toFixed(1)} ${cx} ${p[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  }).join(" ");

  const areaD = `${pathD} L ${pts[pts.length-1][0].toFixed(1)} ${H} L ${pts[0][0].toFixed(1)} ${H} Z`;
  const trend = vals[vals.length-1] - vals[0];
  const trendColor = trend < 0 ? "#7AE07A" : trend > 0 ? "#E07070" : "#C9A84C";
  const trendLabel = trend < 0 ? `↓ ${Math.abs(trend).toFixed(1)} kg` : trend > 0 ? `↑ ${Math.abs(trend).toFixed(1)} kg` : "→ stable";

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#555" }}>Évolution du poids</span>
        <span style={{ fontSize:11, fontWeight:700, color:trendColor }}>{trendLabel}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
        <defs>
          <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#C9A84C" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Grille */}
        {[0.25, 0.5, 0.75].map(v => (
          <line key={v} x1={PADX} x2={W-PADX}
            y1={(PADY + (H - PADY*2) * (1-v)).toFixed(1)}
            y2={(PADY + (H - PADY*2) * (1-v)).toFixed(1)}
            stroke="#1A1A1A" strokeWidth="0.5"/>
        ))}
        {/* Zone */}
        <path d={areaD} fill="url(#wGrad)"/>
        {/* Ligne */}
        <path d={pathD} fill="none" stroke="#C9A84C" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"/>
        {/* Objectif */}
        {targetWeight && !isNaN(parseFloat(targetWeight)) && (
          <line x1={PADX} x2={W-PADX}
            y1={toY(parseFloat(targetWeight)).toFixed(1)}
            y2={toY(parseFloat(targetWeight)).toFixed(1)}
            stroke="#7AE07A" strokeWidth="1" strokeDasharray="4 4"/>
        )}
        {/* Points */}
        {pts.map(([x,y], i) => (
          <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3"
            fill="#0A0A0A" stroke="#C9A84C" strokeWidth="2"/>
        ))}
        {/* Labels */}
        {pts.map(([x,y], i) => (
          <text key={i} x={x.toFixed(1)} y={(y-7).toFixed(1)}
            textAnchor="middle" fontSize="8" fill="#888">{vals[i].toFixed(1)}</text>
        ))}
      </svg>
      {/* Légende dates */}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
        {[entries[0], entries[Math.floor(entries.length/2)], entries[entries.length-1]]
          .filter(Boolean).map((e,i) => (
          <span key={i} style={{ fontSize:9, color:"#333" }}>
            {new Date(e.date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Graphique mensuration SVG ─────────────────────────────────────────────
function MesureChart({ entries, field, label, color }) {
  const vals = entries.map(e => parseFloat(e[field])).filter(v => !isNaN(v));
  if (vals.length < 2) return null;

  const W = 280, H = 56, PADX = 6, PADY = 6;
  const min = Math.min(...vals) - 1;
  const max = Math.max(...vals) + 1;
  const range = max - min || 1;

  const pts = vals.map((v,i) => [
    PADX + (i/(vals.length-1))*(W-PADX*2),
    PADY + (H-PADY*2) - ((v-min)/range)*(H-PADY*2)
  ]);
  const pathD = pts.map((p,i) => {
    if (i===0) return `M ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const prev = pts[i-1];
    const cx = ((prev[0]+p[0])/2).toFixed(1);
    return `C ${cx} ${prev[1].toFixed(1)} ${cx} ${p[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  }).join(" ");
  const trend = vals[vals.length-1] - vals[0];

  return (
    <div style={{ background:"#0D0D0D", borderRadius:10, padding:"10px 12px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#555" }}>{label}</span>
        <span style={{ fontSize:10, fontWeight:700, color:trend<=0?"#7AE07A":"#E07070" }}>
          {trend<=0?`↓ ${Math.abs(trend).toFixed(1)}`:`↑ ${trend.toFixed(1)}`} cm
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        {pts.map(([x,y],i) => (
          <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.5"
            fill="#0A0A0A" stroke={color} strokeWidth="1.5"/>
        ))}
      </svg>
    </div>
  );
}

// ── Composant principal CorpsJournal ──────────────────────────────────────
export function CorpsJournal({ uid, addToast, programmeData }) {
  const [entries, setEntries] = useState([]);
  const [form, setForm]       = useState({ poids:"", taille_tour:"", bras:"", cuisses:"", poitrine:"", epaules:"" });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [activeGraph, setActiveGraph] = useState("poids");
  const [targetWeight, setTargetWeight] = useState("");

  // Charger les entrées depuis Firestore
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "clients", uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setEntries(data.corpsMesures || []);
        // Objectif poids depuis le programme
        if (data.programmeData?.poids_cible) setTargetWeight(String(data.programmeData.poids_cible));
      }
    }).catch(() => {});
  }, [uid]);

  const save = async () => {
    if (!form.poids && !form.taille_tour && !form.bras && !form.cuisses) return;
    setSaving(true);
    try {
      const entry = {
        date: new Date().toISOString(),
        ...(form.poids       && { poids:       parseFloat(form.poids) }),
        ...(form.taille_tour && { taille_tour: parseFloat(form.taille_tour) }),
        ...(form.bras        && { bras:        parseFloat(form.bras) }),
        ...(form.cuisses     && { cuisses:     parseFloat(form.cuisses) }),
        ...(form.poitrine    && { poitrine:    parseFloat(form.poitrine) }),
        ...(form.epaules     && { epaules:     parseFloat(form.epaules) }),
      };
      const newEntries = [...entries, entry].slice(-52); // 52 semaines max
      await updateDoc(doc(db, "clients", uid), { corpsMesures: newEntries });
      setEntries(newEntries);
      setForm({ poids:"", taille_tour:"", bras:"", cuisses:"", poitrine:"", epaules:"" });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
      addToast("Mesures enregistrées ✓", "success");
    } catch { addToast("Erreur de sauvegarde", "error"); }
    setSaving(false);
  };

  // Dernière entrée
  const last = entries[entries.length - 1];

  // Calcul IMC si poids et taille disponibles
  const imc = last?.poids && programmeData?.taille
    ? (last.poids / Math.pow(programmeData.taille / 100, 2)).toFixed(1)
    : null;

  const MESURE_FIELDS = [
    { key:"poids",       label:"Poids",       unit:"kg",  icon:"⚖️",  color:"#C9A84C", placeholder:"ex: 78.5" },
    { key:"taille_tour", label:"Tour de taille", unit:"cm", icon:"📏", color:"#7AE07A", placeholder:"ex: 86" },
    { key:"bras",        label:"Bras",        unit:"cm",  icon:"💪",  color:"#5DCAA5", placeholder:"ex: 35" },
    { key:"cuisses",     label:"Cuisses",     unit:"cm",  icon:"🦵",  color:"#E8C87A", placeholder:"ex: 58" },
    { key:"poitrine",    label:"Poitrine",    unit:"cm",  icon:"📐",  color:"#88A0E0", placeholder:"ex: 98" },
    { key:"epaules",     label:"Épaules",     unit:"cm",  icon:"🏋️",  color:"#E07070", placeholder:"ex: 115" },
  ];

  const GRAPH_OPTIONS = [
    { key:"poids",       label:"Poids",    active: entries.filter(e=>e.poids).length >= 2 },
    { key:"taille_tour", label:"Taille",   active: entries.filter(e=>e.taille_tour).length >= 2 },
    { key:"bras",        label:"Bras",     active: entries.filter(e=>e.bras).length >= 2 },
    { key:"cuisses",     label:"Cuisses",  active: entries.filter(e=>e.cuisses).length >= 2 },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Stats récentes */}
      {last && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {[
            { label:"Poids actuel", val:last.poids?`${last.poids} kg`:"—", color:"#C9A84C" },
            { label:"Tour taille",  val:last.taille_tour?`${last.taille_tour} cm`:"—", color:"#7AE07A" },
            { label:"IMC estimé",   val:imc||"—", color:"#5DCAA5" },
          ].map((s,i) => (
            <div key={i} style={{ background:"#0D0D0D", borderRadius:12, padding:"12px 14px", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:8, right:8, height:2, background:s.color, opacity:0.6, borderRadius:"0 0 2px 2px" }}/>
              <div style={{ fontSize:16, fontWeight:700, color:s.color, marginTop:4, marginBottom:2 }}>{s.val}</div>
              <div style={{ fontSize:9, letterSpacing:"1.5px", textTransform:"uppercase", color:"#444" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sélecteur graphique */}
      {entries.length >= 2 && (
        <div>
          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            {GRAPH_OPTIONS.filter(g => g.active).map(g => (
              <button key={g.key} onClick={() => setActiveGraph(g.key)} style={{
                fontSize:9, letterSpacing:"1.5px", textTransform:"uppercase",
                fontFamily:"'Syne',sans-serif", padding:"5px 12px", cursor:"pointer",
                borderRadius:20, transition:"all 0.15s",
                background: activeGraph===g.key ? "rgba(201,168,76,0.12)" : "transparent",
                border: `0.5px solid ${activeGraph===g.key ? "rgba(201,168,76,0.5)" : "#1E1E1E"}`,
                color: activeGraph===g.key ? "#C9A84C" : "#555",
              }}>{g.label}</button>
            ))}
          </div>

          {activeGraph === "poids" && <WeightChart entries={entries.filter(e=>e.poids)} targetWeight={targetWeight}/>}
          {activeGraph === "taille_tour" && <MesureChart entries={entries.filter(e=>e.taille_tour)} field="taille_tour" label="Tour de taille" color="#7AE07A"/>}
          {activeGraph === "bras" && <MesureChart entries={entries.filter(e=>e.bras)} field="bras" label="Périmètre bras" color="#5DCAA5"/>}
          {activeGraph === "cuisses" && <MesureChart entries={entries.filter(e=>e.cuisses)} field="cuisses" label="Périmètre cuisses" color="#E8C87A"/>}
        </div>
      )}

      {/* Formulaire de saisie */}
      <div>
        <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:10 }}>
          Nouvelle mesure — {new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {MESURE_FIELDS.map(f => (
            <div key={f.key} style={{ background:"#0D0D0D", border:`0.5px solid ${form[f.key] ? f.color+"44" : "#1A1A1A"}`, borderRadius:10, padding:"10px 12px", transition:"border-color 0.2s" }}>
              <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:f.color, marginBottom:5 }}>
                {f.icon} {f.label}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <input
                  type="number" step="0.1" value={form[f.key]}
                  onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                  placeholder={f.placeholder}
                  style={{ flex:1, background:"transparent", border:"none", color:"#F0EDE8",
                    fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, outline:"none" }}
                />
                <span style={{ fontSize:11, color:"#444", flexShrink:0 }}>{f.unit}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={save} disabled={saving || Object.values(form).every(v => !v)} style={{
          marginTop:10, width:"100%", padding:"12px",
          background: saved ? "#1A3A1A" : Object.values(form).some(v => v) ? "linear-gradient(135deg,#C9A84C,#A67C2E)" : "#111",
          border: `0.5px solid ${saved ? "#3A6A3A" : "#1A1A1A"}`,
          color: saved ? "#7AE07A" : Object.values(form).some(v => v) ? "#0A0A0A" : "#333",
          fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"2px",
          textTransform:"uppercase", cursor: saving || Object.values(form).every(v => !v) ? "not-allowed" : "pointer",
          borderRadius:10, transition:"all 0.2s",
        }}>
          {saving ? "Sauvegarde..." : saved ? "✓ Enregistré !" : "Enregistrer les mesures"}
        </button>
      </div>

      {/* Historique */}
      {entries.length > 0 && (
        <div>
          <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:8 }}>
            Historique ({entries.length} entrée{entries.length>1?"s":""})
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:200, overflowY:"auto" }}>
            {[...entries].reverse().map((e, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                background:"#0D0D0D", borderRadius:8, fontSize:11 }}>
                <span style={{ color:"#333", fontSize:10, flexShrink:0 }}>
                  {new Date(e.date).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}
                </span>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {e.poids        && <span style={{ color:"#C9A84C" }}>⚖️ {e.poids} kg</span>}
                  {e.taille_tour  && <span style={{ color:"#7AE07A" }}>📏 {e.taille_tour} cm</span>}
                  {e.bras         && <span style={{ color:"#5DCAA5" }}>💪 {e.bras} cm</span>}
                  {e.cuisses      && <span style={{ color:"#E8C87A" }}>🦵 {e.cuisses} cm</span>}
                  {e.poitrine     && <span style={{ color:"#88A0E0" }}>📐 {e.poitrine} cm</span>}
                  {e.epaules      && <span style={{ color:"#E07070" }}>🏋️ {e.epaules} cm</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

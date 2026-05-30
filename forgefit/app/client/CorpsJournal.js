"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

// Graphique SVG d'évolution du poids
function WeightChart({ entries }) {
  if (entries.length < 2) return null;
  const vals = entries.map(e => parseFloat(e.poids)).filter(Boolean);
  if (vals.length < 2) return null;

  const W = 280, H = 80;
  const min = Math.min(...vals) - 1;
  const max = Math.max(...vals) + 1;
  const range = max - min || 1;

  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return [x, y];
  });

  const path = pts.map((p, i) => {
    if (i === 0) return `M ${p[0]} ${p[1]}`;
    const prev = pts[i - 1];
    const cx = (prev[0] + p[0]) / 2;
    return `C ${cx} ${prev[1]} ${cx} ${p[1]} ${p[0]} ${p[1]}`;
  }).join(" ");

  const areaPath = `${path} L ${pts[pts.length-1][0]} ${H} L 0 ${H} Z`;
  const trend = vals[vals.length-1] - vals[0];
  const trendColor = trend < 0 ? "#7AE07A" : trend > 0 ? "#E07070" : "#C9A84C";
  const trendLabel = trend < 0 ? `↓ ${Math.abs(trend).toFixed(1)} kg` : trend > 0 ? `↑ ${trend.toFixed(1)} kg` : "= Stable";

  return (
    <div style={{ marginTop: 12, marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#555" }}>
          Évolution du poids
        </span>
        <span style={{ fontSize: 11, color: trendColor, fontWeight: 700 }}>{trendLabel}</span>
      </div>
      <div style={{ background: "#0A0A0A", borderRadius: 4, padding: "8px 4px 4px", overflow: "hidden" }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Zone remplie */}
          <path d={areaPath} fill="url(#chartGrad)" />
          {/* Ligne */}
          <path d={path} fill="none" stroke={trendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Points */}
          {pts.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3.5 : 2}
              fill={i === pts.length - 1 ? trendColor : "#2A2A2A"}
              stroke={trendColor} strokeWidth="1" />
          ))}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: "#444" }}>{entries[entries.length - vals.length]?.date || ""}</span>
          <span style={{ fontSize: 10, color: trendColor, fontWeight: 700 }}>{vals[vals.length-1]} kg</span>
        </div>
      </div>
    </div>
  );
}

export function CorpsJournal({ uid, addToast }) {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ poids: "", taille_tour: "", bras: "", cuisses: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "clients", uid)).then(snap => {
      if (snap.exists()) setEntries(snap.data().bodyLog || []);
    }).catch(() => {});
  }, [uid]);

  const save = async () => {
    if (!form.poids && !form.taille_tour) return;
    setSaving(true);
    const entry = {
      ...form,
      date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      ts: Date.now()
    };
    const newEntries = [...entries.slice(-11), entry];
    try {
      await updateDoc(doc(db, "clients", uid), { bodyLog: newEntries });
      setEntries(newEntries);
      setForm({ poids: "", taille_tour: "", bras: "", cuisses: "" });
      setSaved(true);
      addToast?.("Mesures enregistrées ✓", "success");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error("bodyLog:", e); }
    setSaving(false);
  };

  const fields = [
    { key: "poids",       label: "Poids",            unit: "kg",  icon: "⚖️" },
    { key: "taille_tour", label: "Tour de taille",   unit: "cm",  icon: "📏" },
    { key: "bras",        label: "Tour de bras",     unit: "cm",  icon: "💪" },
    { key: "cuisses",     label: "Tour de cuisses",  unit: "cm",  icon: "🦵" },
  ];

  return (
    <div>
      {/* Graphique poids */}
      <WeightChart entries={entries} />

      {/* Formulaire de saisie */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12, marginTop: 14 }}>
        {fields.map(f => (
          <div key={f.key} style={{
            background: focused === f.key ? "#111" : "#0D0D0D",
            border: `0.5px solid ${focused === f.key ? "#C9A84C" : "#1A1A1A"}`,
            borderRadius: 4, padding: "10px 12px",
            transition: "all 0.15s",
            transform: focused === f.key ? "scale(1.02)" : "scale(1)",
          }}>
            <div style={{ fontSize: 11, color: focused === f.key ? "#C9A84C" : "#555", marginBottom: 6, transition: "color 0.15s" }}>
              {f.icon} {f.label}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="number"
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                onFocus={() => setFocused(f.key)}
                onBlur={() => setFocused(null)}
                placeholder="—"
                style={{
                  flex: 1, background: "transparent", border: "none",
                  color: "#F0EDE8", fontFamily: "'Syne', sans-serif",
                  fontSize: 18, fontWeight: 700, outline: "none", width: "100%",
                }}
              />
              <span style={{ fontSize: 11, color: "#444" }}>{f.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton save */}
      <button onClick={save} disabled={saving || (!form.poids && !form.taille_tour)} style={{
        width: "100%", padding: "11px",
        background: saved ? "#1A3A1A" : (!form.poids && !form.taille_tour) ? "#111" : "linear-gradient(135deg,#C9A84C,#A67C2E)",
        border: `0.5px solid ${saved ? "#3A6A3A" : "transparent"}`,
        color: saved ? "#7AE07A" : (!form.poids && !form.taille_tour) ? "#333" : "#0A0A0A",
        fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700,
        letterSpacing: "2px", textTransform: "uppercase",
        cursor: saving || (!form.poids && !form.taille_tour) ? "not-allowed" : "pointer",
        borderRadius: 2, marginBottom: 14, transition: "all 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        {saving
          ? <><div style={{ width: 12, height: 12, border: "2px solid rgba(0,0,0,0.15)", borderTopColor: "#C9A84C", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Enregistrement...</>
          : saved ? "✓ Enregistré !" : "Enregistrer les mesures"}
      </button>

      {/* Historique */}
      {entries.length > 0 && (
        <div>
          <div style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>
            Historique ({entries.length} entrées)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {entries.slice(-4).reverse().map((e, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 10px", background: i === 0 ? "rgba(201,168,76,0.04)" : "#0A0A0A",
                border: `0.5px solid ${i === 0 ? "rgba(201,168,76,0.2)" : "#1A1A1A"}`,
                borderRadius: 2, fontSize: 12, transition: "background 0.15s",
              }}>
                <span style={{ color: "#555" }}>{e.date}</span>
                <div style={{ display: "flex", gap: 10 }}>
                  {e.poids        && <span style={{ color: "#F0EDE8" }}><span style={{ color: "#555" }}>⚖️ </span>{e.poids} kg</span>}
                  {e.taille_tour  && <span style={{ color: "#F0EDE8" }}><span style={{ color: "#555" }}>📏 </span>{e.taille_tour} cm</span>}
                  {e.bras         && <span style={{ color: "#F0EDE8" }}><span style={{ color: "#555" }}>💪 </span>{e.bras} cm</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

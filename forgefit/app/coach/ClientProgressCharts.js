"use client";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// ── Sparkline SVG générique ────────────────────────────────────────────────────
function Sparkline({ data, color = "#E8B000", height = 48, showDots = false }) {
  if (!data || data.length < 2) return (
    <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ fontSize:11, color:"#333" }}>Pas assez de données</span>
    </div>
  );

  const w = 260;
  const pad = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + ((max - v) / range) * (height - pad * 2);
    return [x, y];
  });

  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length-1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ display:"block" }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color.replace("#","")})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {showDots && pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill={color} />
      ))}
    </svg>
  );
}

// ── Barre horizontale ──────────────────────────────────────────────────────────
function BarChart({ data, color = "#E8B000", labelKey = "label", valueKey = "value", maxVal }) {
  if (!data?.length) return <span style={{ fontSize:11, color:"#333" }}>Pas de données</span>;
  const max = maxVal || Math.max(...data.map(d => d[valueKey])) || 1;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:9, color:"#555", width:60, flexShrink:0, textAlign:"right", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d[labelKey]}</span>
          <div style={{ flex:1, background:"#111", borderRadius:2, height:8, overflow:"hidden" }}>
            <div style={{ width:`${Math.min(100,(d[valueKey]/max)*100)}%`, height:"100%", background:color, borderRadius:2, transition:"width 0.4s" }} />
          </div>
          <span style={{ fontSize:9, color:color, width:28, textAlign:"right", flexShrink:0 }}>{d[valueKey]}</span>
        </div>
      ))}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export function ClientProgressCharts({ clientId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    getDoc(doc(db, "clients", clientId)).then(snap => {
      if (!snap.exists()) { setLoading(false); return; }
      const d = snap.data();

      // ── Poids — depuis corpsMesures ou champ poids direct ──────────────────
      const mesures = d.corpsMesures || [];
      const poidsHistory = mesures
        .filter(m => m.poids)
        .slice(-14)
        .map(m => ({ val: parseFloat(m.poids), date: m.date?.slice(5,10) || "" }));
      // Fallback : poids du profil uniquement
      if (poidsHistory.length === 0 && d.poids) {
        poidsHistory.push({ val: parseFloat(d.poids), date: "profil" });
      }

      // ── Calories moyennes 7j ───────────────────────────────────────────────
      const journal = d.repasJournal || [];
      const now = Date.now();
      const calsByDay = {};
      journal.forEach(r => {
        const dayTs = new Date(r.date).setHours(0,0,0,0);
        const age = now - dayTs;
        if (age > 7 * 86400000) return;
        const key = new Date(r.date).toLocaleDateString("fr-FR", { weekday:"short" });
        calsByDay[key] = (calsByDay[key] || 0) + (r.calories || 0);
      });
      const calData = Object.entries(calsByDay)
        .map(([label, value]) => ({ label, value: Math.round(value) }))
        .slice(-7);

      // ── Taux complétion séances ────────────────────────────────────────────
      const historique = d.seanceHistorique || [];
      const seancesParNom = {};
      historique.slice(-20).forEach(s => {
        const nom = (s.seanceNom || "Séance").slice(0, 12);
        seancesParNom[nom] = (seancesParNom[nom] || 0) + 1;
      });
      const seanceData = Object.entries(seancesParNom)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // ── Streak 30j (sparkline) ─────────────────────────────────────────────
      const streakMax = d.streakDays || 0;

      setData({ poidsHistory, calData, seanceData, streakMax, totalSeances: historique.length });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [clientId]);

  if (loading) return (
    <div style={{ padding:"16px 14px", borderTop:"0.5px solid #1A1A1A" }}>
      <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#E8B000", marginBottom:10 }}>Progression</div>
      <div style={{ fontSize:11, color:"#333", fontStyle:"italic" }}>Chargement…</div>
    </div>
  );

  if (!data) return null;

  return (
    <div style={{ padding:"14px", borderTop:"0.5px solid #1A1A1A" }}>
      <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#E8B000", marginBottom:14 }}>— Progression client</div>

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* Poids */}
        {data.poidsHistory.length >= 2 && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:10, color:"#555", letterSpacing:"1px", textTransform:"uppercase" }}>Évolution poids</span>
              <span style={{ fontSize:11, color:"#E8B000", fontWeight:700 }}>
                {data.poidsHistory[data.poidsHistory.length-1]?.val} kg
                {data.poidsHistory.length >= 2 && (
                  <span style={{ fontSize:9, color: (data.poidsHistory[data.poidsHistory.length-1]?.val - data.poidsHistory[0]?.val) <= 0 ? "#7AE07A":"#E07070", marginLeft:6 }}>
                    {((data.poidsHistory[data.poidsHistory.length-1]?.val - data.poidsHistory[0]?.val) > 0 ? "+" : "")}
                    {(data.poidsHistory[data.poidsHistory.length-1]?.val - data.poidsHistory[0]?.val).toFixed(1)} kg
                  </span>
                )}
              </span>
            </div>
            <Sparkline data={data.poidsHistory.map(p => p.val)} color="#E8B000" height={44} showDots />
          </div>
        )}

        {/* Calories 7j */}
        {data.calData.length > 0 && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:10, color:"#555", letterSpacing:"1px", textTransform:"uppercase" }}>Calories / jour (7j)</span>
              <span style={{ fontSize:11, color:"#7AE07A", fontWeight:700 }}>
                {data.calData.length > 0 ? Math.round(data.calData.reduce((s,d)=>s+d.value,0)/data.calData.length) : "—"} moy.
              </span>
            </div>
            <Sparkline data={data.calData.map(d => d.value)} color="#7AE07A" height={44} />
          </div>
        )}

        {/* Séances complétées */}
        {data.seanceData.length > 0 && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:10, color:"#555", letterSpacing:"1px", textTransform:"uppercase" }}>Séances (top 5)</span>
              <span style={{ fontSize:11, color:"#5DCAA5", fontWeight:700 }}>{data.totalSeances} total</span>
            </div>
            <BarChart data={data.seanceData} color="#5DCAA5" labelKey="label" valueKey="value" />
          </div>
        )}

        {/* Streak */}
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ flex:1, background:"rgba(232,176,0,0.06)", border:"0.5px solid rgba(232,176,0,0.15)", borderRadius:6, padding:"10px 12px", textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:700, color:"#E8B000" }}>{data.streakMax}</div>
            <div style={{ fontSize:9, color:"#555", textTransform:"uppercase", letterSpacing:"1px", marginTop:2 }}>Streak actuel</div>
          </div>
          <div style={{ flex:1, background:"rgba(93,202,165,0.06)", border:"0.5px solid rgba(93,202,165,0.15)", borderRadius:6, padding:"10px 12px", textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:700, color:"#5DCAA5" }}>{data.totalSeances}</div>
            <div style={{ fontSize:9, color:"#555", textTransform:"uppercase", letterSpacing:"1px", marginTop:2 }}>Total séances</div>
          </div>
        </div>

        {/* Message si peu de données */}
        {data.poidsHistory.length < 2 && data.calData.length === 0 && data.seanceData.length === 0 && (
          <div style={{ fontSize:11, color:"#333", fontStyle:"italic", textAlign:"center", padding:"8px 0" }}>
            Les graphiques apparaîtront au fil des séances et de l'utilisation de l'app.
          </div>
        )}
      </div>
    </div>
  );
}

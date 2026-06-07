"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

/* ── SVG courbe charge ─────────────────────────────────────────────────────── */
function ChargeChart({ hist }) {
  const vals = hist.map(h => parseFloat(h.v)).filter(v => !isNaN(v));
  if (vals.length < 2) return null;

  const W = 280, H = 54, PAD = { x: 4, y: 6 };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = (max - min) || 1;

  const toX = i => PAD.x + (i / (vals.length - 1)) * (W - PAD.x * 2);
  const toY = v => H - PAD.y - ((v - min) / range) * (H - PAD.y * 2);

  const pts = vals.map((v, i) => [toX(i), toY(v)]);

  /* Courbe lissée via bezier cubique */
  const linePath = pts.map((p, i) => {
    if (i === 0) return `M ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const prev = pts[i - 1];
    const cx = (((prev[0] + p[0]) / 2)).toFixed(1);
    return `C ${cx} ${prev[1].toFixed(1)} ${cx} ${p[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  }).join(" ");

  const areaPath = `${linePath} L ${pts[pts.length - 1][0].toFixed(1)} ${H} L ${pts[0][0].toFixed(1)} ${H} Z`;

  const last = vals[vals.length - 1];
  const prev = vals[vals.length - 2];
  const trend = last - prev;
  const trendColor = trend > 0 ? "#7AE07A" : trend < 0 ? "#E07070" : "#C9A84C";
  const trendLabel = trend > 0 ? `↑ +${trend.toFixed(1)}` : trend < 0 ? `↓ ${trend.toFixed(1)}` : "→ stable";

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "#444" }}>
          {hist.length} sessions
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: trendColor, fontFamily: "'Syne',sans-serif" }}>
          {trendLabel}
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id={`cg-${vals[0]}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Aire remplie */}
        <path d={areaPath} fill={`url(#cg-${vals[0]})`} />
        {/* Courbe */}
        <path d={linePath} fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
        {/* Points */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3 : 2}
            fill={i === pts.length - 1 ? "#C9A84C" : "#0A0A0A"}
            stroke="#C9A84C"
            strokeWidth={i === pts.length - 1 ? 0 : 1.5}
          />
        ))}
        {/* Labels dernière valeur */}
        <text
          x={pts[pts.length - 1][0]} y={pts[pts.length - 1][1] - 7}
          textAnchor="middle" fontSize="10" fill="#C9A84C"
          fontFamily="Syne, sans-serif" fontWeight="700"
        >
          {last}
        </text>
        {/* Dates premier / dernier */}
        <text x={pts[0][0]} y={H} textAnchor="start" fontSize="8" fill="#444" fontFamily="Syne, sans-serif">
          {hist[0].d}
        </text>
        <text x={pts[pts.length - 1][0]} y={H} textAnchor="end" fontSize="8" fill="#444" fontFamily="Syne, sans-serif">
          {hist[hist.length - 1].d}
        </text>
      </svg>
    </div>
  );
}

export function ChargesTab({ uid, exercices }) {
  const [chargesLog, setChargesLog] = useState({});
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState({});
  const [newPB, setNewPB] = useState(null);
  const weekKey = new Date().toISOString().slice(0,7) + "-W" + Math.ceil(new Date().getDate() / 7);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "clients", uid)).then(snap => {
      if (snap.exists()) setChargesLog(snap.data().chargesLog || {});
    }).catch(() => {});
  }, [uid]);

  const saveCharge = async (exoNom, val) => {
    if (!val.trim()) return;
    setSaving(s => ({...s, [exoNom]: true}));
    const newLog = {
      ...chargesLog,
      [exoNom]: [...(chargesLog[exoNom] || []).slice(-7), { w: weekKey, v: val, d: new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"}) }]
    };
    try {
      await updateDoc(doc(db, "clients", uid), { chargesLog: newLog });
      // Détecter un nouveau record personnel
      const prev = chargesLog[exoNom] || [];
      const prevMax = prev.length > 0 ? Math.max(...prev.map(h => parseFloat(h.v)||0)) : 0;
      const newVal = parseFloat(val) || 0;
      if (newVal > prevMax && prevMax > 0) {
        setNewPB(exoNom);
        setTimeout(() => setNewPB(null), 3000);
      }
      setChargesLog(newLog);
      setInputs(i => ({...i, [exoNom]: ""}));
    } catch(e) { console.error("chargesLog:", e); }
    setSaving(s => ({...s, [exoNom]: false}));
  };

  if (exercices.length === 0) return (
    <div style={{textAlign:"center",padding:"3rem",color:"#444",fontSize:13,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:16}}>
      Lance ton bilan pour avoir accès au suivi des charges.
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {exercices.map((e, i) => {
        const hist = chargesLog[e.nom] || [];
        return (
          <div key={i} style={{
              background:"#0D0D0D",
              borderRadius:14,
              border:`0.5px solid ${newPB===e.nom?"#C9A84C":"#1A1A1A"}`,
              borderRadius:4,padding:"14px",
              transition:"border-color 0.3s",
              boxShadow:newPB===e.nom?"0 0 12px rgba(201,168,76,0.15)":"none",
            }}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#F0EDE8",display:"flex",alignItems:"center",gap:6}}>
                  {e.nom}
                  {newPB===e.nom && (
                    <span style={{
                      fontSize:9,fontWeight:700,letterSpacing:"2px",
                      background:"linear-gradient(135deg,#C9A84C,#E8C87A)",
                      color:"#0A0A0A",padding:"2px 7px",borderRadius:20,
                      animation:"checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
                    }}>🏆 PR</span>
                  )}
                </div>
                <div style={{fontSize:11,color:"#555"}}>{e.det}</div>
              </div>
              {hist.length > 0 && (
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:"#555"}}>Meilleur</div>
                  <div style={{fontSize:15,fontWeight:700,color:"#C9A84C"}}>
                    {hist.reduce((best, h) => parseFloat(h.v) > parseFloat(best.v) ? h : best, hist[0]).v}
                  </div>
                </div>
              )}
            </div>
            {/* Historique — graphique SVG courbe */}
            {hist.length >= 2 && (
              <ChargeChart hist={hist.slice(-8)} />
            )}
            {hist.length === 1 && (
              <div style={{fontSize:11,color:"#555",marginBottom:10,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic"}}>
                Encore {7 - hist.length} entrée{7 - hist.length > 1 ? "s" : ""} pour voir le graphique.
              </div>
            )}
            {/* Saisie */}
            <div style={{display:"flex",gap:6}}>
              <input
                type="text"
                value={inputs[e.nom] || ""}
                onChange={ev => setInputs(p => ({...p, [e.nom]: ev.target.value}))}
                onKeyDown={ev => { if(ev.key === "Enter") saveCharge(e.nom, inputs[e.nom]||""); }}
                placeholder="ex: 80 kg / 10 reps"
                style={{flex:1,background:"#0A0A0A",border:"0.5px solid #1E1E1E",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:12,padding:"9px 12px",outline:"none",borderRadius:10}}
              />
              <button
                onClick={() => saveCharge(e.nom, inputs[e.nom]||"")}
                disabled={saving[e.nom] || !inputs[e.nom]?.trim()}
                style={{
                  background: inputs[e.nom]?.trim() && !saving[e.nom] ? "linear-gradient(135deg,#C9A84C,#A67C2E)" : "#222",
                  border:"none", color: inputs[e.nom]?.trim() ? "#0A0A0A" : "#444",
                  padding:"0 14px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700,
                  cursor: inputs[e.nom]?.trim() && !saving[e.nom] ? "pointer" : "not-allowed",
                  borderRadius:2, flexShrink:0, transition:"all 0.15s",
                  display:"flex", alignItems:"center", justifyContent:"center", minWidth:38,
                }}>
                {saving[e.nom]
                  ? <div style={{width:12,height:12,border:"2px solid rgba(0,0,0,0.15)",borderTopColor:"#C9A84C",borderRadius:"50%",animation:"spin 0.7s linear infinite"}} />
                  : "✓"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Journal corporel ───────────────────────────────────────────────────


"use client";
import { useState, useEffect, memo } from "react";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

function ChargesTab({ uid, exercices }) {
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
            {/* Historique mini-graphique */}
            {hist.length > 0 && (
              <div style={{display:"flex",gap:4,marginBottom:10,alignItems:"flex-end",height:36}}>
                {hist.slice(-6).map((h, j) => {
                  const vals = hist.map(x => parseFloat(x.v)).filter(Boolean);
                  const max = Math.max(...vals) || 1;
                  const pct = (parseFloat(h.v) / max) * 100;
                  return (
                    <div key={j} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                      <div style={{width:"100%",background:"#C9A84C",borderRadius:2,height:`${Math.max(pct * 0.32, 4)}px`,opacity:j === hist.slice(-6).length-1 ? 1 : 0.45,transition:"height 0.5s ease"}}/>
                      <div style={{fontSize:9,color:"#444"}}>{h.d}</div>
                    </div>
                  );
                })}
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

export { memo(ChargesTab) as ChargesTab };

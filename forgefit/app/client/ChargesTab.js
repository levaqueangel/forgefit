"use client";
import { useState, useEffect } from "react";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export function ChargesTab({ uid, exercices }) {
  const [chargesLog, setChargesLog] = useState({});
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState({});
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
          <div key={i} style={{background:"#0D0D0D",border:"0.5px solid #1A1A1A",borderRadius:4,padding:"14px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#F0EDE8"}}>{e.nom}</div>
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
                style={{flex:1,background:"#111",border:"0.5px solid #242424",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:12,padding:"8px 12px",outline:"none",borderRadius:2}}
              />
              <button
                onClick={() => saveCharge(e.nom, inputs[e.nom]||"")}
                disabled={saving[e.nom]}
                style={{background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"0 14px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",borderRadius:2,flexShrink:0}}>
                {saving[e.nom] ? "..." : "✓"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Journal corporel ───────────────────────────────────────────────────

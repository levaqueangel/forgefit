"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export function CorpsJournal({ uid }) {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ poids:"", taille_tour:"", bras:"", cuisses:"" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "clients", uid)).then(snap => {
      if (snap.exists()) setEntries(snap.data().bodyLog || []);
    }).catch(() => {});
  }, [uid]);

  const save = async () => {
    if (!form.poids && !form.taille_tour) return;
    setSaving(true);
    const entry = { ...form, date: new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"}), ts: Date.now() };
    const newEntries = [...entries.slice(-11), entry];
    try {
      await updateDoc(doc(db, "clients", uid), { bodyLog: newEntries });
      setEntries(newEntries);
      setForm({ poids:"", taille_tour:"", bras:"", cuisses:"" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch(e) { console.error("bodyLog:", e); }
    setSaving(false);
  };

  const fields = [
    { key:"poids", label:"Poids", unit:"kg", icon:"⚖️" },
    { key:"taille_tour", label:"Tour de taille", unit:"cm", icon:"📏" },
    { key:"bras", label:"Tour de bras", unit:"cm", icon:"💪" },
    { key:"cuisses", label:"Tour de cuisses", unit:"cm", icon:"🦵" },
  ];

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {fields.map(f => (
          <div key={f.key} style={{background:"#0D0D0D",border:"0.5px solid #1A1A1A",borderRadius:4,padding:"10px 12px"}}>
            <div style={{fontSize:11,color:"#555",marginBottom:6}}>{f.icon} {f.label}</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <input
                type="number"
                value={form[f.key]}
                onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                placeholder="—"
                style={{flex:1,background:"transparent",border:"none",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,outline:"none",width:"100%"}}
              />
              <span style={{fontSize:11,color:"#444"}}>{f.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} style={{width:"100%",padding:"11px",background:saved?"#1A3A1A":"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:saved?"#7AE07A":"#0A0A0A",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",borderRadius:2,marginBottom:14}}>
        {saved ? "✓ Enregistré !" : saving ? "Enregistrement..." : "Enregistrer les mesures"}
      </button>
      {entries.length > 0 && (
        <div>
          <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#555",marginBottom:8}}>Historique</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {entries.slice(-4).reverse().map((e, i) => (
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",background:"#0A0A0A",borderRadius:2,fontSize:12}}>
                <span style={{color:"#555"}}>{e.date}</span>
                <div style={{display:"flex",gap:12}}>
                  {e.poids && <span style={{color:"#F0EDE8"}}><span style={{color:"#555"}}>⚖️ </span>{e.poids} kg</span>}
                  {e.taille_tour && <span style={{color:"#F0EDE8"}}><span style={{color:"#555"}}>📏 </span>{e.taille_tour} cm</span>}
                  {e.bras && <span style={{color:"#F0EDE8"}}><span style={{color:"#555"}}>💪 </span>{e.bras} cm</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────

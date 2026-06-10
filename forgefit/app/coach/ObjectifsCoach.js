"use client";
import { useState, useEffect } from "react";

export function ObjectifsCoach({ clientId, token, addToast }) {
  const [objectifs, setObjectifs] = useState([]);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!clientId || !open) return;
    setLoading(true);
    (async () => {
      try {
        const tok = await token();
        const res = await fetch(`/api/objectifs?clientId=${clientId}`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        const data = await res.json();
        setObjectifs((data.objectifs || []).map(o => o.texte));
      } catch {}
      setLoading(false);
    })();
  }, [clientId, open, token]);

  const ajouter = () => {
    if (!input.trim() || objectifs.length >= 5) return;
    setObjectifs(prev => [...prev, input.trim()]);
    setInput("");
  };

  const retirer = (i) => setObjectifs(prev => prev.filter((_,j) => j !== i));

  const sauvegarder = async () => {
    if (!clientId || saving || objectifs.length === 0) return;
    setSaving(true);
    try {
      const tok = await token();
      const res = await fetch("/api/objectifs", {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${tok}` },
        body: JSON.stringify({ clientId, objectifs }),
      });
      if (res.ok) {
        addToast?.("Objectifs envoyés ✓");
        setOpen(false);
      } else {
        const d = await res.json();
        addToast?.(d.error || "Erreur", "error");
      }
    } catch { addToast?.("Erreur réseau", "error"); }
    setSaving(false);
  };

  return (
    <div style={{ padding:"8px 14px", borderBottom:"0.5px solid #1A1A1A" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: open ? 8 : 0 }}>
        <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555" }}>🎯 Objectifs semaine</div>
        <button onClick={() => setOpen(p=>!p)} style={{ fontSize:9, letterSpacing:"1px", textTransform:"uppercase", background:"rgba(201,168,76,0.08)", border:"0.5px solid rgba(201,168,76,0.2)", color:"#C9A84C", padding:"3px 10px", cursor:"pointer", borderRadius:10, fontFamily:"'Syne',sans-serif" }}>
          {open ? "Fermer" : "Définir"}
        </button>
      </div>
      {open && (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {loading ? <div style={{ fontSize:11, color:"#666" }}>Chargement...</div> : (
            <>
              {objectifs.map((o,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6, background:"#0D0D0D", borderRadius:8, padding:"6px 10px" }}>
                  <span style={{ flex:1, fontSize:11, color:"#888" }}>{o}</span>
                  <button onClick={() => retirer(i)} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:12, lineHeight:1 }}>✕</button>
                </div>
              ))}
              {objectifs.length < 5 && (
                <div style={{ display:"flex", gap:6 }}>
                  <input value={input} onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&ajouter()}
                    placeholder={`Objectif ${objectifs.length+1}/5...`}
                    style={{ flex:1, background:"#0D0D0D", border:"0.5px solid #1A1A1A", borderRadius:8, padding:"6px 10px", color:"#F0EDE8", fontFamily:"'Syne',sans-serif", fontSize:11, outline:"none" }}
                  />
                  <button onClick={ajouter} disabled={!input.trim()} style={{ background:"rgba(201,168,76,0.1)", border:"0.5px solid rgba(201,168,76,0.3)", color:"#C9A84C", borderRadius:8, width:30, cursor:"pointer" }}>+</button>
                </div>
              )}
              {objectifs.length > 0 && (
                <button onClick={sauvegarder} disabled={saving} style={{ background:"linear-gradient(135deg,#C9A84C,#A67C2E)", border:"none", color:"#0A0A0A", fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", padding:"7px", borderRadius:8, cursor:"pointer" }}>
                  {saving ? "..." : "Envoyer →"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

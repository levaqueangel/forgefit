"use client";
import { useState, useEffect, useCallback } from "react";
import { auth } from "../firebase";

export function ObjectifsSection({ user, clientData, addToast }) {
  const [objectifs, setObjectifs] = useState([]);
  const [coches, setCoches] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const getToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/objectifs?clientId=${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setObjectifs(data.objectifs || []);
        setCoches(data.coches || {});
      } catch {}
      setLoading(false);
    })();
  }, [user, getToken]);

  const toggle = async (obj) => {
    if (saving) return;
    setSaving(obj.id);
    const newVal = !coches[obj.id];
    setCoches(prev => ({ ...prev, [obj.id]: newVal }));

    try {
      const token = await getToken();
      const res = await fetch("/api/objectifs", {
        method: "PATCH",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ objectifId: obj.id, done: newVal }),
      });
      const data = await res.json();
      if (data.tousFaits) {
        addToast?.("🎯 Tous les objectifs de la semaine atteints ! Badge débloqué !", "success");
      }
    } catch {
      // Rollback
      setCoches(prev => ({ ...prev, [obj.id]: !newVal }));
      addToast?.("Erreur de connexion", "error");
    }
    setSaving(null);
  };

  if (loading) return <div className="skel" style={{ height:80, borderRadius:12 }}/>;

  if (objectifs.length === 0) {
    return (
      <div style={{
        background:"rgba(201,168,76,0.03)", border:"0.5px solid rgba(201,168,76,0.1)",
        borderRadius:12, padding:"14px 16px", textAlign:"center",
      }}>
        <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:8 }}>
          🎯 Objectifs de la semaine
        </div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:"#333", fontStyle:"italic" }}>
          Ton coach définira tes objectifs de la semaine prochainement.
        </div>
      </div>
    );
  }

  const done = objectifs.filter(o => coches[o.id]).length;
  const all = objectifs.length;
  const pct = Math.round((done / all) * 100);

  return (
    <div style={{
      background:"rgba(201,168,76,0.03)", border:"0.5px solid rgba(201,168,76,0.15)",
      borderRadius:12, padding:"14px 16px",
    }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555" }}>
          🎯 Objectifs de la semaine
        </div>
        <div style={{ fontSize:11, color: done === all ? "#7AE07A" : "#C9A84C", fontWeight:700, fontFamily:"'Syne',sans-serif" }}>
          {done}/{all} {done === all ? "✓" : ""}
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ height:3, background:"#1A1A1A", borderRadius:4, overflow:"hidden", marginBottom:12 }}>
        <div style={{ height:"100%", width:`${pct}%`, background: done === all ? "#7AE07A" : "linear-gradient(90deg,#C9A84C,#E8C87A)", borderRadius:4, transition:"width 0.6s ease" }}/>
      </div>

      {/* Liste */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {objectifs.map(obj => {
          const isCoche = !!coches[obj.id];
          return (
            <div key={obj.id}
              onClick={() => toggle(obj)}
              style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"9px 12px", borderRadius:10,
                background: isCoche ? "rgba(122,224,122,0.06)" : "#0D0D0D",
                border: `0.5px solid ${isCoche ? "rgba(122,224,122,0.3)" : "#1A1A1A"}`,
                cursor: saving === obj.id ? "wait" : "pointer",
                transition:"all 0.15s",
                opacity: saving === obj.id ? 0.6 : 1,
              }}>
              <div style={{
                width:20, height:20, borderRadius:"50%", flexShrink:0,
                border: `1.5px solid ${isCoche ? "#7AE07A" : "#333"}`,
                background: isCoche ? "#1A3A1A" : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, transition:"all 0.2s",
              }}>
                {isCoche && "✓"}
              </div>
              <div style={{
                fontFamily:"'Cormorant Garamond',serif", fontSize:14,
                color: isCoche ? "#7AE07A" : "#C8C4BC",
                textDecoration: isCoche ? "line-through" : "none",
                textDecorationColor: "#555",
                flex:1,
              }}>
                {obj.texte}
              </div>
            </div>
          );
        })}
      </div>

      {done === all && all > 0 && (
        <div style={{ textAlign:"center", marginTop:12, fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:"#7AE07A", fontStyle:"italic" }}>
          🎉 Semaine parfaite ! Badge débloqué.
        </div>
      )}
    </div>
  );
}

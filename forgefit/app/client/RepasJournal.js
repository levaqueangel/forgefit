"use client";
import { useState, useEffect, useCallback } from "react";
import { auth } from "../firebase";
import { ScanRepas } from "./ScanRepas";
import { ScanBarcode } from "./ScanBarcode";

function MacroBar({ label, val, max, color }) {
  const pct = max ? Math.min(100, Math.round((val / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:9, letterSpacing:"1.5px", textTransform:"uppercase", color:"#555" }}>{label}</span>
        <span style={{ fontSize:10, fontWeight:700, color }}>{val}g <span style={{ color:"#555", fontWeight:400 }}>/ {max}g</span></span>
      </div>
      <div style={{ height:4, background:"#1A1A1A", borderRadius:4, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:4, transition:"width 0.6s ease" }}/>
      </div>
    </div>
  );
}

function RepasCard({ repas, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    await onDelete?.();
    setDeleting(false);
  };

  return (
    <div style={{
      background:"#0D0D0D", border:"0.5px solid #1A1A1A", borderRadius:12,
      padding:"12px 14px", display:"flex", alignItems:"center", gap:12,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#F0EDE8", fontFamily:"'Syne',sans-serif", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {repas.nom || repas.description}
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <span style={{ fontSize:10, color:"#C9A84C" }}>⚡ {repas.calories} kcal</span>
          <span style={{ fontSize:10, color:"#7AE07A" }}>P {repas.proteines}g</span>
          <span style={{ fontSize:10, color:"#E8C87A" }}>G {repas.glucides}g</span>
          <span style={{ fontSize:10, color:"#88A0E0" }}>L {repas.lipides}g</span>
          {repas.heure && <span style={{ fontSize:10, color:"#555" }}>{repas.heure}</span>}
        </div>
        {!repas.fiable && (
          <div style={{ fontSize:9, color:"#555", marginTop:2, letterSpacing:"1px" }}>
            * estimation approximative
          </div>
        )}
      </div>
      {onDelete && (
        <button onClick={handleDelete} disabled={deleting} title="Supprimer ce repas" style={{
          background:"transparent", border:"0.5px solid #1A1A1A", color:"#444",
          width:28, height:28, borderRadius:6, cursor:"pointer", flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, transition:"all 0.15s",
        }}>
          {deleting ? "⏳" : "✕"}
        </button>
      )}
    </div>
  );
}

export function RepasJournal({ nutrition, user, clientData }) {
  const [input, setInput] = useState("");
  const [repas, setRepas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saisieMode, setSaisieMode] = useState("texte"); // "texte" | "photo" | "barcode"

  const getToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  }, []);

  // Charger le journal du jour (avec index global Firestore pour suppression)
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/repas?mode=today", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // Le GET retourne les entrées filtrées → on attache _idx pour la suppression
        setRepas((data.repas || []).map((r, i) => ({ ...r, _idx: r._idx ?? i })));
      } catch {}
      setFetching(false);
    })();
  }, [user, getToken]);

  // Totaux du jour
  const totaux = repas.reduce((acc, r) => ({
    calories: acc.calories + (r.calories || 0),
    proteines: acc.proteines + (r.proteines || 0),
    glucides: acc.glucides + (r.glucides || 0),
    lipides: acc.lipides + (r.lipides || 0),
  }), { calories: 0, proteines: 0, glucides: 0, lipides: 0 });

  const analyser = async () => {
    if (!input.trim() || loading) return;
    setLoading(true); setError(""); setPreview(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/repas", {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ description: input.trim(), save: false }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); } else { setPreview(data.analyse); }
    } catch { setError("Erreur de connexion."); }
    setLoading(false);
  };

  const sauvegarder = async () => {
    if (!preview || loading) return;
    setLoading(true); setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/repas", {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ description: input.trim(), save: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); } else {
        setRepas(prev => [...prev, { ...data.analyse, description: input.trim(), jour: new Date().toDateString() }]);
        setInput(""); setPreview(null); setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { setError("Erreur de connexion."); }
    setLoading(false);
  };

  const supprimerRepas = async (localIdx, firestoreIdx) => {
    try {
      const token = await getToken();
      const res = await fetch("/api/repas", {
        method: "DELETE",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ index: firestoreIdx }),
      });
      if (res.ok) {
        setRepas(prev => prev.filter((_, i) => i !== localIdx));
      }
    } catch {}
  };

  const pctCalories = nutrition?.calories_jour ? Math.min(100, Math.round(totaux.calories / nutrition.calories_jour * 100)) : 0;
  const couleurPct = pctCalories > 110 ? "#E07070" : pctCalories > 90 ? "#7AE07A" : "#C9A84C";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Bilan du jour */}
      {nutrition && (
        <div style={{ background:"#0D0D0D", borderRadius:14, padding:"14px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555" }}>Aujourd'hui</div>
            <div style={{ fontSize:14, fontWeight:700, color:couleurPct, fontFamily:"'Syne',sans-serif" }}>
              {totaux.calories} <span style={{ fontSize:10, color:"#555", fontWeight:400 }}>/ {nutrition.calories_jour} kcal</span>
            </div>
          </div>
          <MacroBar label="Protéines" val={Math.round(totaux.proteines)} max={nutrition.proteines_g} color="#7AE07A"/>
          <MacroBar label="Glucides"  val={Math.round(totaux.glucides)}  max={nutrition.glucides_g}  color="#E8C87A"/>
          <MacroBar label="Lipides"   val={Math.round(totaux.lipides)}   max={nutrition.lipides_g}   color="#88A0E0"/>
        </div>
      )}

      {/* Zone de saisie */}
      <div>
        {/* Toggle texte / photo */}
        <div style={{ display:"flex", gap:0, marginBottom:12, border:"0.5px solid #1A1A1A", width:"fit-content" }}>
          {[
            { id:"texte",   label:"✏️ Décrire" },
            { id:"photo",   label:"📸 Photo IA" },
            { id:"barcode", label:"🏷 Code-barres" },
          ].map(m => (
            <button key={m.id} onClick={() => setSaisieMode(m.id)} style={{
              background: saisieMode === m.id ? "rgba(201,168,76,0.12)" : "transparent",
              border: "none", borderRight: m.id !== "barcode" ? "0.5px solid #1A1A1A" : "none",
              color: saisieMode === m.id ? "#C9A84C" : "#555",
              fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
              letterSpacing:"1.5px", textTransform:"uppercase",
              padding:"8px 16px", cursor:"pointer", transition:"all 0.15s",
            }}>{m.label}</button>
          ))}
        </div>

        {/* Mode photo IA */}
        {saisieMode === "photo" && (
          <ScanRepas
            user={user}
            clientData={clientData}
            onSave={(result) => {
              setRepas(prev => [...prev, {
                ...result,
                description: result.nom,
                jour: new Date().toDateString(),
                viaPhoto: true,
              }]);
            }}
          />
        )}

        {/* Mode code-barres */}
        {saisieMode === "barcode" && (
          <ScanBarcode
            user={user}
            onSave={(result) => {
              setRepas(prev => [...prev, {
                ...result,
                description: result.nom,
                jour: new Date().toDateString(),
                viaBarcode: true,
              }]);
            }}
          />
        )}

        {/* Mode texte */}
        {saisieMode === "texte" && (
          <>
            <div style={{ display:"flex", gap:8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value.slice(0, 300))}
                onKeyDown={e => e.key === "Enter" && analyser()}
                placeholder="ex: 2 œufs brouillés, 1 tartine complète et un café"
                style={{
                  flex:1, background:"#0D0D0D", border:"0.5px solid #242424",
                  borderRadius:10, padding:"11px 14px", color:"#F0EDE8",
                  fontFamily:"'Cormorant Garamond',serif", fontSize:14,
                  outline:"none", transition:"border-color 0.15s",
                }}
              />
              <button onClick={analyser} disabled={!input.trim() || loading} style={{
                background: input.trim() ? "rgba(201,168,76,0.12)" : "transparent",
                border: `0.5px solid ${input.trim() ? "rgba(201,168,76,0.4)" : "#1A1A1A"}`,
                color: input.trim() ? "#C9A84C" : "#333",
                fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
                letterSpacing:"1.5px", textTransform:"uppercase",
                padding:"0 16px", borderRadius:10, cursor: input.trim() ? "pointer" : "not-allowed",
                transition:"all 0.15s", whiteSpace:"nowrap",
              }}>
                {loading ? "⏳" : "Analyser"}
              </button>
            </div>

            {error && <div style={{ fontSize:11, color:"#E07070", marginTop:6 }}>{error}</div>}

            {/* Preview texte */}
            {preview && (
              <div style={{ marginTop:10, background:"rgba(201,168,76,0.04)", border:"0.5px solid rgba(201,168,76,0.2)", borderRadius:10, padding:"12px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#F0EDE8", fontFamily:"'Syne',sans-serif", marginBottom:4 }}>
                      {preview.nom}
                    </div>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, color:"#C9A84C" }}>⚡ {preview.calories} kcal</span>
                      <span style={{ fontSize:11, color:"#7AE07A" }}>P {preview.proteines}g</span>
                      <span style={{ fontSize:11, color:"#E8C87A" }}>G {preview.glucides}g</span>
                      <span style={{ fontSize:11, color:"#88A0E0" }}>L {preview.lipides}g</span>
                    </div>
                    {!preview.fiable && <div style={{ fontSize:9, color:"#555", marginTop:4 }}>* estimation approximative</div>}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => setPreview(null)} style={{ background:"transparent", border:"0.5px solid #242424", color:"#555", fontFamily:"'Syne',sans-serif", fontSize:10, letterSpacing:"1px", padding:"6px 10px", borderRadius:8, cursor:"pointer" }}>✕</button>
                    <button onClick={sauvegarder} disabled={loading} style={{ background:"linear-gradient(135deg,#C9A84C,#A67C2E)", border:"none", color:"#0A0A0A", fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", padding:"6px 14px", borderRadius:8, cursor:"pointer" }}>
                      {saved ? "✓" : "Enregistrer"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Liste du jour */}
      {fetching ? (
        <div className="skel" style={{ height:80, borderRadius:12 }}/>
      ) : repas.length === 0 ? (
        <div style={{ textAlign:"center", padding:"1.5rem 0", color:"#555",
          fontFamily:"'Cormorant Garamond',serif", fontSize:14, fontStyle:"italic" }}>
          Aucun repas loggé aujourd'hui
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555" }}>
            {repas.length} repas loggés aujourd'hui
          </div>
          {repas.map((r, i) => (
            <RepasCard key={i} repas={r} onDelete={() => supprimerRepas(i, r._idx ?? i)} />
          ))}
        </div>
      )}
    </div>
  );
}

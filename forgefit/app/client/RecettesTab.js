"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import NextImage from "next/image";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import recettesData from "../data/recettes.json";

const CATS = [
  { key: "all",     label: "Toutes" },
  { key: "entree",  label: "Entrées" },
  { key: "plat",    label: "Plats" },
  { key: "dessert", label: "Desserts" },
];

const PROT_FILTERS = [
  { key: "all", label: "Protéines" },
  { key: "20",  label: "> 20g prot" },
  { key: "30",  label: "> 30g prot" },
  { key: "40",  label: "> 40g prot" },
];

export function RecettesTab({ clientData, user }) {
  const [cat, setCat]           = useState("all");
  const [search, setSearch]     = useState("");
  const [protFilter, setProtFilter] = useState("all");
  const [showFavs, setShowFavs] = useState(false);
  const [selected, setSelected] = useState(null);
  const [favs, setFavs]         = useState(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("apx_favs") || "[]"); } catch { return []; }
  });

  // Chargement des favoris depuis Firestore au montage (sync multi-appareils)
  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "clients", user.uid)).then(snap => {
      if (snap.exists()) {
        const remote = snap.data().recettesFavoris;
        if (Array.isArray(remote)) {
          setFavs(remote);
          try { localStorage.setItem("apx_favs", JSON.stringify(remote)); } catch {}
        }
      }
    }).catch(() => {}); // fallback silencieux sur localStorage
  }, [user?.uid]);

  const toggleFav = useCallback(async (id) => {
    setFavs(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      // Sauvegarde localStorage (immédiat)
      try { localStorage.setItem("apx_favs", JSON.stringify(next)); } catch {}
      // Sauvegarde Firestore (async, si connecté)
      if (user?.uid) {
        updateDoc(doc(db, "clients", user.uid), { recettesFavoris: next }).catch(() => {});
      }
      return next;
    });
  }, [user?.uid]);

  const filtered = useMemo(() => {
    let list = recettesData;
    if (showFavs) list = list.filter(r => favs.includes(r.id));
    if (cat !== "all") list = list.filter(r => r.categorie === cat);
    if (protFilter !== "all") list = list.filter(r => r.proteines >= parseInt(protFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.nom.toLowerCase().includes(q) ||
        r.ingredients?.some(i => i.toLowerCase().includes(q)));
    }
    return list;
  }, [cat, search, protFilter, showFavs, favs]);

  const plan = clientData?.plan?.toLowerCase();
  if (plan && plan !== "forge" && plan !== "elite" && plan !== "starter") {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#555" }}>
        <p>Les recettes sont disponibles à partir du Plan Forge.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 80px" }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 16px", borderBottom: "0.5px solid #1A1A1A" }}>
        <p style={{ margin: "0 0 4px", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#555" }}>— Bibliothèque</p>
        <h2 style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 700, color: "#F0EDE8", fontFamily: "'Syne',sans-serif" }}>
          Recettes <span style={{ color: "#C9A84C" }}>({filtered.length})</span>
        </h2>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une recette ou un ingrédient..."
          style={{
            width: "100%", boxSizing: "border-box",
            background: "#0D0D0D", border: "0.5px solid #2A2A2A",
            color: "#F0EDE8", padding: "10px 14px", borderRadius: 8,
            fontSize: 13, outline: "none", marginBottom: 12,
          }}
        />

        {/* Filtres */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATS.map(c => (
            <button key={c.key} onClick={() => setCat(c.key)} style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: `0.5px solid ${cat === c.key ? "#C9A84C" : "#2A2A2A"}`,
              background: cat === c.key ? "rgba(201,168,76,0.12)" : "transparent",
              color: cat === c.key ? "#C9A84C" : "#555", cursor: "pointer",
            }}>{c.label}</button>
          ))}
          {PROT_FILTERS.slice(1).map(f => (
            <button key={f.key} onClick={() => setProtFilter(protFilter === f.key ? "all" : f.key)} style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: `0.5px solid ${protFilter === f.key ? "#7AE07A" : "#2A2A2A"}`,
              background: protFilter === f.key ? "rgba(122,224,122,0.08)" : "transparent",
              color: protFilter === f.key ? "#7AE07A" : "#555", cursor: "pointer",
            }}>{f.label}</button>
          ))}
          <button onClick={() => setShowFavs(p => !p)} style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600,
            border: `0.5px solid ${showFavs ? "#E07070" : "#2A2A2A"}`,
            background: showFavs ? "rgba(224,112,112,0.08)" : "transparent",
            color: showFavs ? "#E07070" : "#555", cursor: "pointer",
          }}>❤ Favoris ({favs.length})</button>
        </div>
      </div>

      {/* Grille recettes */}
      <div style={{ padding: "16px 16px 0", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: "#333", fontSize: 13 }}>
            Aucune recette trouvée
          </div>
        )}
        {filtered.map(r => (
          <div key={r.id} onClick={() => setSelected(r)} style={{
            background: "#0D0D0D", border: "0.5px solid #1A1A1A", borderRadius: 10,
            overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#C9A84C33"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#1A1A1A"}
          >
            <div style={{ position: "relative", height: 110, background: "#111" }}>
              <NextImage src={r.image} alt={r.nom} fill style={{ objectFit: "cover", opacity: 0.85 }} onError={e => { e.currentTarget.style.display="none"; }} />
              <button
                onClick={e => { e.stopPropagation(); toggleFav(r.id); }}
                style={{
                  position: "absolute", top: 6, right: 6,
                  background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%",
                  width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 13,
                }}
              >{favs.includes(r.id) ? "❤" : "🤍"}</button>
              <div style={{
                position: "absolute", bottom: 6, left: 6,
                background: "rgba(0,0,0,0.7)", padding: "2px 8px", borderRadius: 10,
                fontSize: 9, color: "#7AE07A", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
              }}>{r.proteines}g prot</div>
            </div>
            <div style={{ padding: "10px 10px 12px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#F0EDE8", lineHeight: 1.3 }}>{r.nom}</p>
              <p style={{ margin: 0, fontSize: 10, color: "#555" }}>{r.calories} kcal · {r.temps}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal détail recette */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            zIndex: 200, padding: "0",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0D0D0D", borderRadius: "16px 16px 0 0",
              width: "100%", maxWidth: 560, maxHeight: "90vh",
              overflowY: "auto", padding: "0 0 40px",
            }}
          >
            {/* Image */}
            <div style={{ position: "relative", height: 200 }}>
              <NextImage src={selected.image} alt={selected.nom} fill style={{ objectFit: "cover", borderRadius: "16px 16px 0 0" }} onError={e => { e.currentTarget.style.display="none"; }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0D0D0D 10%, transparent 60%)", borderRadius: "16px 16px 0 0" }} />
              <button onClick={() => setSelected(null)} style={{
                position: "absolute", top: 12, right: 12,
                background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%",
                width: 32, height: 32, color: "#F0EDE8", cursor: "pointer", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
              <button onClick={() => toggleFav(selected.id)} style={{
                position: "absolute", top: 12, right: 52,
                background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%",
                width: 32, height: 32, cursor: "pointer", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{favs.includes(selected.id) ? "❤" : "🤍"}</button>
            </div>

            {/* Contenu */}
            <div style={{ padding: "20px 20px 0" }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, color: "#555", letterSpacing: "2px", textTransform: "uppercase" }}>{selected.categorie} · {selected.temps}</p>
              <h3 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700, color: "#F0EDE8", fontFamily: "'Syne',sans-serif" }}>{selected.nom}</h3>

              {/* Macros */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
                {[
                  { label: "Calories", val: selected.calories, unit: "kcal", color: "#C9A84C" },
                  { label: "Protéines", val: selected.proteines, unit: "g", color: "#7AE07A" },
                  { label: "Glucides", val: selected.glucides, unit: "g", color: "#5DCAA5" },
                  { label: "Lipides", val: selected.lipides, unit: "g", color: "#E07070" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#111", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: m.color }}>{m.val}</div>
                    <div style={{ fontSize: 9, color: "#555", letterSpacing: "1px", textTransform: "uppercase" }}>{m.unit}</div>
                    <div style={{ fontSize: 9, color: "#333", marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Ingrédients */}
              {selected.ingredients?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ margin: "0 0 10px", fontSize: 10, color: "#C9A84C", letterSpacing: "2px", textTransform: "uppercase" }}>— Ingrédients</p>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {selected.ingredients.map((ing, i) => (
                      <li key={i} style={{ fontSize: 13, color: "#888", marginBottom: 4, lineHeight: 1.5 }}>{ing}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Préparation */}
              {selected.preparation && (
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: 10, color: "#C9A84C", letterSpacing: "2px", textTransform: "uppercase" }}>— Préparation</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#888", lineHeight: 1.8 }}>{selected.preparation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

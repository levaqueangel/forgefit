"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import recettesData from "../data/recettes.json";

const CATS = [
  { key: "all", label: "Toutes" },
  { key: "entree", label: "Entrées" },
  { key: "plat", label: "Plats" },
  { key: "dessert", label: "Desserts" },
];

const PROT_FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "20", label: "> 20g" },
  { key: "30", label: "> 30g" },
  { key: "40", label: "> 40g" },
];

const CAL_FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "low", label: "< 200 kcal" },
  { key: "mid", label: "200–350 kcal" },
  { key: "high", label: "> 350 kcal" },
];

export default function RecettesPage() {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | unauthorized | ok
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [protFilter, setProtFilter] = useState("all");
  const [calFilter, setCalFilter] = useState("all");
  const [favs, setFavs] = useState(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("apx_favs") || "[]"); } catch { return []; }
  });
  const [showFavs, setShowFavs] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      const COACH = process.env.NEXT_PUBLIC_COACH_EMAIL || "coach.apxfitness11@gmail.com";
      if (user.email === COACH) { setStatus("ok"); return; }
      try {
        const snap = await getDoc(doc(db, "clients", user.uid));
        const data = snap.data();
        if (data?.plan === "Elite") setStatus("ok");
        else setStatus("unauthorized");
      } catch { setStatus("unauthorized"); }
    });
    return unsub;
  }, [router]);

  const toggleFav = useCallback((id) => {
    setFavs(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem("apx_favs", JSON.stringify(next));
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let r = recettesData;
    if (showFavs) r = r.filter(x => favs.includes(x.id));
    if (cat !== "all") r = r.filter(x => x.categorie === cat);
    if (protFilter !== "all") r = r.filter(x => x.proteines > parseInt(protFilter));
    if (calFilter === "low") r = r.filter(x => x.calories < 200);
    else if (calFilter === "mid") r = r.filter(x => x.calories >= 200 && x.calories <= 350);
    else if (calFilter === "high") r = r.filter(x => x.calories > 350);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        x.nom.toLowerCase().includes(q) ||
        x.ingredients.some(i => i.toLowerCase().includes(q))
      );
    }
    return r;
  }, [cat, search, protFilter, calFilter, showFavs, favs]);

  const catLabel = { entree: "Entrée", plat: "Plat", dessert: "Dessert" };
  const catColor = { entree: "#7AE07A", plat: "#C9A84C", dessert: "#E88C8C" };

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#555", fontSize: 13, letterSpacing: 3, textTransform: "uppercase" }}>Chargement...</div>
    </div>
  );

  if (status === "unauthorized") return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: "2rem" }}>
      <div style={{ fontSize: 36 }}>🔒</div>
      <div style={{ fontSize: 11, letterSpacing: 4, color: "#C9A84C", textTransform: "uppercase" }}>Accès restreint</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, color: "#F0EDE8", textAlign: "center" }}>
        Cette section est réservée<br />aux membres <span style={{ color: "#C9A84C", fontStyle: "italic" }}>Elite</span>
      </div>
      <div style={{ fontSize: 13, color: "#555", textAlign: "center", maxWidth: 320, lineHeight: 1.7 }}>
        Passe à l'abonnement Elite pour accéder à des centaines de recettes haute protéine.
      </div>
      <button onClick={() => router.push("/client")}
        style={{ marginTop: 8, padding: "10px 28px", background: "transparent", border: "0.5px solid #C9A84C", color: "#C9A84C", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer" }}>
        ← Retour
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#F0EDE8", fontFamily: "'Helvetica Neue',Arial,sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .r-card{background:#0D0D0D;border:0.5px solid #242424;cursor:pointer;transition:transform .3s,border-color .3s,box-shadow .3s}
        .r-card:hover{transform:translateY(-4px);border-color:rgba(201,168,76,.4);box-shadow:0 12px 40px rgba(0,0,0,.6)}
        .fav-btn{background:none;border:none;cursor:pointer;font-size:18px;transition:transform .2s}
        .fav-btn:hover{transform:scale(1.2)}
        .pill{padding:4px 12px;border-radius:20px;font-size:11px;letter-spacing:2px;cursor:pointer;transition:all .25s;text-transform:uppercase;border:0.5px solid}
        .pill.active{background:#C9A84C;color:#0A0A0A;border-color:#C9A84C}
        .pill.inactive{background:transparent;color:#555;border-color:#2A2A2A}
        .pill:hover:not(.active){border-color:#C9A84C;color:#C9A84C}
        .macro-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:4px;font-size:11px}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem}
        .modal-box{background:#0D0D0D;border:0.5px solid #242424;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;padding:2rem}
        .modal-box::-webkit-scrollbar{width:4px}
        .modal-box::-webkit-scrollbar-thumb{background:#2A2A2A}
        @media(max-width:600px){.r-grid{grid-template-columns:1fr 1fr !important}.filters-row{flex-wrap:wrap}}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "0.5px solid #242424", padding: "1.5rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#080808" }}>
        <button onClick={() => router.push("/client")}
          style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", letterSpacing: 2, textTransform: "uppercase" }}>
          ← Espace client
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#C9A84C", textTransform: "uppercase" }}>Espace Elite</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600 }}>Recettes</div>
        </div>
        <div style={{ fontSize: 11, color: "#555", letterSpacing: 1 }}>{recettesData.length} recettes</div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Search */}
        <input
          type="text"
          placeholder="Rechercher une recette ou un ingrédient..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", background: "#111", border: "0.5px solid #2A2A2A", color: "#F0EDE8", padding: "12px 16px", fontSize: 14, outline: "none", marginBottom: "1.5rem", letterSpacing: 0.5 }}
        />

        {/* Catégories */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
          {CATS.map(c => (
            <button key={c.key} className={`pill ${cat === c.key ? "active" : "inactive"}`} onClick={() => setCat(c.key)}>{c.label}</button>
          ))}
          <div style={{ marginLeft: "auto" }}>
            <button className={`pill ${showFavs ? "active" : "inactive"}`} onClick={() => setShowFavs(v => !v)}>
              ♥ Favoris {favs.length > 0 && `(${favs.length})`}
            </button>
          </div>
        </div>

        {/* Filtres macros */}
        <div className="filters-row" style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "0.5px solid #1A1A1A" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase" }}>Protéines :</span>
            {PROT_FILTERS.map(f => (
              <button key={f.key} className={`pill ${protFilter === f.key ? "active" : "inactive"}`} style={{ padding: "3px 10px", fontSize: 10 }} onClick={() => setProtFilter(f.key)}>{f.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase" }}>Calories :</span>
            {CAL_FILTERS.map(f => (
              <button key={f.key} className={`pill ${calFilter === f.key ? "active" : "inactive"}`} style={{ padding: "3px 10px", fontSize: 10 }} onClick={() => setCalFilter(f.key)}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Résultats count */}
        <div style={{ fontSize: 12, color: "#555", letterSpacing: 2, marginBottom: "1.5rem", textTransform: "uppercase" }}>
          {filtered.length} recette{filtered.length !== 1 ? "s" : ""}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#555", fontSize: 14 }}>
            Aucune recette ne correspond à ta recherche.
          </div>
        ) : (
          <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {filtered.map(r => (
              <div key={r.id} className="r-card" onClick={() => setSelected(r)}>
                {/* Header carte */}
                <div style={{ padding: "1rem 1rem 0.75rem", borderBottom: "0.5px solid #1A1A1A" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, letterSpacing: 2, color: catColor[r.categorie], textTransform: "uppercase" }}>
                      {catLabel[r.categorie]}
                    </span>
                    <button className="fav-btn" onClick={e => { e.stopPropagation(); toggleFav(r.id); }}
                      style={{ color: favs.includes(r.id) ? "#C9A84C" : "#333" }}>
                      {favs.includes(r.id) ? "♥" : "♡"}
                    </button>
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 600, lineHeight: 1.3, color: "#F0EDE8" }}>
                    {r.nom}
                  </div>
                </div>
                {/* Macros */}
                <div style={{ padding: "0.75rem 1rem", display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className="macro-badge" style={{ background: "rgba(201,168,76,.08)", color: "#C9A84C" }}>
                    🔥 {r.calories} kcal
                  </span>
                  <span className="macro-badge" style={{ background: "rgba(122,224,122,.08)", color: "#7AE07A" }}>
                    💪 {r.proteines}g prot
                  </span>
                  <span className="macro-badge" style={{ background: "rgba(255,255,255,.04)", color: "#888" }}>
                    ⏱ {r.temps}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal-box">
            {/* Header modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 3, color: catColor[selected.categorie], textTransform: "uppercase", marginBottom: 4 }}>
                  {catLabel[selected.categorie]}
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 600 }}>{selected.nom}</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button className="fav-btn" onClick={() => toggleFav(selected.id)}
                  style={{ color: favs.includes(selected.id) ? "#C9A84C" : "#555", fontSize: 22 }}>
                  {favs.includes(selected.id) ? "♥" : "♡"}
                </button>
                <button onClick={() => setSelected(null)}
                  style={{ background: "none", border: "none", color: "#555", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
            </div>

            {/* Macros */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: "1.5rem" }}>
              {[
                { label: "Calories", val: `${selected.calories} kcal`, color: "#C9A84C" },
                { label: "Protéines", val: `${selected.proteines}g`, color: "#7AE07A" },
                { label: "Glucides", val: `${selected.glucides}g`, color: "#8CB8E8" },
                { label: "Lipides", val: `${selected.lipides}g`, color: "#E8C88C" },
              ].map(m => (
                <div key={m.label} style={{ background: "#111", border: "0.5px solid #1A1A1A", padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{m.val}</div>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Infos */}
            <div style={{ display: "flex", gap: 16, marginBottom: "1.5rem", fontSize: 12, color: "#888" }}>
              <span>⏱ {selected.temps}</span>
              <span>👤 {selected.portions} portion{selected.portions > 1 ? "s" : ""}</span>
            </div>

            {/* Ingrédients */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#C9A84C", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                Ingrédients
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {selected.ingredients.map((ing, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#C8C4BC" }}>
                    <span style={{ width: 4, height: 4, background: "#C9A84C", borderRadius: "50%", flexShrink: 0 }} />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            {/* Préparation */}
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#C9A84C", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                Préparation
              </div>
              <div style={{ fontSize: 14, color: "#C8C4BC", lineHeight: 1.8, background: "#111", border: "0.5px solid #1A1A1A", padding: "1rem" }}>
                {selected.preparation}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

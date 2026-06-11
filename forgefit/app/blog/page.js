"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ARTICLES } from "./articles";
import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";

// Toutes les catégories présentes dans les articles
const ALL_CATS = ["Tout", ...Array.from(new Set(ARTICLES.map(a => a.categorie))).sort()];

// Couleurs par catégorie
const CAT_COLORS = {
  "Musculation":  "#E8B000",
  "Nutrition":    "#7AE07A",
  "Programme":    "#5DCAA5",
  "Récupération": "#F5C832",
  "Perte de poids":"#E07070",
  "Remise en forme":"#88A0E0",
};

export default function BlogPage() {
  const router = useRouter();
  const { lang, setLang, LANGS } = useLang();
  const [cat, setCat] = useState("Tout");
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Filtrage par catégorie + recherche
  const articles = useMemo(() => {
    let result = cat === "Tout" ? ARTICLES : ARTICLES.filter(a => a.categorie === cat);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(a =>
        a.titre.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.categorie.toLowerCase().includes(q)
      );
    }
    return result;
  }, [cat, search]);

  // Article mis en avant (le plus récent)
  const featured = ARTICLES[0];

  if (!mounted) return (
    <div style={{ background:"#0A0A0A", minHeight:"100vh", padding:"4rem 2rem" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        {/* Skeleton header */}
        <div style={{ height:24, width:200, background:"#111", borderRadius:4, marginBottom:16, animation:"pulse 1.5s ease infinite" }}/>
        <div style={{ height:56, width:400, background:"#111", borderRadius:4, marginBottom:32, animation:"pulse 1.5s ease infinite" }}/>
        {/* Skeleton articles */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:"#1A1A1A" }}>
          {Array.from({length:6}).map((_,i) => (
            <div key={i} style={{ background:"#0D0D0D", padding:24, display:"flex", flexDirection:"column", gap:12, minHeight:220 }}>
              <div style={{ height:12, width:80, background:"#111", borderRadius:4, animation:"pulse 1.5s ease infinite" }}/>
              <div style={{ height:18, width:"90%", background:"#111", borderRadius:4, animation:"pulse 1.5s ease infinite" }}/>
              <div style={{ height:14, width:"70%", background:"#0D0D0D", borderRadius:4, animation:"pulse 1.5s ease infinite" }}/>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );

  return (
    <div style={{ background:"#0A0A0A", color:"#F0EDE8", minHeight:"100vh", fontFamily:"'Syne',sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .gold{background:linear-gradient(90deg,#E8B000,#F5C832,#F5C832,#E8B000);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite}
        .cat-btn{background:transparent;border:0.5px solid #1E1E1E;color:#555;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:7px 16px;cursor:pointer;border-radius:20px;transition:all 0.2s;white-space:nowrap}
        .cat-btn:hover{border-color:#333;color:#888}
        .cat-btn.active{border-color:#E8B000;color:#E8B000;background:rgba(232,176,0,0.1)}
        .article-card{background:#0D0D0D;border:0.5px solid #1A1A1A;padding:24px;cursor:pointer;transition:all 0.2s;display:flex;flex-direction:column;gap:14px}
        .article-card:hover{border-color:#E8B000;background:#111;transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.4)}
        .search-input{width:100%;background:transparent;border:none;color:#F0EDE8;font-family:'Syne',sans-serif;font-size:14px;outline:none;padding:0}
        .search-input::placeholder{color:#333}
        .featured-card{cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden}
        .featured-card:hover{opacity:0.92}
        .footer-link{cursor:pointer;transition:color 0.2s}
        .footer-link:hover{color:#F5C832 !important}
        @media(max-width:768px){
          .articles-grid{grid-template-columns:1fr !important}
          .cats-scroll{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}
          .cats-scroll::-webkit-scrollbar{display:none}
        }
      `}</style>

      {/* Nav */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 28px", borderBottom:"0.5px solid #1A1A1A", position:"sticky", top:0, background:"rgba(10,10,10,0.97)", backdropFilter:"blur(12px)", zIndex:100 }}>
        <div style={{ fontSize:20, fontWeight:800, letterSpacing:5, cursor:"pointer" }} onClick={() => router.push("/")}>
          APXFIT<span style={{ color:"#E8B000" }}>NESS</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
          <button onClick={() => router.push("/")} style={{ background:"transparent", border:"0.5px solid #1E1E1E", color:"#555", padding:"8px 18px", fontFamily:"'Syne',sans-serif", fontSize:11, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer" }}>
            ← Accueil
          </button>
          <button onClick={() => router.push("/bilan")} style={{ background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none", color:"#0A0A0A", padding:"8px 18px", fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer" }}>
            Mon bilan →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding:"4rem 2rem 3rem", textAlign:"center", borderBottom:"0.5px solid #1A1A1A", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 100%,rgba(232,176,0,0.06) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:"1rem" }}>— Base de connaissances</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(36px,6vw,60px)", fontWeight:600, lineHeight:1.1, marginBottom:"1rem" }}>
          Blog <em className="gold">Fitness</em>
        </h1>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#555", maxWidth:480, margin:"0 auto 2rem" }}>
          {ARTICLES.length} articles rédigés par un coach certifié. Musculation, nutrition, récupération — tout ce qu'il faut savoir pour progresser.
        </p>

        {/* Barre de recherche */}
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          maxWidth:480, margin:"0 auto",
          background:"#111",
          border:`0.5px solid ${searchFocused ? "#E8B000" : "#1E1E1E"}`,
          padding:"12px 18px",
          transition:"border-color 0.2s",
        }}>
          <span style={{ fontSize:16, color:"#555", flexShrink:0 }}>🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher un article..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background:"transparent", border:"none", color:"#555", cursor:"pointer", fontSize:16, flexShrink:0, padding:0 }}>✕</button>
          )}
        </div>
      </div>

      {/* Filtres catégories */}
      <div style={{ padding:"1.2rem 2rem", borderBottom:"0.5px solid #1A1A1A", display:"flex", alignItems:"center", gap:8, overflowX:"auto" }} className="cats-scroll">
        {ALL_CATS.map(c => (
          <button key={c} className={`cat-btn${cat === c ? " active" : ""}`} onClick={() => { setCat(c); setSearch(""); }}>
            {c === "Tout" ? `Tous (${ARTICLES.length})` : `${c} (${ARTICLES.filter(a => a.categorie === c).length})`}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"3rem 1.5rem 5rem" }}>

        {/* Article mis en avant (uniquement si pas de filtre actif) */}
        {cat === "Tout" && !search && (
          <div className="featured-card" onClick={() => router.push(`/blog/${featured.slug}`)} style={{ marginBottom:"2.5rem", border:"0.5px solid #1E1E1E", display:"grid", gridTemplateColumns:"1fr 1fr", background:"#0D0D0D" }}>
            <div style={{ padding:"2.5rem", borderRight:"0.5px solid #1A1A1A", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" }}>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", background:"rgba(232,176,0,0.1)", color:"#E8B000", padding:"4px 10px" }}>
                    ★ Article à la une
                  </span>
                  <span style={{ fontSize:10, color:"#444" }}>{featured.lecture} min de lecture</span>
                </div>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, lineHeight:1.2, marginBottom:"1rem" }}>
                  {featured.titre}
                </h2>
                <p style={{ fontSize:13, color:"#555", lineHeight:1.8 }}>
                  {featured.description}
                </p>
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"1.5rem", paddingTop:"1rem", borderTop:"0.5px solid #1A1A1A" }}>
                <span style={{ fontSize:11, color:"#555", letterSpacing:"1px" }}>
                  {new Date(featured.date).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
                </span>
                <span style={{ fontSize:12, color:"#E8B000", fontWeight:700 }}>Lire l'article →</span>
              </div>
            </div>
            <div style={{ padding:"2.5rem", background:"#111", display:"flex", flexDirection:"column", justifyContent:"center" }}>
              <div style={{ fontSize:10, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:"1rem" }}>Extrait</div>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#666", lineHeight:2, fontStyle:"italic" }}>
                "{featured.contenu.split('\n').find(l => l.trim().length > 80 && !l.startsWith('#'))?.slice(0, 200)}..."
              </p>
              <div style={{ marginTop:"1.5rem", display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background: CAT_COLORS[featured.categorie] || "#E8B000" }}/>
                <span style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#555" }}>{featured.categorie}</span>
              </div>
            </div>
          </div>
        )}

        {/* Compteur */}
        <div style={{ fontSize:11, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:10 }}>
          {articles.length} article{articles.length > 1 ? "s" : ""}
          {cat !== "Tout" && <span style={{ color: CAT_COLORS[cat] || "#E8B000" }}>— {cat}</span>}
          {search && <span style={{ color:"#888" }}>— "{search}"</span>}
        </div>

        {/* Grille d'articles */}
        <div className="articles-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:"#1A1A1A" }}>
          {articles.map((article, i) => (
            <article
              key={article.slug}
              className="article-card"
              onClick={() => router.push(`/blog/${article.slug}`)}
              style={{ animation:`fadeUp 0.4s ease ${i * 0.06}s both` }}
            >
              {/* Accent couleur top */}
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background: CAT_COLORS[article.categorie] || "#E8B000", opacity:0.7 }}/>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color: CAT_COLORS[article.categorie] || "#E8B000", background:`rgba(${(CAT_COLORS[article.categorie]||"#E8B000")==='#E8B000'?'232,176,0':'122,224,122'},0.08)`, padding:"3px 8px" }}>
                  {article.categorie}
                </span>
                <span style={{ fontSize:10, color:"#444", letterSpacing:"1px" }}>{article.lecture} min</span>
              </div>

              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, lineHeight:1.3 }}>
                {article.titre}
              </h2>

              <p style={{ fontSize:12, color:"#555", lineHeight:1.7, flex:1 }}>
                {article.description}
              </p>

              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:"0.75rem", borderTop:"0.5px solid #141414" }}>
                <span style={{ fontSize:10, color:"#555", letterSpacing:"1px" }}>
                  {new Date(article.date).toLocaleDateString("fr-FR", { day:"numeric", month:"long" })}
                </span>
                <span style={{ fontSize:11, color:"#E8B000", fontWeight:700 }}>Lire →</span>
              </div>
            </article>
          ))}
        </div>

        {/* Aucun résultat */}
        {articles.length === 0 && (
          <div style={{ textAlign:"center", padding:"4rem", color:"#555", fontFamily:"'Cormorant Garamond',serif", fontSize:18 }}>
            Aucun article {search ? `pour "${search}"` : `dans "${cat}"`} pour l'instant.
            <br/>
            <button onClick={() => { setCat("Tout"); setSearch(""); }} style={{ marginTop:"1rem", background:"transparent", border:"0.5px solid #242424", color:"#555", padding:"8px 20px", fontFamily:"'Syne',sans-serif", fontSize:11, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer" }}>
              Voir tous les articles
            </button>
          </div>
        )}
      </div>

      {/* CTA bas de page */}
      <div style={{ borderTop:"0.5px solid #1A1A1A", padding:"4rem 2rem", textAlign:"center", background:"radial-gradient(ellipse at center,rgba(232,176,0,0.04) 0%,transparent 70%)" }}>
        <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:"1rem" }}>— Prêt à passer à l'action ?</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:600, marginBottom:"1rem" }}>
          Un programme personnalisé<br/><em style={{ fontStyle:"italic", color:"#555" }}>vaut mieux que tous les articles.</em>
        </h2>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#555", marginBottom:"2rem", maxWidth:400, margin:"0 auto 2rem" }}>
          Arrête de lire sur la musculation. Commence à pratiquer avec un programme fait pour toi.
        </p>
        <button onClick={() => router.push("/bilan")} style={{ background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none", color:"#0A0A0A", padding:"16px 40px", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", cursor:"pointer" }}>
          Démarrer mon bilan gratuit →
        </button>
      </div>

      {/* Footer */}
      <footer style={{ padding:"1.5rem 2rem", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"0.5px solid #1A1A1A" }}>
        <div style={{ fontSize:16, fontWeight:800, letterSpacing:5, cursor:"pointer" }} onClick={() => router.push("/")}><span>APXFIT</span><span style={{ color:"#E8B000" }}>NESS</span></div>
        <div style={{ fontSize:11, letterSpacing:"2px", color:"#555", textTransform:"uppercase" }}>© 2026 APXFITNESS</div>
        <div style={{ display:"flex", gap:"1rem" }}>
          {[["Accueil","/"],["FAQ","/faq"],["Mentions légales","/mentions-legales"]].map(([label,href])=>(
            <span key={href} className="footer-link" style={{ fontSize:11, letterSpacing:"2px", color:"#555", textTransform:"uppercase", cursor:"pointer" }} onClick={() => router.push(href)}>{label}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

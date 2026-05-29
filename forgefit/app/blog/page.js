"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ARTICLES } from "./articles";
import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";

const CATS = ["Tout", "Musculation", "Nutrition", "Perte de poids", "Remise en forme"];

export default function BlogPage() {
  const router = useRouter();
  const { lang, setLang, LANGS } = useLang();
  const [cat, setCat] = useState("Tout");

  const articles = cat === "Tout"
    ? ARTICLES
    : ARTICLES.filter(a => a.categorie === cat);

  return (
    <div style={{ background: "#0A0A0A", color: "#F0EDE8", minHeight: "100vh", fontFamily: "'Syne',sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .gold{background:linear-gradient(90deg,#C9A84C,#E8C87A,#F5D98A,#C9A84C);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.5s linear infinite}
        .cat-btn{background:transparent;border:0.5px solid #242424;color:#555;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:7px 16px;cursor:pointer;transition:all 0.2s;border-radius:2px}
        .cat-btn.active,.cat-btn:hover{border-color:#C9A84C;color:#C9A84C;background:rgba(201,168,76,0.05)}
        .article-card{background:#0D0D0D;border:0.5px solid #1A1A1A;border-radius:4px;padding:24px;cursor:pointer;transition:all 0.25s;display:flex;flex-direction:column;gap:12px}
        .article-card:hover{border-color:#C9A84C;background:#111;transform:translateY(-2px)}
        .footer-link{cursor:pointer;transition:color 0.2s}
        .footer-link:hover{color:#E8C87A !important}
        @media(max-width:640px){.articles-grid{grid-template-columns:1fr !important}}
      `}</style>

      {/* Nav */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 28px", borderBottom:"0.5px solid #1A1A1A", position:"sticky", top:0, background:"#0A0A0A", zIndex:100 }}>
        <div style={{ fontSize:20, fontWeight:800, letterSpacing:5, cursor:"pointer" }} onClick={() => router.push("/")}>
          APXFIT<span style={{ color:"#C9A84C" }}>NESS</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
          <button onClick={() => router.push("/")} style={{ background:"transparent", border:"0.5px solid #242424", color:"#555", fontFamily:"'Syne',sans-serif", fontSize:11, letterSpacing:"2px", textTransform:"uppercase", padding:"8px 18px", cursor:"pointer", borderRadius:2 }}>
            ← Retour
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding:"4rem 2rem 3rem", textAlign:"center", borderBottom:"0.5px solid #1A1A1A", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 100%,rgba(201,168,76,0.04),transparent 70%)", pointerEvents:"none" }} />
        <div style={{ fontSize:11, letterSpacing:"4px", textTransform:"uppercase", color:"#C9A84C", marginBottom:"1rem" }}>— Conseils & Coaching</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(40px,6vw,64px)", fontWeight:600, lineHeight:1, marginBottom:"1rem" }}>
          Le blog<br /><em className="gold" style={{ fontStyle:"italic" }}>APXFITNESS</em>
        </h1>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#555", maxWidth:480, margin:"0 auto 2rem", lineHeight:1.7 }}>
          Musculation, nutrition, perte de poids — tous les conseils pour progresser vraiment.
        </p>
        {/* Filtres */}
        <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
          {CATS.map(c => (
            <button key={c} className={`cat-btn${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"3rem 1.5rem 5rem" }}>
        <div style={{ fontSize:11, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:"2rem" }}>
          {articles.length} article{articles.length > 1 ? "s" : ""} {cat !== "Tout" ? `— ${cat}` : ""}
        </div>

        <div className="articles-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
          {articles.map((article, i) => (
            <article
              key={article.slug}
              className="article-card"
              onClick={() => router.push(`/blog/${article.slug}`)}
              style={{ animation:`fadeUp 0.5s ease ${i * 0.08}s both` }}
            >
              {/* Catégorie + temps lecture */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#C9A84C", background:"rgba(201,168,76,0.08)", border:"0.5px solid rgba(201,168,76,0.2)", padding:"3px 10px", borderRadius:2 }}>
                  {article.categorie}
                </span>
                <span style={{ fontSize:11, color:"#444", letterSpacing:"1px" }}>
                  {article.lecture} min
                </span>
              </div>

              {/* Titre */}
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, lineHeight:1.3, color:"#F0EDE8" }}>
                {article.titre}
              </h2>

              {/* Description */}
              <p style={{ fontSize:13, color:"#555", lineHeight:1.7, flex:1 }}>
                {article.description}
              </p>

              {/* Date + CTA */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:12, borderTop:"0.5px solid #1A1A1A" }}>
                <span style={{ fontSize:11, color:"#333", letterSpacing:"1px" }}>
                  {new Date(article.date).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
                </span>
                <span style={{ fontSize:12, color:"#C9A84C", letterSpacing:"1px" }}>Lire →</span>
              </div>
            </article>
          ))}
        </div>

        {articles.length === 0 && (
          <div style={{ textAlign:"center", padding:"4rem", color:"#333", fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontStyle:"italic" }}>
            Aucun article dans cette catégorie pour l'instant.
          </div>
        )}
      </div>

      {/* CTA bas de page */}
      <div style={{ borderTop:"0.5px solid #1A1A1A", padding:"3rem 2rem", textAlign:"center", background:"#0D0D0D" }}>
        <div style={{ fontSize:11, letterSpacing:"4px", textTransform:"uppercase", color:"#C9A84C", marginBottom:"0.75rem" }}>— Prêt à passer à l'action ?</div>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#888", marginBottom:"1.5rem", lineHeight:1.6, maxWidth:500, margin:"0 auto 1.5rem" }}>
          Un programme personnalisé vaut mieux que tous les articles du monde.
        </p>
        <button onClick={() => router.push("/#offres")} style={{ background:"linear-gradient(135deg,#C9A84C,#A67C2E)", border:"none", color:"#0A0A0A", padding:"14px 32px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", cursor:"pointer", borderRadius:2 }}>
          Obtenir mon programme →
        </button>
      </div>

      {/* Footer */}
      <footer style={{ padding:"1.5rem 2rem", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"0.5px solid #1A1A1A", flexWrap:"wrap", gap:12 }}>
        <div style={{ fontSize:16, fontWeight:800, letterSpacing:5 }}>APXFIT<span style={{ color:"#C9A84C" }}>NESS</span></div>
        <div style={{ fontSize:11, letterSpacing:"2px", color:"#333", textTransform:"uppercase" }}>© 2026 APXFITNESS</div>
        <span className="footer-link" style={{ fontSize:11, letterSpacing:"2px", color:"#555", textTransform:"uppercase", textDecoration:"underline" }} onClick={() => router.push("/mentions-legales")}>
          Mentions légales
        </span>
      </footer>
    </div>
  );
}

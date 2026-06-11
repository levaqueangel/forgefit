"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ARTICLES } from "../articles";
import { useLang } from "../../useLang";
import { LangSelector } from "../../LangSelector";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

export default function ArticlePage({ params }) {
  const router = useRouter();
  const { lang, setLang, LANGS } = useLang();
  const article = ARTICLES.find(a => a.slug === params.slug);

  /* ── Barre de progression lecture ── */
  const [readPct, setReadPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const scrollTop  = window.scrollY;
      const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;
      setReadPct(pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!article) {
    return (
      <div style={{ background:"#0A0A0A", color:"#F0EDE8", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:60, fontWeight:600, color:"#E8B000", lineHeight:1 }}>404</div>
          <p style={{ color:"#555", marginTop:16, marginBottom:24 }}>Article introuvable</p>
          <button onClick={() => router.push("/blog")} style={{ background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none", color:"#0A0A0A", padding:"12px 28px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer" }}>
            ← Retour au blog
          </button>
        </div>
      </div>
    );
  }

  // Autres articles (suggestions)
  const autres = ARTICLES.filter(a => a.slug !== article.slug).slice(0, 3);

  // Parser le contenu markdown simple → HTML
  function renderContent(text) {
    const lines = text.trim().split("\n");
    const elements = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.startsWith("## ")) {
        elements.push(
          <h2 key={i} style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(22px,3vw,28px)", fontWeight:600, color:"#F0EDE8", margin:"2rem 0 1rem", lineHeight:1.3, borderBottom:"0.5px solid #1A1A1A", paddingBottom:"0.5rem" }}>
            {line.replace("## ", "")}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h3 key={i} style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:"#E8B000", letterSpacing:"2px", textTransform:"uppercase", margin:"1.5rem 0 0.75rem" }}>
            {line.replace("### ", "")}
          </h3>
        );
      } else if (line.startsWith("- **")) {
        // Liste avec bold
        const content = line.replace("- **", "").split("**");
        elements.push(
          <li key={i} style={{ color:"#888", fontSize:15, lineHeight:1.8, marginBottom:6, marginLeft:20 }}>
            <strong style={{ color:"#F0EDE8" }}>{content[0]}</strong>{content[1] || ""}
          </li>
        );
      } else if (line.startsWith("- ")) {
        elements.push(
          <li key={i} style={{ color:"#888", fontSize:15, lineHeight:1.8, marginBottom:6, marginLeft:20 }}>
            {line.replace("- ", "")}
          </li>
        );
      } else if (line.startsWith("**") && line.endsWith("**")) {
        elements.push(
          <p key={i} style={{ color:"#F5C832", fontSize:15, fontWeight:700, lineHeight:1.8, margin:"1rem 0 0.5rem" }}>
            {line.replace(/\*\*/g, "")}
          </p>
        );
      } else if (line.trim() !== "") {
        // Paragraphe normal avec bold inline
        const parts = line.split(/\*\*(.*?)\*\*/g);
        elements.push(
          <p key={i} style={{ color:"#888", fontSize:15, lineHeight:1.9, margin:"0.75rem 0", fontFamily:"'Cormorant Garamond',serif", fontSize:17 }}>
            {parts.map((part, j) =>
              j % 2 === 1
                ? <strong key={j} style={{ color:"#F0EDE8", fontFamily:"'Syne',sans-serif", fontSize:14 }}>{part}</strong>
                : part
            )}
          </p>
        );
      }
      i++;
    }
    return elements;
  }

  return (
    <div style={{ background:"#0A0A0A", color:"#F0EDE8", minHeight:"100vh", fontFamily:"'Syne',sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .gold{background:linear-gradient(90deg,#E8B000,#F5C832,#F5C832,#E8B000);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.5s linear infinite}
        .article-card{background:#0D0D0D;border:0.5px solid #1A1A1A;border-radius:4px;padding:20px;cursor:pointer;transition:all 0.25s}
        .article-card:hover{border-color:#E8B000;background:#111;transform:translateY(-2px)}
        .footer-link{cursor:pointer;transition:color 0.2s}
        .footer-link:hover{color:#F5C832 !important}
      `}</style>

      {/* ── Barre de progression lecture — sticky en haut ── */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:3, background:"transparent", zIndex:200, pointerEvents:"none" }}>
        <div style={{
          height:"100%", width:`${readPct}%`,
          background:"linear-gradient(90deg,#E8B000,#7AE07A)",
          transition:"width 0.1s linear",
        }}/>
      </div>

      {/* Nav */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 28px", borderBottom:"0.5px solid #1A1A1A", position:"sticky", top:0, background:"#0A0A0A", zIndex:100 }}>
        <div style={{ fontSize:20, fontWeight:800, letterSpacing:5, cursor:"pointer" }} onClick={() => router.push("/")}>
          APXFIT<span style={{ color:"#E8B000" }}>NESS</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
          <button onClick={() => router.push("/blog")} style={{ background:"transparent", border:"0.5px solid #242424", color:"#555", fontFamily:"'Syne',sans-serif", fontSize:11, letterSpacing:"2px", textTransform:"uppercase", padding:"8px 18px", cursor:"pointer", borderRadius:2 }}>
            ← Blog
          </button>
        </div>
      </nav>

      {/* Header article */}
      <div style={{ maxWidth:780, margin:"0 auto", padding:"3rem 1.5rem 2rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"1.5rem" }}>
          <span style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#E8B000", background:"rgba(201,168,76,0.08)", border:"0.5px solid rgba(201,168,76,0.2)", padding:"4px 12px", borderRadius:2 }}>
            {article.categorie}
          </span>
          <span style={{ fontSize:11, color:"#444", letterSpacing:"1px" }}>
            {new Date(article.date).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
          </span>
          <span style={{ fontSize:11, color:"#444", letterSpacing:"1px" }}>·</span>
          <span style={{ fontSize:11, color:"#444", letterSpacing:"1px" }}>{article.lecture} min de lecture</span>
        </div>

        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,4vw,46px)", fontWeight:600, lineHeight:1.2, marginBottom:"1.5rem", color:"#F0EDE8" }}>
          {article.titre}
        </h1>

        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:19, color:"#555", lineHeight:1.7, marginBottom:"2rem", fontStyle:"italic" }}>
          {article.description}
        </p>

        <div style={{ height:"0.5px", background:"linear-gradient(90deg,#E8B000,transparent)", marginBottom:"2.5rem" }} />
      </div>

      {/* Contenu */}
      <div style={{ maxWidth:780, margin:"0 auto", padding:"0 1.5rem" }}>
        <div style={{ display:"flex", flexDirection:"column" }}>
          {renderContent(article.contenu)}
        </div>
      </div>

      {/* CTA intermédiaire */}
      <div style={{ maxWidth:780, margin:"3rem auto", padding:"0 1.5rem" }}>
        <div style={{ background:"#0D0D0D", border:"0.5px solid rgba(201,168,76,0.3)", borderRadius:4, padding:"2rem", textAlign:"center" }}>
          <div style={{ fontSize:10, letterSpacing:"3px", textTransform:"uppercase", color:"#E8B000", marginBottom:"0.75rem" }}>— Prêt à passer à l'action ?</div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:"#888", lineHeight:1.7, marginBottom:"1.5rem", maxWidth:440, margin:"0 auto 1.5rem" }}>
            Un programme personnalisé adapté à TON profil, TES objectifs et TON équipement.
          </p>
          <button onClick={() => router.push("/bilan")} style={{ background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none", color:"#0A0A0A", padding:"13px 28px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", cursor:"pointer", borderRadius:2 }}>
            Obtenir mon programme →
          </button>
        </div>
      </div>

      {/* Articles suggérés */}
      {autres.length > 0 && (
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"2rem 1.5rem 5rem" }}>
          <div style={{ fontSize:11, letterSpacing:"3px", textTransform:"uppercase", color:"#E8B000", marginBottom:"1.5rem" }}>— Articles similaires</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
            {autres.map(a => (
              <article key={a.slug} className="article-card" onClick={() => router.push(`/blog/${a.slug}`)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#E8B000" }}>{a.categorie}</span>
                  <span style={{ fontSize:11, color:"#444" }}>{a.lecture} min</span>
                </div>
                <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, lineHeight:1.3, color:"#F0EDE8", marginBottom:8 }}>{a.titre}</h3>
                <span style={{ fontSize:12, color:"#E8B000" }}>Lire →</span>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ padding:"1.5rem 2rem", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"0.5px solid #1A1A1A", flexWrap:"wrap", gap:12 }}>
        <div style={{ fontSize:16, fontWeight:800, letterSpacing:5 }}>APXFIT<span style={{ color:"#E8B000" }}>NESS</span></div>
        <div style={{ fontSize:11, letterSpacing:"2px", color:"#333", textTransform:"uppercase" }}>© 2026 APXFITNESS</div>
        <span className="footer-link" style={{ fontSize:11, letterSpacing:"2px", color:"#555", textTransform:"uppercase", textDecoration:"underline" }} onClick={() => router.push("/mentions-legales")}>
          Mentions légales
        </span>
      </footer>
    </div>
  );
}

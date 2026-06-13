"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthly: 18.99,
    annual: 189.90,
    annualPerMonth: 15.83,
    tag: "Débutant",
    tagColor: "#5DCAA5",
    desc: "Le point de départ idéal pour ceux qui veulent structurer leur entraînement.",
    features: [
      { label: "Programme musculation personnalisé", ok: true },
      { label: "Plan nutrition adapté à tes objectifs", ok: true },
      { label: "Calcul de tes macros précis", ok: true },
      { label: "Bilan en ligne complet", ok: true },
      { label: "Livraison par email en 48h", ok: true },
      { label: "Suivi mensuel & ajustements", ok: false },
      { label: "Accès espace client privé", ok: false },
      { label: "Messagerie directe avec le coach", ok: false },
      { label: "Révisions illimitées du programme", ok: false },
    ],
  },
  {
    id: "forge",
    name: "Forge",
    monthly: 38.99,
    annual: 389.90,
    annualPerMonth: 32.49,
    tag: "Le plus choisi",
    tagColor: "#E8B000",
    highlight: true,
    desc: "La formule complète pour progresser avec un suivi régulier et des ajustements.",
    features: [
      { label: "Programme musculation personnalisé", ok: true },
      { label: "Plan nutrition adapté à tes objectifs", ok: true },
      { label: "Calcul de tes macros précis", ok: true },
      { label: "Bilan en ligne complet", ok: true },
      { label: "Livraison par email en 48h", ok: true },
      { label: "Suivi mensuel & ajustements", ok: true },
      { label: "Accès espace client privé", ok: true },
      { label: "Messagerie directe avec le coach", ok: false },
      { label: "Révisions illimitées du programme", ok: false },
    ],
  },
  {
    id: "elite",
    name: "Elite",
    monthly: 68.99,
    annual: 689.90,
    annualPerMonth: 57.49,
    tag: "Haut niveau",
    tagColor: "#7AE07A",
    desc: "Le coaching haut de gamme pour ceux qui veulent le maximum de résultats.",
    features: [
      { label: "Programme musculation personnalisé", ok: true },
      { label: "Plan nutrition adapté à tes objectifs", ok: true },
      { label: "Calcul de tes macros précis", ok: true },
      { label: "Bilan en ligne complet", ok: true },
      { label: "Livraison par email en 48h", ok: true },
      { label: "Suivi mensuel & ajustements", ok: true },
      { label: "Accès espace client privé", ok: true },
      { label: "Messagerie directe avec le coach", ok: true },
      { label: "Révisions illimitées du programme", ok: true },
    ],
  },
];

const COMPARE = [
  { cat: "Programme", rows: [
    { label: "Programme musculation sur mesure", starter: true, forge: true, elite: true },
    { label: "Plan nutrition personnalisé", starter: true, forge: true, elite: true },
    { label: "Calcul des macros", starter: true, forge: true, elite: true },
    { label: "Adaptations domicile / salle", starter: true, forge: true, elite: true },
  ]},
  { cat: "Suivi", rows: [
    { label: "Suivi mensuel", starter: false, forge: true, elite: true },
    { label: "Ajustements programme", starter: false, forge: true, elite: true },
    { label: "Révisions illimitées", starter: false, forge: false, elite: true },
  ]},
  { cat: "Accès", rows: [
    { label: "Espace client privé", starter: false, forge: true, elite: true },
    { label: "Messagerie directe coach", starter: false, forge: false, elite: true },
    { label: "Livraison en 48h", starter: true, forge: true, elite: true },
    { label: "Garantie 14 jours", starter: true, forge: true, elite: true },
  ]},
];

const TESTIMONIALS = [
  { name:"Thomas M.", plan:"Forge", text:"J'ai pris 4 kg de muscle en 3 mois. Jamais eu un programme aussi précis.", stars:5 },
  { name:"Sarah K.", plan:"Elite", text:"Le suivi avec le coach change tout. Je n'aurais jamais progressé aussi vite seule.", stars:5 },
  { name:"Julien R.", plan:"Starter", text:"Parfait pour démarrer. Programme clair, résultats visibles dès la 4e semaine.", stars:5 },
];

export default function TarifsPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [billing, setBilling] = useState("annual");
  const [openFaq, setOpenFaq] = useState(null);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });

  // Compte à rebours jusqu'à minuit (fin de l'offre du jour)
  useEffect(() => {
    function tick() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(23, 59, 59, 999);
      const diff = midnight - now;
      setCountdown({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function handleCheckout(planId) {
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, billing }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur lors du paiement. Réessaie dans un instant.");
        setLoadingPlan(null);
      }
    } catch {
      alert("Erreur réseau. Vérifie ta connexion et réessaie.");
      setLoadingPlan(null);
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Plans de coaching APXFITNESS",
    "itemListElement": PLANS.map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": `Plan ${p.name} APXFITNESS`,
        "description": p.desc,
        "offers": {
          "@type": "Offer",
          "price": p.monthly,
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock",
        },
      },
    })),
  };

  return (
    <div style={{ background:"#0A0A0A", color:"#F0EDE8", minHeight:"100vh", fontFamily:"'Syne',sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseDot{0%,100%{opacity:1;box-shadow:0 0 6px rgba(122,224,122,0.7)}50%{opacity:0.5;box-shadow:0 0 12px rgba(122,224,122,0.4)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(232,176,0,0.2)}70%{box-shadow:0 0 0 12px rgba(232,176,0,0)}}
        .gold-text{background:linear-gradient(90deg,#E8B000,#F5C832,#F5C832,#E8B000);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.5s linear infinite}
        .plan-cta{border:none;color:#0A0A0A;padding:14px 24px;font-family:'Syne',sans-serif;font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;cursor:pointer;width:100%;transition:all 0.2s}
        .plan-cta:hover{opacity:0.88;transform:translateY(-1px)}
        .plan-cta.ghost{background:transparent;border:0.5px solid #2A2A2A;color:#555}
        .plan-cta.ghost:hover{border-color:#E8B000;color:#E8B000}
        .compare-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;align-items:center;padding:10px 16px;border-bottom:0.5px solid #141414}
        .compare-row:hover{background:rgba(255,255,255,0.015)}
        .faq-item{border-bottom:0.5px solid #1A1A1A;cursor:pointer}
        .faq-item:hover .faq-q{color:#E8B000}
        @media(max-width:900px){
          .plans-grid{grid-template-columns:1fr !important}
          .compare-row{grid-template-columns:1.5fr 1fr 1fr 1fr;font-size:11px}
          .hero-stats{flex-direction:column;gap:12px !important}
          .guarantee-grid{grid-template-columns:1fr !important}
          .tarifs-hero h1{font-size:clamp(32px,11vw,60px) !important}
          .tarifs-nav-logo{font-size:16px !important}
        }
        @media(max-width:600px){
          .compare-row{grid-template-columns:1.4fr 1fr 1fr 1fr;font-size:10px;padding:8px 6px}
          .tarifs-hero-pad{padding:3rem 1.25rem 2.5rem !important}
        }
      `}</style>

      {/* Nav */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 28px", borderBottom:"0.5px solid #1A1A1A", position:"sticky", top:0, background:"#0A0A0A", zIndex:100, backdropFilter:"blur(12px)" }}>
        <div style={{ fontSize:20, fontWeight:800, letterSpacing:5, cursor:"pointer" }} onClick={() => router.push("/")}>
          APXFIT<span style={{ color:"#E8B000" }}>NESS</span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => router.push("/bilan")} style={{ background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none", color:"#0A0A0A", fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:800, letterSpacing:"2px", textTransform:"uppercase", padding:"9px 20px", cursor:"pointer" }}>
            Commencer →
          </button>
          <button onClick={() => router.push("/")} style={{ background:"transparent", border:"0.5px solid #242424", color:"#555", fontFamily:"'Syne',sans-serif", fontSize:11, letterSpacing:"2px", textTransform:"uppercase", padding:"9px 18px", cursor:"pointer" }}>
            ← Retour
          </button>
        </div>
      </nav>

      {/* ── Hero typographique ── */}
      <div style={{ padding:"5rem 2rem 4rem", borderBottom:"0.5px solid #1A1A1A", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 100%,rgba(232,176,0,0.07),transparent 60%)", pointerEvents:"none" }} />
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ fontSize:10, letterSpacing:"5px", textTransform:"uppercase", color:"#E8B000", marginBottom:"1.5rem" }}>— Investis en toi</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(40px,7vw,96px)", lineHeight:0.88, textTransform:"uppercase", letterSpacing:"-0.02em", marginBottom:"2rem" }}>
            MOINS CHER<br/>QU'UNE SALLE<br/><span className="gold-text">DE SPORT.</span>
          </h1>
          <div style={{ display:"flex", alignItems:"center", gap:"3rem", flexWrap:"wrap" }} className="hero-stats">
            {[
              { val:"+340", label:"clients actifs" },
              { val:"48h", label:"délai de livraison" },
              { val:"4.9★", label:"note moyenne" },
              { val:"14j", label:"satisfait ou remboursé" },
            ].map(s => (
              <div key={s.val}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(28px,4vw,48px)", color:"#E8B000", lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#444", marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Urgency ── */}
      <div style={{ display:"flex", justifyContent:"center", padding:"2.5rem 1.5rem 0" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"7px 18px", border:"0.5px solid rgba(232,176,0,0.3)", background:"rgba(232,176,0,0.05)" }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:"#7AE07A", boxShadow:"0 0 6px rgba(122,224,122,0.7)", display:"inline-block", animation:"pulseDot 2s ease infinite" }}/>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, letterSpacing:"1.5px", color:"#666" }}>
            <span style={{ color:"#E8B000", fontWeight:700 }}>12 personnes</span> consultent ces offres en ce moment
          </span>
        </div>
      </div>

      {/* ── Toggle billing ── */}
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:16, padding:"1.5rem 1.5rem 0" }}>
        <div style={{ display:"inline-flex", background:"#111", border:"0.5px solid #242424", padding:3, gap:2 }}>
          {[{ value:"annual", label:"Annuel" },{ value:"monthly", label:"Mensuel" }].map(opt => (
            <button key={opt.value} onClick={() => setBilling(opt.value)} style={{
              background:billing===opt.value?"rgba(232,176,0,0.15)":"transparent",
              border:`0.5px solid ${billing===opt.value?"rgba(232,176,0,0.4)":"transparent"}`,
              color:billing===opt.value?"#E8B000":"#555",
              fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase",
              padding:"8px 20px", cursor:"pointer", transition:"all 0.15s", display:"flex", alignItems:"center", gap:6,
            }}>
              {opt.label}
              {opt.value==="annual" && <span style={{ fontSize:9, background:"linear-gradient(135deg,#E8B000,#C49200)", color:"#0A0A0A", padding:"2px 6px", fontWeight:800, letterSpacing:"1px" }}>−2 mois</span>}
            </button>
          ))}
        </div>
        {billing==="annual" && <span style={{ fontSize:12, color:"#5DCAA5", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic" }}>2 mois offerts chaque année</span>}
      </div>

      {/* ── Countdown urgence ── */}
      <div style={{ display:"flex", justifyContent:"center", padding:"1rem 1.5rem 0" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:12, padding:"8px 20px", background:"rgba(232,176,0,0.06)", border:"0.5px solid rgba(232,176,0,0.2)" }}>
          <span style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#666", fontFamily:"'Syne',sans-serif" }}>Offre expire dans</span>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {[
              { val: String(countdown.h).padStart(2,"0"), label:"h" },
              { val: String(countdown.m).padStart(2,"0"), label:"m" },
              { val: String(countdown.s).padStart(2,"0"), label:"s" },
            ].map(({ val, label }, i) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:i < 2 ? 6 : 0 }}>
                <div style={{ background:"#111", border:"0.5px solid #242424", padding:"4px 8px", minWidth:32, textAlign:"center" }}>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, color:"#E8B000" }}>{val}</span>
                </div>
                <span style={{ fontSize:9, color:"#444", letterSpacing:"1px", marginLeft:2 }}>{label}</span>
                {i < 2 && <span style={{ color:"#333", fontSize:12, marginLeft:2 }}>:</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Plans ── */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"2.5rem 1.5rem 0" }}>
        <div className="plans-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1.12fr 1fr", gap:1, background:"#1A1A1A" }}>
          {PLANS.map((plan, pi) => (
            <div key={plan.id} style={{
              background: plan.highlight ? "#0F0F0F" : "#0A0A0A",
              padding: plan.highlight ? "2.5rem 2rem" : "2rem 1.75rem",
              display:"flex", flexDirection:"column", gap:20,
              position:"relative", overflow:"hidden",
              borderTop: plan.highlight ? `2px solid #E8B000` : "2px solid transparent",
            }}>
              {plan.highlight && (
                <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"radial-gradient(ellipse at 50% 0%,rgba(232,176,0,0.04),transparent 60%)", pointerEvents:"none" }} />
              )}

              {/* Badge */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:plan.tagColor, background:`${plan.tagColor}18`, padding:"4px 10px" }}>
                  {plan.tag}
                </span>
                {plan.highlight && <span style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#E8B000" }}>★ Recommandé</span>}
              </div>

              {/* Nom + prix */}
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:plan.highlight?36:30, fontWeight:600, marginBottom:6, lineHeight:1 }}>
                  {plan.name}
                </div>
                {billing==="monthly" ? (
                  <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:plan.highlight?52:40, fontWeight:800, color:plan.highlight?"#E8B000":"#F0EDE8", lineHeight:1 }}>
                      {plan.monthly.toFixed(2).replace(".",",")}€
                    </span>
                    <span style={{ fontSize:11, color:"#333", letterSpacing:"1px" }}>/mois</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontSize:plan.highlight?52:40, fontWeight:800, color:plan.highlight?"#E8B000":"#F0EDE8", lineHeight:1 }}>
                        {plan.annual.toFixed(2).replace(".",",")}€
                      </span>
                      <span style={{ fontSize:11, color:"#333", letterSpacing:"1px" }}>/an</span>
                    </div>
                    <div style={{ fontSize:11, color:"#5DCAA5", marginTop:2 }}>
                      soit {plan.annualPerMonth.toFixed(2).replace(".",",")}€/mois
                    </div>
                  </div>
                )}
                {plan.highlight && billing==="monthly" && (
                  <div style={{ fontSize:11, color:"#444", marginTop:4, fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic" }}>
                    Moins cher qu'une séance de coaching en salle
                  </div>
                )}
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:"#555", lineHeight:1.7, marginTop:10 }}>
                  {plan.desc}
                </p>
              </div>

              {/* CTA */}
              <button
                className={`plan-cta${plan.highlight?"":" ghost"}`}
                style={{ ...(plan.highlight ? { background:"linear-gradient(135deg,#E8B000,#C49200)", animation:"pulse 2.5s ease infinite" } : {}), opacity:loadingPlan&&loadingPlan!==plan.id?0.4:1, cursor:loadingPlan?"not-allowed":"pointer" }}
                disabled={!!loadingPlan}
                onClick={() => handleCheckout(plan.id)}
              >
                {loadingPlan===plan.id ? "Redirection..." : `Choisir ${plan.name} →`}
              </button>

              {/* Features */}
              <div style={{ display:"flex", flexDirection:"column", gap:7, flex:1 }}>
                <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#333", marginBottom:4 }}>Inclus</div>
                {plan.features.map((f,fi) => (
                  <div key={fi} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{ fontSize:12, color:f.ok?"#E8B000":"#222", marginTop:2, flexShrink:0 }}>{f.ok?"✓":"—"}</span>
                    <span style={{ fontSize:12, color:f.ok?"#888":"#2A2A2A", lineHeight:1.5 }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Garantie */}
        <div className="guarantee-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:1, background:"#1A1A1A", marginTop:1 }}>
          {[
            { icon:"🛡", title:"Garantie 14 jours", desc:"Pas satisfait ? On te rembourse, sans question." },
            { icon:"🔒", title:"Paiement sécurisé", desc:"Stripe — Visa, Mastercard, American Express acceptés." },
            { icon:"⚡", title:"Livraison 48h", desc:"Ton programme complet envoyé par email en 48h ouvrées." },
          ].map(b => (
            <div key={b.title} style={{ background:"#0D0D0D", padding:"1.25rem 1.5rem", display:"flex", alignItems:"flex-start", gap:12 }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{b.icon}</span>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#F0EDE8", marginBottom:4 }}>{b.title}</div>
                <div style={{ fontSize:11, color:"#444", lineHeight:1.6 }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Témoignages ── */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"3rem 1.5rem" }}>
        <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:"1.5rem", textAlign:"center" }}>— Ils l'ont fait</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:1, background:"#1A1A1A" }} className="plans-grid">
          {TESTIMONIALS.map((t,i) => (
            <div key={i} style={{ background:"#0D0D0D", padding:"1.75rem 1.5rem" }}>
              <div style={{ display:"flex", gap:2, marginBottom:12 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color:"#E8B000", fontSize:12 }}>★</span>)}
              </div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#888", lineHeight:1.8, fontStyle:"italic", marginBottom:14 }}>
                "{t.text}"
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#F0EDE8" }}>{t.name}</div>
                <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#E8B000", background:"rgba(232,176,0,0.1)", padding:"3px 8px" }}>Plan {t.plan}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tableau comparatif ── */}
      <div style={{ maxWidth:900, margin:"0 auto", padding:"0 1.5rem 3rem" }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:8 }}>— Détail</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,4vw,42px)", fontWeight:600 }}>Comparaison complète</h2>
        </div>
        <div className="compare-row" style={{ borderBottom:"0.5px solid #2A2A2A" }}>
          <div style={{ fontSize:10, letterSpacing:"2px", color:"#333", textTransform:"uppercase" }}>Fonctionnalité</div>
          {PLANS.map(p => <div key={p.id} style={{ textAlign:"center", fontSize:12, fontWeight:700, color:p.highlight?"#E8B000":"#F0EDE8", letterSpacing:"1px" }}>{p.name}</div>)}
        </div>
        {COMPARE.map(section => (
          <div key={section.cat}>
            <div style={{ padding:"12px 16px 6px", fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#333" }}>{section.cat}</div>
            {section.rows.map((row,ri) => (
              <div className="compare-row" key={ri}>
                <div style={{ fontSize:13, color:"#666", paddingRight:16 }}>{row.label}</div>
                {["starter","forge","elite"].map(p => (
                  <div key={p} style={{ textAlign:"center", fontSize:15 }}>
                    {row[p] ? <span style={{ color:"#E8B000" }}>✓</span> : <span style={{ color:"#1E1E1E" }}>—</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
        <div className="compare-row" style={{ borderBottom:"none", background:"#0D0D0D", marginTop:1 }}>
          <div style={{ fontSize:10, letterSpacing:"2px", color:"#333", textTransform:"uppercase" }}>{billing==="annual"?"Prix annuel":"Prix mensuel"}</div>
          {PLANS.map(p => (
            <div key={p.id} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:p.highlight?"#E8B000":"#F0EDE8" }}>
                {billing==="annual" ? `${p.annual.toFixed(2).replace(".",",")}€` : `${p.monthly.toFixed(2).replace(".",",")}€`}
              </div>
              {billing==="annual" && <div style={{ fontSize:10, color:"#5DCAA5", marginTop:2 }}>{p.annualPerMonth.toFixed(2).replace(".",",")}€/mois</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ accordéon ── */}
      <div style={{ maxWidth:720, margin:"0 auto", padding:"0 1.5rem 4rem" }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:8 }}>— Questions fréquentes</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(24px,3vw,36px)", fontWeight:600 }}>À savoir avant de commander</h2>
        </div>
        {[
          { q:"Comment fonctionne l'abonnement ?", r:"Tu es facturé chaque mois (ou une fois par an en annuel). Tu peux annuler à tout moment depuis ton espace client ou en nous contactant. L'accès reste actif jusqu'à la fin de la période payée." },
          { q:"Paiement 100% sécurisé ?", r:"Le paiement est traité par Stripe, la référence mondiale (Paypal, Amazon, Uber l'utilisent). Tes coordonnées bancaires ne transitent jamais par nos serveurs. Carte Visa, Mastercard, American Express acceptées." },
          { q:"Mon programme peut-il être adapté à la maison ?", r:"Oui, entièrement. Salle, maison avec ou sans matériel, extérieur — tout est pris en compte dans le bilan. Le programme s'adapte à ton équipement exact." },
          { q:"Dans quel délai je reçois mon programme ?", r:"Dans les 48 heures ouvrées après validation de ton bilan. Tu reçois un email complet avec ton programme musculation et ton plan nutrition personnalisés." },
          { q:"Quelle est la différence entre Forge et Elite ?", r:"Elite inclut en plus la messagerie directe avec le coach et des révisions illimitées — idéal si tu veux un vrai coaching de A à Z avec un suivi humain constant." },
        ].map((faq,i) => (
          <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq===i?null:i)} style={{ padding:"18px 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
              <div className="faq-q" style={{ fontSize:13, fontWeight:700, color:openFaq===i?"#E8B000":"#F0EDE8", letterSpacing:"0.3px", transition:"color 0.15s" }}>{faq.q}</div>
              <span style={{ color:"#E8B000", fontSize:18, fontWeight:300, flexShrink:0, transition:"transform 0.2s", transform:openFaq===i?"rotate(45deg)":"rotate(0deg)", display:"inline-block" }}>+</span>
            </div>
            {openFaq===i && (
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#555", lineHeight:1.8, marginTop:10, paddingRight:24 }}>
                {faq.r}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── CTA final ── */}
      <div style={{ borderTop:"0.5px solid #1A1A1A", padding:"5rem 2rem", textAlign:"center", background:"#080808", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 0%,rgba(232,176,0,0.08),transparent 55%)", pointerEvents:"none" }} />
        <div style={{ maxWidth:640, margin:"0 auto", position:"relative" }}>
          <div style={{ fontSize:10, letterSpacing:"5px", textTransform:"uppercase", color:"#E8B000", marginBottom:"1.5rem" }}>— Plus d'excuses</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(32px,5vw,72px)", lineHeight:0.9, textTransform:"uppercase", letterSpacing:"-0.02em", marginBottom:"1.5rem" }}>
            TON CORPS<br/><span className="gold-text">T'ATTEND.</span>
          </h2>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#555", marginBottom:"2.5rem", lineHeight:1.8 }}>
            Programme musculation + nutrition 100% sur mesure. Livraison en 48h. Satisfait ou remboursé 14 jours.
          </p>
          <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={() => router.push("/bilan")} style={{
              background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none", color:"#0A0A0A",
              padding:"16px 40px", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800,
              letterSpacing:"3px", textTransform:"uppercase", cursor:"pointer",
              boxShadow:"0 8px 32px rgba(232,176,0,0.25)",
            }}>
              Faire mon bilan gratuit →
            </button>
            <button onClick={() => router.push("/calculateur")} style={{
              background:"transparent", border:"0.5px solid #242424", color:"#555",
              padding:"16px 28px", fontFamily:"'Syne',sans-serif", fontSize:11,
              letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer",
            }}>
              Calculateur gratuit
            </button>
          </div>
          <div style={{ marginTop:"1.5rem", fontSize:11, color:"#333", letterSpacing:"1px" }}>
            Aucun engagement · Annulation à tout moment
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding:"1.5rem 2rem", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"0.5px solid #1A1A1A", flexWrap:"wrap", gap:12 }}>
        <div style={{ fontSize:16, fontWeight:800, letterSpacing:5 }}>APXFIT<span style={{ color:"#E8B000" }}>NESS</span></div>
        <div style={{ fontSize:11, letterSpacing:"2px", color:"#555", textTransform:"uppercase" }}>© 2026 APXFITNESS</div>
        <span onClick={() => router.push("/mentions-legales")} style={{ fontSize:11, color:"#555", textDecoration:"underline", cursor:"pointer" }}>Mentions légales</span>
      </footer>
    </div>
  );
}

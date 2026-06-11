"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

export default function TarifsPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [billing, setBilling] = useState("monthly");

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
    <div style={{ background: "#0A0A0A", color: "#F0EDE8", minHeight: "100vh", fontFamily: "'Syne',sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .gold{background:linear-gradient(90deg,#E8B000,#F5C832,#F5C832,#E8B000);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.5s linear infinite}
        .plan-card{border:0.5px solid #1E1E1E;border-radius:4px;padding:28px 24px;display:flex;flex-direction:column;gap:20px;transition:border-color 0.2s,transform 0.2s;animation:fadeUp 0.4s ease both}
        .plan-card.highlight{border-color:rgba(232,176,0,0.4);background:rgba(232,176,0,0.03)}
        .plan-card:hover{transform:translateY(-2px);border-color:#E8B00055}
        .cta-btn{border:none;color:#0A0A0A;padding:13px 24px;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;cursor:pointer;border-radius:2px;width:100%;transition:opacity 0.15s}
        .cta-btn:hover{opacity:0.85}
        .cta-btn.outline{background:transparent;border:0.5px solid #E8B000;color:#E8B000}
        .compare-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;align-items:center;padding:10px 16px;border-bottom:0.5px solid #141414}
        .compare-row:hover{background:rgba(255,255,255,0.015)}
        @media(max-width:768px){
          .plans-grid{grid-template-columns:1fr !important}
          .compare-row{grid-template-columns:1.5fr 1fr 1fr 1fr;font-size:11px}
          .compare-row .feat-label{font-size:11px}
        }
      `}</style>

      {/* Nav */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 28px", borderBottom:"0.5px solid #1A1A1A", position:"sticky", top:0, background:"#0A0A0A", zIndex:100 }}>
        <div style={{ fontSize:20, fontWeight:800, letterSpacing:5, cursor:"pointer" }} onClick={() => router.push("/")}>
          APXFIT<span style={{ color:"#E8B000" }}>NESS</span>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={() => router.push("/bilan")} style={{ background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none", color:"#0A0A0A", fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", padding:"8px 18px", cursor:"pointer", borderRadius:2 }}>
            Commencer →
          </button>
          <button onClick={() => router.push("/")} style={{ background:"transparent", border:"0.5px solid #242424", color:"#555", fontFamily:"'Syne',sans-serif", fontSize:11, letterSpacing:"2px", textTransform:"uppercase", padding:"8px 18px", cursor:"pointer", borderRadius:2 }}>
            ← Retour
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding:"4rem 2rem 3rem", textAlign:"center", borderBottom:"0.5px solid #1A1A1A", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 120%,rgba(232,176,0,0.05),transparent 65%)", pointerEvents:"none" }} />
        <div style={{ fontSize:11, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:"1rem" }}>— Investis en toi</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(36px,6vw,64px)", fontWeight:600, lineHeight:1.1, marginBottom:"1rem" }}>
          Des plans pensés pour<br /><em className="gold" style={{ fontStyle:"italic" }}>tes résultats</em>
        </h1>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:"#555", maxWidth:520, margin:"0 auto 2rem", lineHeight:1.7 }}>
          Programme musculation + nutrition 100% personnalisé, livré en 48h. Garantie satisfait ou remboursé 14 jours.
        </p>
        <div style={{ display:"flex", gap:24, justifyContent:"center", flexWrap:"wrap" }}>
          {["✓ Livraison en 48h", "✓ Garantie 14 jours", "✓ 100% sur mesure"].map(t => (
            <span key={t} style={{ fontSize:12, letterSpacing:"1px", color:"#E8B000" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Toggle mensuel / annuel */}
      <div style={{ display:"flex", justifyContent:"center", padding:"2.5rem 1.5rem 0" }}>
        <div style={{ display:"inline-flex", alignItems:"center", background:"#111", border:"0.5px solid #242424", borderRadius:4, padding:4, gap:2 }}>
          {[
            { value: "monthly", label: "Mensuel" },
            { value: "annual",  label: "Annuel" },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setBilling(opt.value)}
              style={{
                background: billing === opt.value ? "rgba(232,176,0,0.15)" : "transparent",
                border: billing === opt.value ? "0.5px solid rgba(232,176,0,0.4)" : "0.5px solid transparent",
                color: billing === opt.value ? "#E8B000" : "#555",
                fontFamily: "'Syne',sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                padding: "8px 20px",
                cursor: "pointer",
                borderRadius: 2,
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {opt.label}
              {opt.value === "annual" && (
                <span style={{
                  fontSize: 9,
                  background: "linear-gradient(135deg,#E8B000,#C49200)",
                  color: "#0A0A0A",
                  padding: "2px 6px",
                  borderRadius: 10,
                  fontWeight: 800,
                  letterSpacing: "1px",
                  whiteSpace: "nowrap",
                }}>
                  −2 mois
                </span>
              )}
            </button>
          ))}
        </div>
        {billing === "annual" && (
          <div style={{ display:"flex", alignItems:"center", marginLeft:16, fontSize:12, color:"#5DCAA5", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic" }}>
            2 mois offerts par an 🎉
          </div>
        )}
      </div>

      {/* Plans */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"2rem 1.5rem 2rem" }}>
        <div className="plans-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20 }}>
          {PLANS.map((plan, pi) => (
            <div key={plan.id} className={`plan-card${plan.highlight ? " highlight" : ""}`} style={{ animationDelay:`${pi*0.1}s` }}>
              {/* Badge */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <span style={{ fontSize:10, letterSpacing:"3px", textTransform:"uppercase", color:plan.tagColor, background:`${plan.tagColor}15`, padding:"4px 10px", borderRadius:12 }}>
                  {plan.tag}
                </span>
                {plan.highlight && (
                  <span style={{ fontSize:10, letterSpacing:"2px", color:"#E8B000" }}>⭐ Recommandé</span>
                )}
              </div>

              {/* Nom + prix */}
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:600, marginBottom:4 }}>
                  {plan.name}
                </div>
                {billing === "monthly" ? (
                  <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                    <span style={{ fontSize:42, fontWeight:800, color: plan.highlight ? "#E8B000" : "#F0EDE8", lineHeight:1 }}>
                      {plan.monthly.toFixed(2).replace(".",",")}€
                    </span>
                    <span style={{ fontSize:12, color:"#444", letterSpacing:"1px" }}>/mois</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                      <span style={{ fontSize:42, fontWeight:800, color: plan.highlight ? "#E8B000" : "#F0EDE8", lineHeight:1 }}>
                        {plan.annual.toFixed(2).replace(".",",")}€
                      </span>
                      <span style={{ fontSize:12, color:"#444", letterSpacing:"1px" }}>/an</span>
                    </div>
                    <div style={{ fontSize:12, color:"#5DCAA5", marginTop:2 }}>
                      soit {plan.annualPerMonth.toFixed(2).replace(".",",")}€/mois
                    </div>
                  </div>
                )}
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:"#555", lineHeight:1.6, marginTop:8 }}>
                  {plan.desc}
                </p>
              </div>

              {/* Features */}
              <div style={{ display:"flex", flexDirection:"column", gap:8, flex:1 }}>
                {plan.features.map((f, fi) => (
                  <div key={fi} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{ fontSize:14, color: f.ok ? "#E8B000" : "#2A2A2A", marginTop:1, flexShrink:0 }}>
                      {f.ok ? "✓" : "×"}
                    </span>
                    <span style={{ fontSize:13, color: f.ok ? "#888" : "#2A2A2A", lineHeight:1.5 }}>
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                className={`cta-btn${plan.highlight ? "" : " outline"}`}
                style={{
                  ...(plan.highlight ? { background:"linear-gradient(135deg,#E8B000,#C49200)" } : {}),
                  opacity: loadingPlan && loadingPlan !== plan.id ? 0.5 : 1,
                  cursor: loadingPlan ? "not-allowed" : "pointer",
                }}
                disabled={!!loadingPlan}
                onClick={() => handleCheckout(plan.id)}
              >
                {loadingPlan === plan.id ? "Redirection..." : `Choisir ${plan.name} →`}
              </button>
            </div>
          ))}
        </div>

        {/* Note garantie */}
        <div style={{ textAlign:"center", marginTop:24, padding:"16px", background:"#111", border:"0.5px solid #1E1E1E", borderRadius:4 }}>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:"#555", lineHeight:1.7 }}>
            🛡️ <strong style={{ color:"#F0EDE8" }}>Garantie satisfait ou remboursé 14 jours.</strong> Si ton programme ne te convient pas dans les 14 jours, on te rembourse sans question.
          </p>
        </div>
      </div>

      {/* Tableau comparatif */}
      <div style={{ maxWidth:900, margin:"0 auto", padding:"2rem 1.5rem 4rem" }}>
        <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
          <div style={{ fontSize:11, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:8 }}>— Détail</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,4vw,42px)", fontWeight:600 }}>
            Comparaison complète
          </h2>
        </div>

        {/* En-tête tableau */}
        <div className="compare-row" style={{ borderBottom:"0.5px solid #2A2A2A", paddingBottom:12, marginBottom:0 }}>
          <div style={{ fontSize:11, letterSpacing:"2px", color:"#555", textTransform:"uppercase" }}>Fonctionnalité</div>
          {PLANS.map(p => (
            <div key={p.id} style={{ textAlign:"center", fontSize:12, fontWeight:700, color: p.highlight ? "#E8B000" : "#F0EDE8", letterSpacing:"1px" }}>
              {p.name}
            </div>
          ))}
        </div>

        {COMPARE.map((section) => (
          <div key={section.cat}>
            <div style={{ padding:"12px 16px 6px", fontSize:10, letterSpacing:"3px", textTransform:"uppercase", color:"#555" }}>
              {section.cat}
            </div>
            {section.rows.map((row, ri) => (
              <div className="compare-row" key={ri}>
                <div className="feat-label" style={{ fontSize:13, color:"#666", paddingRight:16 }}>{row.label}</div>
                {["starter","forge","elite"].map(p => (
                  <div key={p} style={{ textAlign:"center", fontSize:16 }}>
                    {row[p]
                      ? <span style={{ color:"#E8B000" }}>✓</span>
                      : <span style={{ color:"#222" }}>—</span>
                    }
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}

        {/* Prix en bas du tableau */}
        <div className="compare-row" style={{ borderBottom:"none", marginTop:8, background:"#111", borderRadius:"0 0 4px 4px" }}>
          <div style={{ fontSize:11, letterSpacing:"2px", color:"#555", textTransform:"uppercase" }}>
            {billing === "annual" ? "Prix annuel" : "Prix mensuel"}
          </div>
          {PLANS.map(p => (
            <div key={p.id} style={{ textAlign:"center" }}>
              <div style={{ fontSize:20, fontWeight:800, color: p.highlight ? "#E8B000" : "#F0EDE8" }}>
                {billing === "annual"
                  ? `${p.annual.toFixed(2).replace(".",",")}€`
                  : `${p.monthly.toFixed(2).replace(".",",")}€`}
              </div>
              {billing === "annual" && (
                <div style={{ fontSize:10, color:"#5DCAA5", marginTop:2 }}>
                  {p.annualPerMonth.toFixed(2).replace(".",",")}€/mois
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ rapide */}
      <div style={{ maxWidth:720, margin:"0 auto", padding:"0 1.5rem 5rem" }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ fontSize:11, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:8 }}>— Questions fréquentes</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(24px,3vw,36px)", fontWeight:600 }}>À savoir avant de commander</h2>
        </div>
        {[
          { q: "Comment fonctionne l'abonnement ?", r: "Tu es facturé chaque mois (ou une fois par an en annuel). Tu peux annuler à tout moment depuis ton espace client ou en nous contactant. L'accès reste actif jusqu'à la fin de la période payée." },
          { q: "Paiement sécurisé ?", r: "Le paiement est traité par Stripe, la référence mondiale (Paypal, Amazon, Uber l'utilisent). Tes coordonnées bancaires ne transitent jamais par nos serveurs. Carte Visa, Mastercard, American Express acceptées." },
          { q: "Mon programme peut-il être adapté à la maison ?", r: "Oui, entièrement. Salle, maison avec ou sans matériel, extérieur — tout est pris en compte dans le bilan." },
          { q: "Dans quel délai je reçois mon programme ?", r: "Dans les 48 heures ouvrées après validation de ton bilan." },
          { q: "Quelle est la différence entre Forge et Elite ?", r: "Elite inclut en plus la messagerie directe avec le coach et des révisions illimitées — idéal si tu veux un vrai coaching de A à Z." },
        ].map((faq, i) => (
          <div key={i} style={{ borderBottom:"0.5px solid #1A1A1A", padding:"18px 0" }}>
            <div style={{ fontSize:14, fontWeight:600, color:"#F0EDE8", marginBottom:8, letterSpacing:"0.5px" }}>
              {faq.q}
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#555", lineHeight:1.7 }}>
              {faq.r}
            </div>
          </div>
        ))}
      </div>

      {/* CTA final */}
      <div style={{ borderTop:"0.5px solid #1A1A1A", padding:"4rem 2rem", textAlign:"center", background:"#080808", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 0%,rgba(232,176,0,0.06),transparent 60%)", pointerEvents:"none" }} />
        <div style={{ fontSize:11, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:"1rem" }}>— Commence maintenant</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,4vw,48px)", fontWeight:600, marginBottom:"1rem", lineHeight:1.2 }}>
          Ton programme t'attend
        </h2>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#555", maxWidth:480, margin:"0 auto 2rem", lineHeight:1.7 }}>
          Remplis ton bilan en 5 minutes. Reçois ton programme musculation + nutrition en 48h.
        </p>
        <button onClick={() => router.push("/bilan")} style={{
          background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none", color:"#0A0A0A",
          padding:"16px 40px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700,
          letterSpacing:"3px", textTransform:"uppercase", cursor:"pointer", borderRadius:2,
        }}>
          Faire mon bilan gratuit →
        </button>
      </div>

      {/* Footer */}
      <footer style={{ padding:"1.5rem 2rem", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"0.5px solid #1A1A1A", flexWrap:"wrap", gap:12 }}>
        <div style={{ fontSize:16, fontWeight:800, letterSpacing:5 }}>APXFIT<span style={{ color:"#E8B000" }}>NESS</span></div>
        <div style={{ fontSize:11, letterSpacing:"2px", color:"#555", textTransform:"uppercase" }}>© 2026 APXFITNESS</div>
        <span onClick={() => router.push("/mentions-legales")} style={{ fontSize:11, color:"#555", textDecoration:"underline", cursor:"pointer" }}>
          Mentions légales
        </span>
      </footer>
    </div>
  );
}

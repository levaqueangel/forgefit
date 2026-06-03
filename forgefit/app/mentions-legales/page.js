"use client";
import { useRouter } from "next/navigation";

import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";

export default function MentionsLegales() {
  const router = useRouter();
  const { lang, setLang, t, LANGS } = useLang();
  const tl = t.legal;

  const pStyle = { fontFamily: "'Cormorant Garamond', serif", fontSize: 17, lineHeight: 1.8, color: "#888", marginBottom: "0.75rem" };
  const h2Style = { fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#F0EDE8", marginBottom: "0.75rem", marginTop: "1.5rem" };
  const liStyle = { fontFamily: "'Cormorant Garamond', serif", fontSize: 17, lineHeight: 1.8, color: "#888", marginBottom: "0.5rem", paddingLeft: "1rem" };

  return (
    <div style={{ background: "#0A0A0A", color: "#F0EDE8", minHeight: "100vh", fontFamily: "'Syne', sans-serif" }}>
      <style>{` *{box-sizing:border-box;margin:0;padding:0}`}</style>

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "0.5px solid #242424", position: "sticky", top: 0, background: "#0A0A0A", zIndex: 100 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 5, cursor: "pointer" }} onClick={() => router.push("/")}>
          APXFIT<span style={{ color: "#C9A84C" }}>NESS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
          <button onClick={() => router.push("/")} style={{ background: "transparent", border: "0.5px solid #242424", color: "#888", fontFamily: "'Syne',sans-serif", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", padding: "8px 20px", cursor: "pointer" }}>
            {tl.back}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <div style={{ marginBottom: "4rem", paddingBottom: "2rem", borderBottom: "0.5px solid #242424" }}>
          <div style={{ fontSize: 11, letterSpacing: "4px", textTransform: "uppercase", color: "#C9A84C", marginBottom: "1rem" }}>{tl.tag}</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 600, lineHeight: 1.1, marginBottom: "0.75rem" }}>
            {tl.title}<br /><em style={{ fontStyle: "italic", color: "#C9A84C" }}>{tl.em}</em>
          </h1>
          <p style={{ ...pStyle, fontSize: 14 }}>{tl.updated}</p>
        </div>

        {/* Contenu légal — resté en français (obligatoire légalement) */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 600, color: "#C9A84C", marginBottom: "1.5rem", lineHeight: 1.1 }}>1. Mentions Légales</h2>
          <h3 style={h2Style}>1.1 Éditeur du site</h3>
          <p style={pStyle}>Raison sociale : <em style={{ color: "#555" }}>À compléter</em></p>
          <p style={pStyle}>Forme juridique : <em style={{ color: "#555" }}>À compléter</em></p>
          <p style={pStyle}>Numéro SIRET : <em style={{ color: "#555" }}>À compléter</em></p>
          <p style={pStyle}>Email : levaqueangel@gmail.com</p>
          <p style={pStyle}>Site web : www.apxfitness.fr</p>
          <h3 style={h2Style}>1.2 Hébergeur</h3>
          <p style={pStyle}>Vercel Inc. — 340 Pine Street, Suite 701, San Francisco, CA 94104</p>
          <h3 style={h2Style}>1.3 Données personnelles (RGPD)</h3>
          <p style={pStyle}>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul style={{ listStyle: "none", marginBottom: "1rem" }}>
            {["Droit d'accès","Droit de rectification","Droit à l'effacement","Droit à la portabilité","Droit d'opposition"].map(item => (
              <li key={item} style={liStyle}>· {item}</li>
            ))}
          </ul>
          <p style={pStyle}>Contact : levaqueangel@gmail.com</p>
        </section>

        <div style={{ height: "0.5px", background: "#242424", margin: "3rem 0" }} />

        <section>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 600, color: "#C9A84C", marginBottom: "1.5rem", lineHeight: 1.1 }}>2. Conditions Générales de Vente</h2>
          <h3 style={h2Style}>2.1 Objet</h3>
          <p style={pStyle}>Les présentes CGV régissent les relations entre APXFITNESS et ses clients dans le cadre de la vente de programmes de coaching fitness personnalisés en ligne.</p>
          <h3 style={h2Style}>2.2 Produits</h3>
          <ul style={{ listStyle: "none", marginBottom: "1rem" }}>
            {["Plan Starter — 49€ TTC","Plan Forge — 129€ TTC","Plan Elite — 249€ TTC"].map(item => <li key={item} style={liStyle}>· {item}</li>)}
          </ul>
          <h3 style={h2Style}>2.3 Livraison</h3>
          <p style={pStyle}>Programme livré par email sous 48 heures ouvrées.</p>
          <h3 style={h2Style}>2.4 Droit de rétractation</h3>
          <p style={pStyle}>Conformément à l'article L221-18 du Code de la consommation, délai de 14 jours calendaires.</p>
          <h3 style={h2Style}>2.5 Responsabilité</h3>
          <p style={pStyle}>Les programmes ne remplacent pas l'avis d'un médecin. Consultez un professionnel de santé avant tout programme intensif.</p>
        </section>
      </div>

      <div style={{ height: "0.5px", background: "#242424", margin: "3rem 0" }} />
<section>
  <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 600, color: "#F0EDE8", marginBottom: "1rem" }}>
    Paiements et sécurité
  </h2>
  <p style={pStyle}>Les paiements sont traités par <strong style={{color:"#F0EDE8"}}>Stripe, Inc.</strong> (PCI DSS niveau 1). APXFITNESS ne stocke aucune donnée bancaire.</p>
</section>
<div style={{ height: "0.5px", background: "#242424", margin: "3rem 0" }} />
<section>
  <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 600, color: "#F0EDE8", marginBottom: "1rem" }}>
    Cookies
  </h2>
  <p style={pStyle}>Ce site utilise uniquement des cookies techniques : <strong style={{color:"#F0EDE8"}}>Firebase Auth</strong> (session utilisateur) et <strong style={{color:"#F0EDE8"}}>Google Analytics</strong> (statistiques anonymisées). Aucun cookie publicitaire.</p>
</section>

<footer style={{ padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "0.5px solid #242424" }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 5 }}>APXFIT<span style={{ color: "#C9A84C" }}>NESS</span></div>
        <div style={{ fontSize: 11, letterSpacing: "2px", color: "#555", textTransform: "uppercase" }}>{t.footer.copy}</div>
      </footer>
    </div>
  );
}

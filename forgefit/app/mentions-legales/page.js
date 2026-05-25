"use client";
import { useRouter } from "next/navigation";

export default function MentionsLegales() {
  const router = useRouter();

  const sectionStyle = {
    marginBottom: "2.5rem",
  };

  const h1Style = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 36, fontWeight: 600,
    color: "#C9A84C", marginBottom: "1.5rem", lineHeight: 1.1,
  };

  const h2Style = {
    fontFamily: "'Syne', sans-serif",
    fontSize: 14, fontWeight: 700,
    letterSpacing: "2px", textTransform: "uppercase",
    color: "#F0EDE8", marginBottom: "0.75rem", marginTop: "1.5rem",
  };

  const pStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 17, lineHeight: 1.8,
    color: "#888", marginBottom: "0.75rem",
  };

  const liStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 17, lineHeight: 1.8,
    color: "#888", marginBottom: "0.5rem",
    paddingLeft: "1rem",
  };

  return (
    <div style={{ background: "#0A0A0A", color: "#F0EDE8", minHeight: "100vh", fontFamily: "'Syne', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Syne:wght@400;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 32px", borderBottom: "0.5px solid #242424",
        position: "sticky", top: 0, background: "#0A0A0A", zIndex: 100 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 5, cursor: "pointer" }}
          onClick={() => router.push("/")}>
          APXFIT<span style={{ color: "#C9A84C" }}>NESS</span>
        </div>
        <button onClick={() => router.push("/")} style={{
          background: "transparent", border: "0.5px solid #242424",
          color: "#888", fontFamily: "'Syne', sans-serif", fontSize: 12,
          letterSpacing: "2px", textTransform: "uppercase", padding: "8px 20px", cursor: "pointer",
        }}>← Retour</button>
      </nav>

      {/* Contenu */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "4rem 2rem 6rem" }}>

        {/* Titre */}
        <div style={{ marginBottom: "4rem", paddingBottom: "2rem", borderBottom: "0.5px solid #242424" }}>
          <div style={{ fontSize: 11, letterSpacing: "4px", textTransform: "uppercase", color: "#C9A84C", marginBottom: "1rem" }}>
            — Documents légaux
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 600, lineHeight: 1.1, marginBottom: "0.75rem" }}>
            Mentions légales &<br /><em style={{ fontStyle: "italic", color: "#C9A84C" }}>Conditions Générales de Vente</em>
          </h1>
          <p style={{ ...pStyle, fontSize: 14 }}>Dernière mise à jour : Mai 2026</p>
        </div>

        {/* ── MENTIONS LÉGALES ── */}
        <section style={sectionStyle}>
          <h2 style={h1Style}>1. Mentions Légales</h2>

          <h3 style={h2Style}>1.1 Éditeur du site</h3>
          <p style={pStyle}>Raison sociale : <em style={{ color: "#555" }}>À compléter</em></p>
          <p style={pStyle}>Forme juridique : <em style={{ color: "#555" }}>À compléter</em></p>
          <p style={pStyle}>Numéro SIRET : <em style={{ color: "#555" }}>À compléter</em></p>
          <p style={pStyle}>Adresse : <em style={{ color: "#555" }}>À compléter</em></p>
          <p style={pStyle}>Email : levaqueangel@gmail.com</p>
          <p style={pStyle}>Site web : www.apxfitness.fr</p>

          <h3 style={h2Style}>1.2 Hébergeur</h3>
          <p style={pStyle}>Nom : Vercel Inc.</p>
          <p style={pStyle}>Adresse : 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</p>
          <p style={pStyle}>Site web : www.vercel.com</p>

          <h3 style={h2Style}>1.3 Propriété intellectuelle</h3>
          <p style={pStyle}>
            L'ensemble du contenu du site APXFITNESS (textes, images, programmes, logotypes) est protégé par le droit d'auteur.
            Toute reproduction, même partielle, est strictement interdite sans autorisation préalable écrite de l'éditeur.
          </p>

          <h3 style={h2Style}>1.4 Données personnelles (RGPD)</h3>
          <p style={pStyle}>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul style={{ listStyle: "none", marginBottom: "1rem" }}>
            {["Droit d'accès à vos données personnelles", "Droit de rectification", "Droit à l'effacement (droit à l'oubli)", "Droit à la portabilité", "Droit d'opposition au traitement"].map(item => (
              <li key={item} style={liStyle}>· {item}</li>
            ))}
          </ul>
          <p style={pStyle}>
            Pour exercer ces droits, contactez-nous à : levaqueangel@gmail.com.
            Les données collectées (nom, email, informations morphologiques) sont utilisées uniquement pour la génération et la livraison des programmes personnalisés.
            Elles ne sont jamais vendues à des tiers.
          </p>
        </section>

        <div style={{ height: "0.5px", background: "#242424", margin: "3rem 0" }} />

        {/* ── CGV ── */}
        <section style={sectionStyle}>
          <h2 style={h1Style}>2. Conditions Générales de Vente</h2>

          <h3 style={h2Style}>2.1 Objet</h3>
          <p style={pStyle}>
            Les présentes CGV régissent les relations contractuelles entre APXFITNESS et ses clients
            dans le cadre de la vente de programmes de coaching fitness personnalisés en ligne.
          </p>

          <h3 style={h2Style}>2.2 Produits et services</h3>
          <p style={pStyle}>APXFITNESS propose les offres suivantes :</p>
          <ul style={{ listStyle: "none", marginBottom: "1rem" }}>
            {[
              "Plan Starter — 49€ TTC : programme personnalisé 4 semaines livré par email",
              "Plan Forge — 129€ TTC : programme + suivi 3 mois",
              "Plan Elite — 249€ TTC : accompagnement premium 6 mois",
            ].map(item => (
              <li key={item} style={liStyle}>· {item}</li>
            ))}
          </ul>

          <h3 style={h2Style}>2.3 Commande et paiement</h3>
          <p style={pStyle}>
            La commande est validée après remplissage du formulaire de bilan et paiement en ligne sécurisé via Stripe.
            Le paiement est exigible intégralement à la commande.
          </p>

          <h3 style={h2Style}>2.4 Livraison</h3>
          <p style={pStyle}>
            Le programme personnalisé est livré par email dans un délai de 48 heures ouvrées suivant la validation du paiement.
            En cas de non-réception, contactez : levaqueangel@gmail.com.
          </p>

          <h3 style={h2Style}>2.5 Droit de rétractation</h3>
          <p style={pStyle}>
            Conformément à l'article L221-18 du Code de la consommation, le client dispose d'un délai de 14 jours calendaires
            pour exercer son droit de rétractation. Toutefois, conformément à l'article L221-28, ce droit ne s'applique pas
            aux contenus numériques dont l'exécution a commencé avec l'accord préalable du client.
          </p>

          <h3 style={h2Style}>2.6 Garantie de satisfaction</h3>
          <p style={pStyle}>
            Si le client n'est pas satisfait du programme reçu, il peut contacter le service client dans les 14 jours
            suivant la livraison pour demander une correction ou un remboursement partiel, à l'appréciation d'APXFITNESS.
          </p>

          <h3 style={h2Style}>2.7 Responsabilité</h3>
          <p style={pStyle}>
            Les programmes proposés ne remplacent pas l'avis d'un médecin ou d'un professionnel de santé.
            APXFITNESS ne saurait être tenu responsable des dommages liés à l'utilisation des programmes.
            Il appartient au client de consulter un médecin avant tout programme d'entraînement intensif.
          </p>

          <h3 style={h2Style}>2.8 Droit applicable et litiges</h3>
          <p style={pStyle}>
            Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité.
            À défaut, les tribunaux français seront seuls compétents.
          </p>
        </section>

      </div>

      {/* Footer */}
      <footer style={{ padding: "2rem 3rem", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderTop: "0.5px solid #242424" }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 5 }}>
          APXFIT<span style={{ color: "#C9A84C" }}>NESS</span>
        </div>
        <div style={{ fontSize: 11, letterSpacing: "2px", color: "#555", textTransform: "uppercase" }}>
          © 2026 APXFITNESS — Coaching personnalisé
        </div>
      </footer>
    </div>
  );
}

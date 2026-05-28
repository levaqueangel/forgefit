"use client";
import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";

const FAQ_DATA = [
  {
    cat: "programme", catLabel: "— Programmes",
    questions: [
      {
        q: "Comment est créé mon programme ?",
        a: "Ton programme est entièrement créé sur mesure à partir des informations que tu fournis dans ton bilan : ton niveau actuel, tes objectifs, ton équipement disponible, ton alimentation et tes contraintes physiques. Chaque programme est unique et adapté à ta situation réelle — il n'existe pas deux programmes identiques chez APXFITNESS."
      },
      {
        q: "Qu'est-ce que contient exactement mon programme ?",
        a: "Selon le plan choisi, ton programme comprend : un plan d'entraînement semaine par semaine avec les exercices, séries, répétitions et temps de repos, un plan nutritionnel adapté à ton objectif, des conseils de progression et de récupération. Les plans Forge et Elite incluent en plus un suivi mensuel et des ajustements selon tes retours."
      },
      {
        q: "Le programme est-il adapté si je m'entraîne à la maison ?",
        a: "Oui, absolument. Lors du bilan tu indiques ton lieu d'entraînement (salle, maison avec ou sans matériel, extérieur). Le programme est entièrement adapté à ton environnement. Pas de salle de sport ? Aucun problème — tu recevras un programme efficace avec ce dont tu disposes."
      },
      {
        q: "Je suis débutant, est-ce que ça convient ?",
        a: "Oui, nos programmes sont conçus pour tous les niveaux — débutant, intermédiaire et avancé. Lors du bilan tu indiques ton niveau actuel et le programme est calibré en conséquence. Pour les débutants, nous recommandons le plan Starter pour commencer avec des bases solides."
      },
    ]
  },
  {
    cat: "livraison", catLabel: "— Livraison",
    questions: [
      {
        q: "Dans quel délai je reçois mon programme ?",
        a: "Ton programme est livré par email sous 48 heures ouvrées après validation de ton bilan et de ton paiement. Dans la majorité des cas, tu le reçois bien avant ce délai. Si tu ne reçois rien au bout de 48h, vérifie ton dossier spam ou contacte-nous directement."
      },
      {
        q: "Sous quelle forme je reçois mon programme ?",
        a: "Tu reçois ton programme directement par email dans un format clair et lisible. Il est également accessible à tout moment depuis ton espace client sur le site — plus besoin de chercher dans ta boîte mail. Tu peux le consulter depuis ton téléphone, tablette ou ordinateur."
      },
      {
        q: "J'ai perdu mon email, comment retrouver mon programme ?",
        a: "Pas de panique ! Connecte-toi à ton espace client avec l'email et le mot de passe que tu as reçus lors de ta première commande. Ton programme est stocké en permanence dans la section \"Mon programme\". Si tu as oublié ton mot de passe, contacte-nous et nous te renverrons tes accès."
      },
    ]
  },
  {
    cat: "paiement", catLabel: "— Paiement",
    questions: [
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "Nous acceptons toutes les cartes bancaires (Visa, Mastercard, American Express) ainsi que Apple Pay et Google Pay. Le paiement est sécurisé par Stripe, le standard mondial du paiement en ligne. Tes données bancaires ne sont jamais stockées sur nos serveurs."
      },
      {
        q: "Le paiement est-il unique ou récurrent ?",
        a: "Tous nos plans sont à paiement unique — pas d'abonnement, pas de prélèvement automatique, pas de surprise. Tu paies une fois et tu reçois ton programme. Aucun engagement."
      },
      {
        q: "Puis-je passer d'un plan à un autre ?",
        a: "Oui, tu peux upgrader ton plan à tout moment. Si tu as acheté le plan Starter et souhaites passer au plan Forge, contacte-nous — nous appliquons une déduction du montant déjà payé et tu ne paies que la différence."
      },
      {
        q: "Mon paiement est-il sécurisé ?",
        a: "Oui, à 100%. Le paiement est traité par Stripe, certifié PCI DSS niveau 1 — le niveau de sécurité le plus élevé pour les transactions en ligne. Tes informations bancaires sont chiffrées et ne transitent jamais par nos serveurs."
      },
    ]
  },
  {
    cat: "coaching", catLabel: "— Coaching",
    questions: [
      {
        q: "Qui est le coach derrière APXFITNESS ?",
        a: "APXFITNESS est fondé par un coach passionné par la transformation physique et le coaching personnalisé. Chaque programme est supervisé et validé personnellement. Ce n'est pas une plateforme anonyme — tu as accès à un vrai coach humain via la messagerie de ton espace client."
      },
      {
        q: "Comment fonctionne le suivi avec les plans Forge et Elite ?",
        a: "Avec le plan Forge, tu bénéficies d'un suivi mensuel : le coach analyse ta progression, ajuste le programme selon tes retours et reste disponible via la messagerie privée. Avec le plan Elite, tu as en plus des appels visio hebdomadaires et une priorité de réponse sous 24h."
      },
      {
        q: "Mon programme peut-il être modifié après livraison ?",
        a: "Oui, avec les plans Forge et Elite. Si un exercice ne convient pas, si tu te blesses ou si tes objectifs évoluent, envoie un message au coach depuis ton espace client. Les ajustements sont inclus dans ces formules. Pour le plan Starter, une modification peut être réalisée contre un supplément."
      },
      {
        q: "Le programme prend-il en compte mes blessures ?",
        a: "Absolument. Le bilan comporte un champ dédié aux blessures et contraintes physiques. Ces informations sont intégralement prises en compte dans la conception du programme — les exercices incompatibles avec ta condition sont remplacés par des alternatives sûres et efficaces. En cas de doute, consulte toujours un médecin avant de commencer."
      },
    ]
  },
  {
    cat: "compte", catLabel: "— Compte client",
    questions: [
      {
        q: "Comment accéder à mon espace client ?",
        a: "Après ta commande, tu reçois par email tes identifiants de connexion (email + mot de passe). Rends-toi sur apxfitness.fr/client et connecte-toi. Tu accèdes à ton programme, à la messagerie avec le coach et à l'historique de tes plans."
      },
      {
        q: "J'ai oublié mon mot de passe, que faire ?",
        a: "Envoie un email à levaqueangel@gmail.com depuis l'adresse utilisée lors de ta commande, en indiquant \"Mot de passe oublié\". Le coach te renverra tes accès dans les plus brefs délais."
      },
      {
        q: "Mes données personnelles sont-elles protégées ?",
        a: "Oui. Tes données sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers. Conformément au RGPD, tu peux à tout moment demander l'accès, la modification ou la suppression de tes données en nous contactant par email. Consulte nos mentions légales pour plus de détails."
      },
    ]
  },
];

const CATS = [
  { id: "all", label: "Tout" },
  { id: "programme", label: "Programmes" },
  { id: "livraison", label: "Livraison" },
  { id: "paiement", label: "Paiement" },
  { id: "coaching", label: "Coaching" },
  { id: "compte", label: "Compte client" },
];

export default function FaqPage() {
  const router = useRouter();
  const { lang, setLang, t, LANGS } = useLang();
  
  // SEO title dynamique
  if (typeof document !== "undefined") document.title = "FAQ — APXFITNESS";
  const [activeCat, setActiveCat] = useState("all");
  const [openQ, setOpenQ] = useState(null);

  const toggle = (id) => setOpenQ(openQ === id ? null : id);

  const filteredData = FAQ_DATA.filter(s => activeCat === "all" || s.cat === activeCat);

  return (
    <div style={{ background: "#0A0A0A", color: "#F0EDE8", minHeight: "100vh", fontFamily: "'Syne',sans-serif" }}>
      <Head>
        <title>FAQ — Questions fréquentes | APXFITNESS</title>
        <meta name="description" content="Toutes les réponses à vos questions sur les programmes APXFITNESS : livraison, paiement, coaching personnalisé et espace client." />
      </Head>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Syne:wght@400;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .gold{background:linear-gradient(90deg,#C9A84C,#E8C87A,#F5D98A,#C9A84C);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.5s linear infinite}
        .cat-btn{background:transparent;border:0.5px solid #242424;color:#555;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:7px 16px;cursor:pointer;transition:all 0.2s}
        .cat-btn:hover,.cat-btn.active{border-color:#C9A84C;color:#C9A84C;background:rgba(201,168,76,0.05)}
        .faq-q{display:flex;justify-content:space-between;align-items:center;padding:20px 0;cursor:pointer;gap:16px;transition:color 0.2s}
        .faq-q:hover .faq-q-text{color:#E8C87A}
        .faq-icon{flex-shrink:0;width:22px;height:22px;border:0.5px solid #333;display:flex;align-items:center;justify-content:center;font-size:16px;color:#C9A84C;transition:transform 0.3s}
        .faq-icon.open{transform:rotate(45deg);background:rgba(201,168,76,0.1);border-color:#C9A84C}
        .footer-link{cursor:pointer;transition:color 0.2s}
        .footer-link:hover{color:#E8C87A !important}
        @media(max-width:768px){.hero-pad{padding:3rem 1.5rem 2rem !important}.content-pad{padding:2rem 1.5rem 4rem !important}}
      `}</style>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "0.5px solid #242424", position: "sticky", top: 0, background: "#0A0A0A", zIndex: 100 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 5, cursor: "pointer" }} onClick={() => router.push("/")}>
          APXFIT<span style={{ color: "#C9A84C" }}>NESS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
          <button onClick={() => router.push("/")} style={{ background: "transparent", border: "0.5px solid #242424", color: "#555", fontFamily: "'Syne',sans-serif", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", padding: "8px 18px", cursor: "pointer" }}>
            ← Retour
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero-pad" style={{ padding: "4rem 2rem 3rem", textAlign: "center", borderBottom: "0.5px solid #242424", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%,rgba(201,168,76,0.04),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ fontSize: 11, letterSpacing: "4px", textTransform: "uppercase", color: "#C9A84C", marginBottom: "1rem" }}>— Centre d'aide</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(40px,6vw,64px)", fontWeight: 600, lineHeight: 1, marginBottom: "1rem" }}>
          Questions<br /><em className="gold" style={{ fontStyle: "italic" }}>fréquentes</em>
        </h1>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: "#555", maxWidth: 480, margin: "0 auto 2rem", lineHeight: 1.7 }}>
          Tout ce que tu dois savoir sur nos programmes et notre méthode.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {CATS.map(c => (
            <button key={c.id} className={`cat-btn${activeCat === c.id ? " active" : ""}`} onClick={() => setActiveCat(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="content-pad" style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        {filteredData.map((section) => (
          <div key={section.cat}>
            <div style={{ fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", padding: "2rem 0 1rem", borderBottom: "0.5px solid #1A1A1A" }}>
              {section.catLabel}
            </div>
            {section.questions.map((item, i) => {
              const id = `${section.cat}-${i}`;
              const isOpen = openQ === id;
              return (
                <div key={id} style={{ borderBottom: "0.5px solid #242424" }}>
                  <div className="faq-q" onClick={() => toggle(id)}>
                    <span className="faq-q-text" style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: isOpen ? "#E8C87A" : "#F0EDE8", transition: "color 0.2s", lineHeight: 1.4 }}>
                      {item.q}
                    </span>
                    <span className={`faq-icon${isOpen ? " open" : ""}`}>+</span>
                  </div>
                  {isOpen && (
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: "#888", lineHeight: 1.8, paddingBottom: 20, animation: "fadeUp 0.3s ease" }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* CTA contact */}
        <div style={{ marginTop: "3rem", padding: "2rem", border: "0.5px solid #242424", textAlign: "center", background: "#0D0D0D" }}>
          <div style={{ fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", marginBottom: 8 }}>— Une autre question ?</div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: "#555", marginBottom: "1.5rem", lineHeight: 1.7 }}>
            Tu ne trouves pas la réponse que tu cherches ?<br />Le coach répond généralement sous 24h.
          </p>
          <a href="mailto:levaqueangel@gmail.com" style={{ display: "inline-block", background: "linear-gradient(135deg,#C9A84C,#A67C2E)", color: "#0A0A0A", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", padding: "13px 28px", textDecoration: "none" }}>
            Contacter le coach →
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "0.5px solid #242424", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 5 }}>APXFIT<span style={{ color: "#C9A84C" }}>NESS</span></div>
        <div style={{ fontSize: 11, letterSpacing: "2px", color: "#555", textTransform: "uppercase" }}>{t.footer.copy}</div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <span className="footer-link" style={{ fontSize: 11, letterSpacing: "2px", color: "#555", textTransform: "uppercase", textDecoration: "underline" }} onClick={() => router.push("/mentions-legales")}>
            {t.footer.legal}
          </span>
        </div>
      </footer>
    </div>
  );
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

export const metadata = {
  title: "Tarifs Coaching Fitness — Plans Starter, Forge, Elite | APXFITNESS",
  description: "Comparez nos 3 plans de coaching personnalisé : Starter 18,99€/mois, Forge 38,99€/mois, Elite 68,99€/mois. Programme musculation + nutrition sur mesure, livré en 48h.",
  openGraph: {
    title: "Tarifs Coaching Fitness | APXFITNESS",
    description: "3 plans sur mesure dès 49€. Programme + nutrition + suivi, livré en 48h.",
    url: SITE + "/tarifs", siteName: "APXFITNESS", locale: "fr_FR", type: "website",
  },
  twitter: { card: "summary_large_image", title: "Tarifs APXFITNESS", description: "Coaching fitness dès 49€ — programme sur mesure en 48h." },
  alternates: { canonical: SITE + "/tarifs" },
};

const tarifsJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Plans de coaching APXFITNESS",
  "description": "3 formules de coaching fitness personnalisé en ligne",
  "itemListElement": [
    {
      "@type": "ListItem", "position": 1,
      "item": {
        "@type": "Product", "name": "Plan Starter", "description": "Programme musculation + nutrition personnalisé, livré par email en 48h.",
        "offers": { "@type": "Offer", "price": "18.99", "priceCurrency": "EUR", "priceSpecification": { "@type": "RecurringChargeSpecification", "billingDuration": 1, "billingIncrement": "month" }, "availability": "https://schema.org/InStock", "url": SITE + "/bilan?plan=starter" },
      },
    },
    {
      "@type": "ListItem", "position": 2,
      "item": {
        "@type": "Product", "name": "Plan Forge", "description": "Programme complet avec suivi mensuel, ajustements et accès espace client.",
        "offers": { "@type": "Offer", "price": "38.99", "priceCurrency": "EUR", "priceSpecification": { "@type": "RecurringChargeSpecification", "billingDuration": 1, "billingIncrement": "month" }, "availability": "https://schema.org/InStock", "url": SITE + "/bilan?plan=forge" },
      },
    },
    {
      "@type": "ListItem", "position": 3,
      "item": {
        "@type": "Product", "name": "Plan Elite", "description": "Accompagnement complet avec messagerie directe coach, révisions illimitées et accès recettes.",
        "offers": { "@type": "Offer", "price": "68.99", "priceCurrency": "EUR", "priceSpecification": { "@type": "RecurringChargeSpecification", "billingDuration": 1, "billingIncrement": "month" }, "availability": "https://schema.org/InStock", "url": SITE + "/bilan?plan=elite" },
      },
    },
  ],
};

export default function Layout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(tarifsJsonLd) }} />
      {children}
    </>
  );
}

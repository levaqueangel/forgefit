const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

export const metadata = {
  title: "Tarifs Coaching Fitness — Plans Starter, Forge, Elite | APXFITNESS",
  description: "Comparez nos 3 plans de coaching personnalisé : Starter 49€, Forge 129€, Elite 249€. Programme musculation + nutrition sur mesure, livré en 48h.",
  openGraph: {
    title: "Tarifs Coaching Fitness | APXFITNESS",
    description: "3 plans sur mesure dès 49€. Programme + nutrition + suivi, livré en 48h.",
    url: SITE + "/tarifs", siteName: "APXFITNESS", locale: "fr_FR", type: "website",
    images: [{ url: SITE + "/og-default.jpg", width: 1200, height: 630, alt: "Tarifs APXFITNESS" }],
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
        "offers": { "@type": "Offer", "price": "49", "priceCurrency": "EUR", "availability": "https://schema.org/InStock", "url": SITE + "/bilan?plan=starter" },
      },
    },
    {
      "@type": "ListItem", "position": 2,
      "item": {
        "@type": "Product", "name": "Plan Forge", "description": "Programme complet avec suivi mensuel, ajustements et accès espace client.",
        "offers": { "@type": "Offer", "price": "129", "priceCurrency": "EUR", "availability": "https://schema.org/InStock", "url": SITE + "/bilan?plan=forge" },
      },
    },
    {
      "@type": "ListItem", "position": 3,
      "item": {
        "@type": "Product", "name": "Plan Elite", "description": "Accompagnement complet avec messagerie directe coach, révisions illimitées et accès recettes.",
        "offers": { "@type": "Offer", "price": "249", "priceCurrency": "EUR", "availability": "https://schema.org/InStock", "url": SITE + "/bilan?plan=elite" },
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

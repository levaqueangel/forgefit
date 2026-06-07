const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

export const metadata = {
  title: "Transformations & Résultats Clients | APXFITNESS",
  description: "+200 clients accompagnés. Découvrez les vraies transformations : prise de masse, perte de poids, renforcement musculaire. Avant/après réels.",
  openGraph: {
    title: "Transformations & Résultats Clients | APXFITNESS",
    description: "+200 clients accompagnés. Vraies transformations : prise de masse, perte de poids, force.",
    url: SITE + "/resultats", siteName: "APXFITNESS", locale: "fr_FR", type: "website",
    images: [{ url: SITE + "/og-default.jpg", width: 1200, height: 630, alt: "Résultats clients APXFITNESS" }],
  },
  twitter: { card: "summary_large_image", title: "Transformations Clients | APXFITNESS", description: "+200 clients transformés. Vrais résultats avant/après." },
  alternates: { canonical: SITE + "/resultats" },
};

const aggregateRatingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Coaching Fitness Personnalisé APXFITNESS",
  "description": "Programme musculation et nutrition sur mesure, livré en 48h.",
  "brand": { "@type": "Brand", "name": "APXFITNESS" },
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "49",
    "highPrice": "249",
    "priceCurrency": "EUR",
    "offerCount": "3",
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "200",
    "bestRating": "5",
    "worstRating": "1",
  },
  "review": [
    { "@type": "Review", "author": { "@type": "Person", "name": "Maxime R." }, "reviewRating": { "@type": "Rating", "ratingValue": "5" }, "reviewBody": "Le programme était adapté à mes contraintes horaires exactes. Les résultats ont suivi dès la 3ème semaine." },
    { "@type": "Review", "author": { "@type": "Person", "name": "Léa S." }, "reviewRating": { "@type": "Rating", "ratingValue": "5" }, "reviewBody": "Le premier programme qui prenait vraiment en compte ma cuisine, mon emploi du temps et mes préférences alimentaires." },
    { "@type": "Review", "author": { "@type": "Person", "name": "Thomas M." }, "reviewRating": { "@type": "Rating", "ratingValue": "5" }, "reviewBody": "Le suivi des charges dans l'app m'a permis de voir que je progressais même quand je ne le ressentais pas." },
  ],
};

export default function Layout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingJsonLd) }} />
      {children}
    </>
  );
}

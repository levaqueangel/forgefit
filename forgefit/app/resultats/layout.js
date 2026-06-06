const SITE = "https://apxfitness-brown.vercel.app";
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
export default function Layout({ children }) { return children; }

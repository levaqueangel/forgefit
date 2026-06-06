const SITE = "https://apxfitness-brown.vercel.app";
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
export default function Layout({ children }) { return children; }

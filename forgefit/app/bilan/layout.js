const SITE = "https://apxfitness-brown.vercel.app";
export const metadata = {
  title: "Bilan Fitness Gratuit — Reçois Ton Programme en 48h | APXFITNESS",
  description: "Complète ton bilan en 5 min et reçois un programme musculation 100% personnalisé. Nutrition, entraînement, objectifs. Gratuit et sans engagement.",
  openGraph: {
    title: "Bilan Fitness Gratuit — Programme Personnalisé en 48h | APXFITNESS",
    description: "5 minutes pour recevoir ton programme sur mesure. Nutrition et entraînement adaptés.",
    url: SITE + "/bilan", siteName: "APXFITNESS", locale: "fr_FR", type: "website",
    images: [{ url: SITE + "/og-default.jpg", width: 1200, height: 630, alt: "Bilan Fitness Gratuit APXFITNESS" }],
  },
  twitter: { card: "summary_large_image", title: "Bilan Fitness Gratuit | APXFITNESS", description: "5 min pour ton programme sur mesure." },
  alternates: { canonical: SITE + "/bilan" },
};
export default function Layout({ children }) { return children; }

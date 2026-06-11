const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

export const metadata = {
  title: "Recettes Fitness & Nutrition Sportive | APXFITNESS",
  description: "Recettes saines et savoureuses adaptées à tes objectifs : perte de gras, prise de masse, remise en forme. Macros calculées pour chaque recette.",
  openGraph: {
    title: "Recettes Fitness & Nutrition Sportive | APXFITNESS",
    description: "Recettes saines adaptées à tes objectifs fitness. Macros calculées.",
    url: SITE + "/recettes", siteName: "APXFITNESS", locale: "fr_FR", type: "website",
  },
  twitter: { card: "summary_large_image", title: "Recettes Fitness | APXFITNESS", description: "Recettes saines avec macros calculées." },
  alternates: { canonical: SITE + "/recettes" },
};

export default function Layout({ children }) { return children; }

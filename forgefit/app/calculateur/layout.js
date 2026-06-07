const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";
export const metadata = {
  title: "Calculateur IMC, Calories & Macros Gratuit | APXFITNESS",
  description: "Calcule ton IMC, ton métabolisme de base (TDEE) et tes macronutriments avec la formule Harris-Benedict. Résultats instantanés et gratuits.",
  openGraph: {
    title: "Calculateur IMC, Calories & Macros Gratuit | APXFITNESS",
    description: "Calcule ton IMC, ton TDEE et tes macros. Résultats instantanés.",
    url: SITE + "/calculateur", siteName: "APXFITNESS", locale: "fr_FR", type: "website",
    images: [{ url: SITE + "/og-default.jpg", width: 1200, height: 630, alt: "Calculateur Fitness APXFITNESS" }],
  },
  twitter: { card: "summary_large_image", title: "Calculateur IMC & Calories Gratuit | APXFITNESS", description: "Calcule ton IMC, TDEE et macros instantanément." },
  alternates: { canonical: SITE + "/calculateur" },
};
export default function Layout({ children }) { return children; }

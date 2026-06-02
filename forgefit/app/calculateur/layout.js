export const metadata = {
  title: "Calculateur IMC, Calories & Macros Gratuit | APXFITNESS",
  description: "Calcule ton IMC, ton TDEE et tes macros avec Harris-Benedict. Résultats instantanés.",
  openGraph: {
    title: "Calculateur IMC, Calories & Macros Gratuit | APXFITNESS",
    description: "Calcule ton IMC, ton TDEE et tes macros avec Harris-Benedict. Résultats instantanés.",
    url: "https://apxfitness-brown.vercel.app/calculateur",
    siteName: "APXFITNESS",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "https://apxfitness-brown.vercel.app/og-default.jpg", width: 1200, height: 630, alt: "Calculateur IMC, Calories & Macros Gratuit | APXFITNESS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Calculateur IMC, Calories & Macros Gratuit | APXFITNESS",
    description: "Calcule ton IMC, ton TDEE et tes macros avec Harris-Benedict. Résultats instantanés.",
    images: ["https://apxfitness-brown.vercel.app/og-default.jpg"],
  },
  alternates: {
    canonical: "https://apxfitness-brown.vercel.app/calculateur",
  },
};
export default function Layout({ children }) { return children; }

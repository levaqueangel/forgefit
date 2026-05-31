import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculateur IMC, Calories & Macros Gratuit | APXFITNESS",
  description: "Calcule ton IMC, ton TDEE et tes macros (protéines, glucides, lipides) avec la formule Harris-Benedict. Outil gratuit et précis.",
  keywords: ["calculateur IMC","calculateur calories","calculateur macros","TDEE","Harris-Benedict"],
  openGraph: {
    title: "Calculateur IMC, Calories & Macros Gratuit | APXFITNESS",
    description: "Calcule ton IMC, ton TDEE et tes macros (protéines, glucides, lipides) avec la formule Harris-Benedict. Outil gratuit et précis.",
    url: "https://apxfitness-brown.vercel.app/calculateur",
    siteName: "APXFITNESS",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calculateur IMC, Calories & Macros Gratuit | APXFITNESS",
    description: "Calcule ton IMC, ton TDEE et tes macros (protéines, glucides, lipides) avec la formule Harris-Benedict. Outil gratuit et précis.",
  },
  alternates: {
    canonical: "https://apxfitness-brown.vercel.app/calculateur",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

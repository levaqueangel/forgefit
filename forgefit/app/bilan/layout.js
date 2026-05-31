import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bilan Fitness Gratuit — Obtenir Mon Programme Sur Mesure | APXFITNESS",
  description: "Remplis ton bilan en 5 minutes et reçois un programme de musculation complet généré par IA : séances, exercices, nutrition et macros calculés pour toi.",
  keywords: ["bilan fitness","programme personnalisé","coaching en ligne","programme musculation gratuit"],
  openGraph: {
    title: "Bilan Fitness Gratuit — Obtenir Mon Programme Sur Mesure | APXFITNESS",
    description: "Remplis ton bilan en 5 minutes et reçois un programme de musculation complet généré par IA : séances, exercices, nutrition et macros calculés pour toi.",
    url: "https://apxfitness-brown.vercel.app/bilan",
    siteName: "APXFITNESS",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bilan Fitness Gratuit — Obtenir Mon Programme Sur Mesure | APXFITNESS",
    description: "Remplis ton bilan en 5 minutes et reçois un programme de musculation complet généré par IA : séances, exercices, nutrition et macros calculés pour toi.",
  },
  alternates: {
    canonical: "https://apxfitness-brown.vercel.app/bilan",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

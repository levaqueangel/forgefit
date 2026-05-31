import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos — Angel Levaque, Coach Fitness | APXFITNESS",
  description: "Découvrez Angel Levaque, coach fitness indépendant avec +5 ans d'expérience et +200 clients transformés. Méthode basée sur la science, programmes IA.",
  keywords: ["coach fitness en ligne","Angel Levaque","coaching personnalisé","programme musculation sur mesure"],
  openGraph: {
    title: "À propos — Angel Levaque, Coach Fitness | APXFITNESS",
    description: "Découvrez Angel Levaque, coach fitness indépendant avec +5 ans d'expérience et +200 clients transformés. Méthode basée sur la science, programmes IA.",
    url: "https://apxfitness-brown.vercel.app/a-propos",
    siteName: "APXFITNESS",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "À propos — Angel Levaque, Coach Fitness | APXFITNESS",
    description: "Découvrez Angel Levaque, coach fitness indépendant avec +5 ans d'expérience et +200 clients transformés. Méthode basée sur la science, programmes IA.",
  },
  alternates: {
    canonical: "https://apxfitness-brown.vercel.app/a-propos",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

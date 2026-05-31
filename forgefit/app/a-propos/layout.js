import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos — Angel Levaque, Coach Fitness | APXFITNESS",
  description: "Découvrez Angel Levaque, coach fitness indépendant avec +5 ans d'expérience et +200 clients transformés. Programmes personnalisés IA, nutrition sur mesure.",
  openGraph: {
    title: "À propos — Angel Levaque | APXFITNESS",
    description: "Coach fitness indépendant, +200 clients transformés. Programmes sur mesure générés par IA.",
    url: "https://apxfitness-brown.vercel.app/a-propos",
  },
  alternates: {
    canonical: "https://apxfitness-brown.vercel.app/a-propos",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

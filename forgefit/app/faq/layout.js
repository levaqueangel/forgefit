import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ Coaching Fitness — Toutes Vos Questions | APXFITNESS",
  description: "Réponses à toutes vos questions sur le coaching fitness en ligne : comment fonctionne le programme, la nutrition, les paiements, les résultats.",
  keywords: ["FAQ coaching","questions coaching fitness","programme musculation en ligne","coaching prix"],
  openGraph: {
    title: "FAQ Coaching Fitness — Toutes Vos Questions | APXFITNESS",
    description: "Réponses à toutes vos questions sur le coaching fitness en ligne : comment fonctionne le programme, la nutrition, les paiements, les résultats.",
    url: "https://apxfitness-brown.vercel.app/faq",
    siteName: "APXFITNESS",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ Coaching Fitness — Toutes Vos Questions | APXFITNESS",
    description: "Réponses à toutes vos questions sur le coaching fitness en ligne : comment fonctionne le programme, la nutrition, les paiements, les résultats.",
  },
  alternates: {
    canonical: "https://apxfitness-brown.vercel.app/faq",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

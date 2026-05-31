import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog Fitness & Musculation — Conseils d'Expert | APXFITNESS",
  description: "Articles de référence sur la musculation, la nutrition sportive et la remise en forme. Rédigés par un coach certifié pour progresser efficacement.",
  keywords: ["blog musculation","conseils fitness","nutrition sportive","programme entraînement"],
  openGraph: {
    title: "Blog Fitness & Musculation — Conseils d'Expert | APXFITNESS",
    description: "Articles de référence sur la musculation, la nutrition sportive et la remise en forme. Rédigés par un coach certifié pour progresser efficacement.",
    url: "https://apxfitness-brown.vercel.app/blog",
    siteName: "APXFITNESS",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog Fitness & Musculation — Conseils d'Expert | APXFITNESS",
    description: "Articles de référence sur la musculation, la nutrition sportive et la remise en forme. Rédigés par un coach certifié pour progresser efficacement.",
  },
  alternates: {
    canonical: "https://apxfitness-brown.vercel.app/blog",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

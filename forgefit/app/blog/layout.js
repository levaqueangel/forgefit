export const metadata = {
  title: "Blog Fitness | Conseils Musculation & Nutrition — APXFITNESS",
  description: "Articles de coaching fitness : musculation, perte de poids, nutrition sportive. Conseils experts pour progresser.",
  keywords: "musculation, nutrition sportive, perte de poids, programme fitness, coaching APXFITNESS",
  openGraph: {
    title: "Blog Fitness APXFITNESS",
    description: "Conseils musculation, nutrition et coaching personnalisé.",
    url: "https://apxfitness-brown.vercel.app/blog",
    siteName: "APXFITNESS",
    type: "website",
    locale: "fr_FR",
  },
  alternates: { canonical: "https://apxfitness-brown.vercel.app/blog" },
};

export default function BlogLayout({ children }) {
  return children;
}

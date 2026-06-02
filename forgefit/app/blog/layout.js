export const metadata = {
  title: "Blog Fitness & Musculation — Conseils Coach | APXFITNESS",
  description: "15 articles sur la musculation, nutrition et récupération rédigés par un coach certifié.",
  openGraph: {
    title: "Blog Fitness & Musculation — Conseils Coach | APXFITNESS",
    description: "15 articles sur la musculation, nutrition et récupération rédigés par un coach certifié.",
    url: "https://apxfitness-brown.vercel.app/blog",
    siteName: "APXFITNESS",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "https://apxfitness-brown.vercel.app/og-blog.jpg", width: 1200, height: 630, alt: "Blog Fitness & Musculation — Conseils Coach | APXFITNESS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog Fitness & Musculation — Conseils Coach | APXFITNESS",
    description: "15 articles sur la musculation, nutrition et récupération rédigés par un coach certifié.",
    images: ["https://apxfitness-brown.vercel.app/og-blog.jpg"],
  },
  alternates: {
    canonical: "https://apxfitness-brown.vercel.app/blog",
  },
};
export default function Layout({ children }) { return children; }

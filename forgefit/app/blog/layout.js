const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";
export const metadata = {
  title: "Blog Fitness & Musculation — Conseils Coach | APXFITNESS",
  description: "Articles sur la musculation, la nutrition sportive et la récupération rédigés par un coach certifié. Conseils pratiques pour progresser.",
  openGraph: {
    title: "Blog Fitness & Musculation — Conseils Coach | APXFITNESS",
    description: "Articles musculation, nutrition et récupération par un coach certifié.",
    url: SITE + "/blog", siteName: "APXFITNESS", locale: "fr_FR", type: "website",
  },
  twitter: { card: "summary_large_image", title: "Blog Fitness & Musculation | APXFITNESS", description: "Conseils pratiques musculation et nutrition par un coach certifié." },
  alternates: { canonical: SITE + "/blog" },
};
export default function Layout({ children }) { return children; }

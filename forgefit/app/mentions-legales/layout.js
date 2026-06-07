const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";
export const metadata = {
  title: "Mentions Légales | APXFITNESS",
  description: "Mentions légales, politique de confidentialité et conditions générales d utilisation de APXFITNESS.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Mentions Légales | APXFITNESS",
    description: "Mentions légales, politique de confidentialité et conditions générales d utilisation de APXFITNESS.",
    url: SITE + "/mentions-legales",
    siteName: "APXFITNESS",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentions Légales | APXFITNESS",
    description: "Mentions légales, politique de confidentialité et conditions générales d utilisation de APXFITNESS.",
  },
  alternates: {
    canonical: SITE + "/mentions-legales",
  },
};
export default function Layout({ children }) { return children; }

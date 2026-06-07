const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";
export const metadata = {
  title: "Statut des Services | APXFITNESS",
  description: "État en temps réel des services APXFITNESS : API, Firebase, emails, IA.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Statut des Services | APXFITNESS",
    description: "État en temps réel des services APXFITNESS : API, Firebase, emails, IA.",
    url: SITE + "/status",
    siteName: "APXFITNESS",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Statut des Services | APXFITNESS",
    description: "État en temps réel des services APXFITNESS : API, Firebase, emails, IA.",
  },
  alternates: {
    canonical: SITE + "/status",
  },
};
export default function Layout({ children }) { return children; }

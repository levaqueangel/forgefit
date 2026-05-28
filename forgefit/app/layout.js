import "./globals.css";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";

export const metadata = {
  title: "APXFITNESS — Coaching fitness personnalisé",
  description: "Programmes de musculation et remise en forme 100% sur mesure. Bilan gratuit, programme généré par IA et livré par email sous 48h. Coaching personnalisé pour tous les niveaux.",
  keywords: "coaching fitness personnalisé, programme musculation sur mesure, remise en forme, perte de poids, prise de masse, coach fitness en ligne, programme sport personnalisé, APXFITNESS",
  authors: [{ name: "APXFITNESS" }],
  creator: "APXFITNESS",
  publisher: "APXFITNESS",
  robots: "index, follow",
  openGraph: {
    title: "APXFITNESS — Coaching fitness personnalisé",
    description: "Programmes de musculation et remise en forme 100% sur mesure. Bilan gratuit, programme généré par IA sous 48h.",
    url: "https://apxfitness-brown.vercel.app",
    siteName: "APXFITNESS",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "APXFITNESS — Coaching fitness personnalisé",
    description: "Programmes de musculation et remise en forme 100% sur mesure.",
  },
  alternates: {
    canonical: "https://apxfitness-brown.vercel.app",
  },
  verification: {
    google: "xfrTOInrUrA35W0OBd-BQHoeB5rKu64Urs5pa_Wo59s",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0A0A0A" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

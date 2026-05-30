import "./globals.css";
import { Cormorant_Garamond, Syne } from "next/font/google";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";
import ErrorBoundary from "./ErrorBoundary";
import { Suspense } from "react";
import { GoogleAnalytics } from "./GoogleAnalytics";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata = {
  title: "APXFITNESS — Coaching fitness personnalisé",
  description: "Programmes de musculation et remise en forme 100% sur mesure. Programme personnalisé livré sous 48h. Coaching adapté à ton niveau, tes objectifs et ton équipement.",
  keywords: "coaching fitness personnalisé, programme musculation sur mesure, remise en forme, perte de poids, prise de masse, coach fitness en ligne, APXFITNESS",
  authors: [{ name: "APXFITNESS Coach" }],
  creator: "APXFITNESS",
  publisher: "APXFITNESS",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://apxfitness-brown.vercel.app",
  },
  openGraph: {
    title: "APXFITNESS — Coaching fitness personnalisé",
    description: "Programmes de musculation et remise en forme 100% sur mesure. Livré sous 48h.",
    url: "https://apxfitness-brown.vercel.app",
    siteName: "APXFITNESS",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "APXFITNESS — Coaching fitness personnalisé",
    description: "Programmes sur mesure livrés sous 48h. Coaching personnalisé pour tous niveaux.",
    creator: "@apxfitness",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0A0A0A" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="APXFITNESS" />
        {/* Polices chargées via next/font - pas besoin de links manuels */}
      </head>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

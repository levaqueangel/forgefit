import { GoogleAnalytics } from "./GoogleAnalytics";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";
import ErrorBoundary from "./ErrorBoundary";

export const metadata = {
  metadataBase: new URL("https://apxfitness-brown.vercel.app"),
  title: {
    default: "APXFITNESS — Coaching Fitness Personnalisé en Ligne",
    template: "%s | APXFITNESS",
  },
  description: "Programme musculation 100% sur mesure généré par IA en 48h. Nutrition calculée, séances adaptées à ton niveau. Coach personnel en ligne dès 49€.",
  keywords: ["coaching fitness","programme musculation","coach personnel en ligne","nutrition sportive","prise de masse","perte de poids"],
  authors: [{ name: "Angel Levaque", url: "https://apxfitness-brown.vercel.app/a-propos" }],
  creator: "APXFITNESS",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "APXFITNESS",
    title: "APXFITNESS — Coaching Fitness Personnalisé en Ligne",
    description: "Programme musculation 100% sur mesure généré par IA en 48h.",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "APXFITNESS" }],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@apxfitness",
    images: ["/og-default.jpg"],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Syne:wght@400;600;700;800&display=optional"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning={true}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <GoogleAnalytics />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

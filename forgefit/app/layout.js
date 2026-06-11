import { GoogleAnalytics } from "./GoogleAnalytics";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";
import PWAInstallPrompt from "./PWAInstallPrompt";
import ErrorBoundary from "./ErrorBoundary";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "APXFITNESS — Coaching Fitness Personnalisé en Ligne",
    template: "%s | APXFITNESS",
  },
  description: "Programme musculation 100% sur mesure généré par IA en 48h. Nutrition calculée, séances adaptées à ton niveau. Coach personnel en ligne dès 18,99€/mois.",
  keywords: ["coaching fitness","programme musculation","coach personnel en ligne","nutrition sportive","prise de masse","perte de poids"],
  authors: [{ name: "Angel Levaque", url: `${SITE_URL}/a-propos` }],
  creator: "APXFITNESS",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "APXFITNESS",
    title: "APXFITNESS — Coaching Fitness Personnalisé en Ligne",
    description: "Programme musculation 100% sur mesure généré par IA en 48h.",
    // images: auto-généré depuis app/opengraph-image.js
  },
  twitter: {
    card: "summary_large_image",
    creator: "@apxfitness",
    // images: auto-généré depuis app/opengraph-image.js
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  // icons: auto-géré par app/icon.js et app/apple-icon.js (Next.js App Router)
  alternates: {
    canonical: SITE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#business`,
      "name": "APXFITNESS",
      "description": "Coaching fitness personnalisé en ligne. Programmes musculation et nutrition sur mesure générés par IA.",
      "url": SITE_URL,
      "email": "coach.apxfitness11@gmail.com",
      "founder": { "@type": "Person", "name": "Angel Levaque" },
      "foundingDate": "2020",
      "areaServed": { "@type": "Country", "name": "France" },
      "priceRange": "€€",
      "serviceType": "Coaching fitness en ligne",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "340",
        "bestRating": "5",
        "worstRating": "1",
      },
    },
    {
      "@type": "Service",
      "name": "Programme Fitness Personnalisé",
      "provider": { "@id": `${SITE_URL}/#business` },
      "description": "Programme musculation et nutrition 100% personnalisé, généré par IA en moins de 48h selon ton profil et tes objectifs.",
      "offers": [
        { "@type": "Offer", "name": "Plan Starter", "price": "18.99", "priceCurrency": "EUR", "priceSpecification": { "@type": "RecurringChargeSpecification", "billingDuration": 1, "billingIncrement": "month" } },
        { "@type": "Offer", "name": "Plan Forge",   "price": "38.99", "priceCurrency": "EUR", "priceSpecification": { "@type": "RecurringChargeSpecification", "billingDuration": 1, "billingIncrement": "month" } },
        { "@type": "Offer", "name": "Plan Elite",   "price": "68.99", "priceCurrency": "EUR", "priceSpecification": { "@type": "RecurringChargeSpecification", "billingDuration": 1, "billingIncrement": "month" } },
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E8B000" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* iOS / Safari — ignore manifest.json, besoin de ses propres tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="APXFITNESS" />
        <link rel="apple-touch-icon" href="/api/pwa-icon?size=192" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
          fetchPriority="high"
        />
      </head>
      <body suppressHydrationWarning={true}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <GoogleAnalytics />
        <ServiceWorkerRegistration />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}

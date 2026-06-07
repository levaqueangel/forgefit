/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // Headers de cache + sécurité
  async headers() {
    return [
      // Vidéos — immutable (hash dans le nom)
      { source: "/videos/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/:path*.mp4",    headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      // Images statiques — 7 jours + stale-while-revalidate
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      { source: "/:path*\\.(?:png|jpg|jpeg|webp|avif|gif|svg)", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      // Assets nommés
      { source: "/(favicon.ico|apple-icon.png|opengraph-image)", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
      // Headers sécurité globaux
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()" },
          // HSTS — force HTTPS pour 2 ans (activer après vérification du domaine en HTTPS)
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // CSP — restreint les origines de scripts, styles, connexions réseau
          // 'unsafe-inline' requis pour Next.js hydration + React inline styles
          // 'unsafe-eval' requis par certains modules Firebase côté client
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com wss://*.firebaseio.com https://www.google-analytics.com https://www.googletagmanager.com https://api.anthropic.com",
              "media-src 'self' blob:",
              "worker-src 'self' blob:",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          // Anti-clickjacking redondant avec frame-ancestors mais utile pour vieux browsers
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },

  // Optimisation des images Next.js
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  // Variables d'environnement accessibles côté client
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app",
  },
};

module.exports = nextConfig;

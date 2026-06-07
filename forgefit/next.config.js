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
      { source: "/(favicon.ico|apple-touch-icon.png|og-default.jpg)", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
      // Headers sécurité globaux
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",          value: "DENY" },
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=()" },
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

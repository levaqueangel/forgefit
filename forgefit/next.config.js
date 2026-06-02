/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Performance & Bundle ────────────────────────────────────────────
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Optimisation bundle : exclure les modules lourds inutilisés
  modularizeImports: {
    "firebase/app":       { transform: "firebase/app" },
    "firebase/auth":      { transform: "firebase/auth" },
    "firebase/firestore": { transform: "firebase/firestore" },
  },
  // Headers de sécurité et performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",           value: "SAMEORIGIN" },
          { key: "X-XSS-Protection",          value: "1; mode=block" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
          { key: "Content-Type",  value: "application/manifest+json" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control",  value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  // Optimisation des images Next.js
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 86400, // 24h
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    // Domaines autorisés pour les images externes (photos clients, témoignages, etc.)
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  // Compression automatique des réponses
  compress: true,

  // Headers de sécurité + cache
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Cache agressif pour les assets statiques
        source: "/(.*)\\.(.ico|png|svg|jpg|jpeg|webp|avif|woff|woff2|ttf|otf|eot)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache pour les pages HTML — revalidation courte
        source: "/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

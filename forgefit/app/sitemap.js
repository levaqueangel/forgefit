import { ARTICLES } from "./blog/articles";

const SITE_URL = "https://apxfitness-brown.vercel.app";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalider toutes les heures

// Pages statiques principales
const STATIC_PAGES = [
  { url: "/",              priority: "1.0",  changefreq: "weekly"  },
  { url: "/bilan",         priority: "0.9",  changefreq: "monthly" },
  { url: "/blog",          priority: "0.8",  changefreq: "weekly"  },
  { url: "/calculateur",   priority: "0.7",  changefreq: "monthly" },
  { url: "/faq",           priority: "0.6",  changefreq: "monthly" },
  { url: "/mentions-legales", priority: "0.3", changefreq: "yearly" },
];

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const staticUrls = STATIC_PAGES.map(p => `
  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("");

  const articleUrls = ARTICLES.map(a => `
  <url>
    <loc>${SITE_URL}/blog/${a.slug}</loc>
    <lastmod>${a.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${staticUrls}${articleUrls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

import { ARTICLES } from "./blog/articles";

const SITE_URL = "https://apxfitness-brown.vercel.app";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap() {
  const today = new Date().toISOString();

  const staticPages = [
    { url: SITE_URL,                       lastModified: today, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/bilan`,            lastModified: today, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/blog`,             lastModified: today, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${SITE_URL}/resultats`,        lastModified: today, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/calculateur`,      lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/faq`,             lastModified: today, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/a-propos`,         lastModified: today, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/mentions-legales`, lastModified: today, changeFrequency: "yearly",  priority: 0.3 },
  ];

  const articlePages = ARTICLES.map(a => ({
    url: `${SITE_URL}/blog/${a.slug}`,
    lastModified: a.date,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...articlePages];
}

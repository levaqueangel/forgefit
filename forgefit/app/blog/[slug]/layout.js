import { ARTICLES } from "../articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

export async function generateMetadata({ params }) {
  const article = ARTICLES.find(a => a.slug === params.slug);
  if (!article) return { title: "Article introuvable | APXFITNESS", robots: "noindex" };
  return {
    title: `${article.titre} | APXFITNESS`,
    description: article.description,
    keywords: `${article.categorie}, fitness, musculation, coaching, APXFITNESS`,
    authors: [{ name: "APXFITNESS Coach" }],
    openGraph: {
      title: article.titre,
      description: article.description,
      url: `${SITE_URL}/blog/${article.slug}`,
      siteName: "APXFITNESS",
      type: "article",
      publishedTime: article.date,
      authors: ["APXFITNESS Coach"],
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: article.titre,
      description: article.description,
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${article.slug}`,
    },
  };
}

export default function ArticleLayout({ children, params }) {
  const article = ARTICLES.find(a => a.slug === params.slug);
  const blogJsonLd = article ? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.titre,
    "description": article.description,
    "datePublished": article.date,
    "dateModified": article.date,
    "author": {
      "@type": "Person",
      "name": "APXFITNESS Coach",
      "url": `${SITE_URL}/a-propos`,
    },
    "publisher": {
      "@type": "Organization",
      "name": "APXFITNESS",
      "url": SITE_URL,
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${article.slug}`,
    },
    "url": `${SITE_URL}/blog/${article.slug}`,
    "inLanguage": "fr-FR",
    "articleSection": article.categorie,
    "timeRequired": `PT${article.lecture || 5}M`,
  } : null;

  return (
    <>
      {blogJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      )}
      {children}
    </>
  );
}

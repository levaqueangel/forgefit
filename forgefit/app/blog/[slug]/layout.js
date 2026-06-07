import { ARTICLES } from "../articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

// ── Pré-génération statique de toutes les pages articles ──────────────────────
// Sans generateStaticParams, chaque article est rendu dynamiquement à chaque requête.
// Avec, Next.js génère les pages au build → TTFB quasi nul, meilleur SEO.
export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

// ── Métadonnées dynamiques par article ────────────────────────────────────────
export async function generateMetadata({ params }) {
  const article = ARTICLES.find((a) => a.slug === params.slug);
  if (!article) {
    return { title: "Article introuvable | APXFITNESS", robots: { index: false } };
  }

  // Mots-clés : catégorie + titre décomposé + termes fitness généraux
  const titleWords = article.titre
    .toLowerCase()
    .replace(/[^a-zàâéèêëîïôùûüç\s]/g, "")
    .split(" ")
    .filter((w) => w.length > 3)
    .slice(0, 5);
  const keywords = [
    article.categorie.toLowerCase(),
    ...titleWords,
    "musculation",
    "coaching fitness",
    "APXFITNESS",
  ].join(", ");

  return {
    title: `${article.titre} | APXFITNESS`,
    description: article.description,
    keywords,
    authors: [{ name: "Angel Levaque", url: `${SITE_URL}/a-propos` }],
    openGraph: {
      title: article.titre,
      description: article.description,
      url: `${SITE_URL}/blog/${article.slug}`,
      siteName: "APXFITNESS",
      type: "article",
      publishedTime: article.date,
      modifiedTime: article.date,
      authors: ["Angel Levaque"],
      locale: "fr_FR",
      section: article.categorie,
      // Pas de images: [] ici — on laisse Next.js utiliser
      // l'opengraph-image.js dans ce répertoire (par article)
    },
    twitter: {
      card: "summary_large_image",
      title: article.titre,
      description: article.description,
      creator: "@apxfitness",
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${article.slug}`,
    },
  };
}

// ── JSON-LD BlogPosting (serveur) ─────────────────────────────────────────────
export default function ArticleLayout({ children, params }) {
  const article = ARTICLES.find((a) => a.slug === params.slug);

  const blogJsonLd = article
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: article.titre,
        description: article.description,
        datePublished: article.date,
        dateModified: article.date,
        author: {
          "@type": "Person",
          name: "Angel Levaque",
          url: `${SITE_URL}/a-propos`,
          jobTitle: "Coach Fitness Personnel",
        },
        publisher: {
          "@type": "Organization",
          name: "APXFITNESS",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/icon-192.png`,
            width: 192,
            height: 192,
          },
        },
        image: {
          "@type": "ImageObject",
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${SITE_URL}/blog/${article.slug}`,
        },
        url: `${SITE_URL}/blog/${article.slug}`,
        inLanguage: "fr-FR",
        articleSection: article.categorie,
        timeRequired: `PT${article.lecture || 5}M`,
        wordCount: Math.round(article.contenu.split(/\s+/).length),
        isPartOf: {
          "@type": "Blog",
          "@id": `${SITE_URL}/blog`,
          name: "Blog APXFITNESS — Musculation & Nutrition",
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
            { "@type": "ListItem", position: 3, name: article.titre, item: `${SITE_URL}/blog/${article.slug}` },
          ],
        },
      }
    : null;

  return (
    <>
      {blogJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
        />
      )}
      {children}
    </>
  );
}

import { ARTICLES } from "../articles";

const SITE_URL = "https://apxfitness-brown.vercel.app";

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

export default function ArticleLayout({ children }) {
  return children;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";
export const metadata = {
  title: "Angel Levaque — Coach Fitness Personnel | APXFITNESS",
  description: "Découvrez Angel Levaque, coach fitness certifié spécialisé musculation et nutrition sportive. +200 clients transformés depuis 2020.",
  openGraph: {
    title: "Angel Levaque — Coach Fitness Personnel | APXFITNESS",
    description: "Découvrez Angel Levaque, coach fitness certifié. +200 clients transformés.",
    url: SITE + "/a-propos", siteName: "APXFITNESS", locale: "fr_FR", type: "profile",
  },
  twitter: { card: "summary_large_image", title: "Angel Levaque — Coach Fitness | APXFITNESS", description: "Coach certifié, +200 clients transformés." },
  alternates: { canonical: SITE + "/a-propos" },
};
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Angel Levaque",
  "url": SITE + "/a-propos",
  "jobTitle": "Coach Fitness Personnel",
  "description": "Coach fitness certifié spécialisé en musculation et nutrition sportive. Plus de 200 clients accompagnés depuis 2020.",
  "worksFor": { "@type": "Organization", "name": "APXFITNESS", "url": SITE },
  "knowsAbout": ["Musculation", "Nutrition sportive", "Coaching en ligne", "Prise de masse", "Perte de poids"],
  "sameAs": [],
};

export default function Layout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      {children}
    </>
  );
}

const SITE = "https://apxfitness-brown.vercel.app";
export const metadata = {
  title: "Angel Levaque — Coach Fitness Personnel | APXFITNESS",
  description: "Découvrez Angel Levaque, coach fitness certifié spécialisé musculation et nutrition sportive. +200 clients transformés depuis 2020.",
  openGraph: {
    title: "Angel Levaque — Coach Fitness Personnel | APXFITNESS",
    description: "Découvrez Angel Levaque, coach fitness certifié. +200 clients transformés.",
    url: SITE + "/a-propos", siteName: "APXFITNESS", locale: "fr_FR", type: "profile",
    images: [{ url: SITE + "/og-default.jpg", width: 1200, height: 630, alt: "Angel Levaque — Coach Fitness" }],
  },
  twitter: { card: "summary_large_image", title: "Angel Levaque — Coach Fitness | APXFITNESS", description: "Coach certifié, +200 clients transformés." },
  alternates: { canonical: SITE + "/a-propos" },
};
export default function Layout({ children }) { return children; }

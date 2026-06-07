const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";
export const metadata = {
  title: "FAQ Coaching Fitness — Toutes Vos Questions | APXFITNESS",
  description: "Réponses complètes sur le coaching en ligne APXFITNESS : programmes, tarifs, nutrition, résultats, remboursement.",
  openGraph: {
    title: "FAQ Coaching Fitness — Toutes Vos Questions | APXFITNESS",
    description: "Réponses complètes sur le coaching en ligne : programmes, tarifs, nutrition, résultats.",
    url: SITE + "/faq", siteName: "APXFITNESS", locale: "fr_FR", type: "website",
  },
  twitter: { card: "summary_large_image", title: "FAQ Coaching Fitness | APXFITNESS", description: "Toutes les réponses sur nos programmes." },
  alternates: { canonical: SITE + "/faq" },
};
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Comment est créé mon programme ?", "acceptedAnswer": { "@type": "Answer", "text": "Ton programme est entièrement créé sur mesure à partir de ton bilan : niveau, objectifs, équipement, alimentation et contraintes physiques. Chaque programme est unique." } },
    { "@type": "Question", "name": "Dans quel délai je reçois mon programme ?", "acceptedAnswer": { "@type": "Answer", "text": "Ton programme est livré par email sous 48 heures ouvrées après validation de ton bilan. Il est aussi accessible depuis ton espace client." } },
    { "@type": "Question", "name": "Le programme est-il adapté si je m'entraîne à la maison ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, le programme est entièrement adapté à ton lieu d'entraînement : salle, maison avec ou sans matériel, extérieur." } },
    { "@type": "Question", "name": "Je suis débutant, est-ce que ça convient ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, nos programmes sont conçus pour tous les niveaux. Le plan Starter est recommandé pour les débutants." } },
    { "@type": "Question", "name": "Quels sont les tarifs ?", "acceptedAnswer": { "@type": "Answer", "text": "Trois plans : Starter à 49€, Forge à 129€ et Elite à 249€. Chaque plan inclut un programme musculation et nutrition personnalisé." } },
    { "@type": "Question", "name": "Y a-t-il une garantie satisfait ou remboursé ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, nous offrons une garantie satisfait ou remboursé sous 14 jours si le programme ne te convient pas." } },
  ],
};

export default function Layout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  );
}

export const metadata = {
  title: "Calculateur IMC & Calories (TDEE) — APXFITNESS",
  description: "Calculez votre IMC et vos besoins caloriques journaliers (TDEE) gratuitement. Obtenez vos macros personnalisées selon votre objectif fitness.",
  keywords: "calculateur IMC, TDEE calories, calcul besoins caloriques, macros nutrition, fitness",
  alternates: { canonical: "https://apxfitness-brown.vercel.app/calculateur" },
  openGraph: {
    title: "Calculateur IMC & Calories — APXFITNESS",
    description: "Calculez votre IMC et vos besoins caloriques gratuitement.",
    url: "https://apxfitness-brown.vercel.app/calculateur",
    type: "website",
  },
};

export default function CalculateurLayout({ children }) {
  return children;
}

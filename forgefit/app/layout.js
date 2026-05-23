import "./globals.css";

export const metadata = {
  title: "ForgeFit — Coaching personnalisé",
  description: "Programmes de musculation et remise en forme sur mesure",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

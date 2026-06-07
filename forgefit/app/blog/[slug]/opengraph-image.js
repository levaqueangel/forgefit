import { ImageResponse } from "next/og";
import { ARTICLES } from "../articles";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage({ params }) {
  const article = ARTICLES.find((a) => a.slug === params.slug);
  const titre = article?.titre || "APXFITNESS — Blog Fitness";
  const categorie = article?.categorie || "Musculation";
  const lecture = article?.lecture ? `${article.lecture} min de lecture` : "";

  // Couleur selon catégorie
  const catColors = {
    Nutrition:     "#7AE07A",
    Musculation:   "#C9A84C",
    Récupération:  "#5DCAA5",
    Programme:     "#E8C87A",
  };
  const accentColor = catColors[categorie] || "#C9A84C";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0A0A0A",
        fontFamily: "sans-serif",
        position: "relative",
        padding: "60px 80px",
      }}
    >
      {/* Gradient de fond subtil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 900px 500px at 50% 60%, ${accentColor}18 0%, transparent 70%)`,
          display: "flex",
        }}
      />

      {/* Barre colorée en haut */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: accentColor,
          display: "flex",
        }}
      />

      {/* Logo */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 900,
          letterSpacing: 6,
          color: "#F0EDE8",
          marginBottom: 32,
          display: "flex",
        }}
      >
        APXFIT
        <span style={{ color: accentColor }}>NESS</span>
      </div>

      {/* Badge catégorie */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}60`,
            color: accentColor,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            padding: "6px 16px",
            display: "flex",
          }}
        >
          {categorie}
        </div>
        {lecture && (
          <div
            style={{
              color: "#555",
              fontSize: 13,
              letterSpacing: 1,
              display: "flex",
            }}
          >
            · {lecture}
          </div>
        )}
      </div>

      {/* Titre de l'article */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: titre.length > 60 ? 38 : titre.length > 40 ? 46 : 54,
            fontWeight: 800,
            color: "#F0EDE8",
            lineHeight: 1.2,
            maxWidth: 900,
            display: "flex",
          }}
        >
          {titre}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 32,
          paddingTop: 20,
          borderTop: "0.5px solid #1A1A1A",
        }}
      >
        <div style={{ fontSize: 14, color: "#555", letterSpacing: 2, display: "flex" }}>
          apxfitness.fr
        </div>
        <div
          style={{
            fontSize: 13,
            color: accentColor,
            letterSpacing: 2,
            display: "flex",
          }}
        >
          Par Angel Levaque, Coach Personnel
        </div>
      </div>
    </div>,
    { ...size }
  );
}

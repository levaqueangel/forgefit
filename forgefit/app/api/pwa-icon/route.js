import { ImageResponse } from "next/og";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const size = parseInt(searchParams.get("size") || "192", 10);
  const validSizes = [192, 512];
  const sz = validSizes.includes(size) ? size : 192;

  const fontSize = sz === 512 ? 180 : 68;
  const subFontSize = sz === 512 ? 72 : 26;
  const gap = sz === 512 ? 8 : 3;

  return new ImageResponse(
    (
      <div
        style={{
          width: sz,
          height: sz,
          background: "#0A0A0A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap,
        }}
      >
        {/* Ligne dorée en haut */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: sz === 512 ? 6 : 3,
          background: "#C9A84C",
        }} />
        {/* Texte APX */}
        <div style={{
          fontSize,
          fontWeight: 900,
          color: "#F0EDE8",
          letterSpacing: sz === 512 ? "-8px" : "-3px",
          lineHeight: 1,
          fontFamily: "sans-serif",
        }}>
          APX
        </div>
        {/* Sous-texte FITNESS */}
        <div style={{
          fontSize: subFontSize,
          fontWeight: 700,
          color: "#C9A84C",
          letterSpacing: sz === 512 ? "20px" : "8px",
          lineHeight: 1,
          fontFamily: "sans-serif",
        }}>
          FITNESS
        </div>
      </div>
    ),
    { width: sz, height: sz }
  );
}

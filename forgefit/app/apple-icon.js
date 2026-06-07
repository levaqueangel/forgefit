import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 180, height: 180 };

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0A0A",
        borderRadius: "38px",
      }}
    >
      {/* Lettre A stylisée en or */}
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          color: "#C9A84C",
          fontFamily: "sans-serif",
          letterSpacing: -4,
          display: "flex",
        }}
      >
        A
      </div>
    </div>,
    { ...size }
  );
}

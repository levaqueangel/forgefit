import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#0A0A0A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 900,
            color: "#E8B000",
            letterSpacing: "-1px",
            fontFamily: "sans-serif",
          }}
        >
          APX
        </div>
      </div>
    ),
    { ...size }
  );
}

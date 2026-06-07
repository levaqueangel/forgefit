import { ImageResponse } from "next/og";

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
            color: "#C9A84C",
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

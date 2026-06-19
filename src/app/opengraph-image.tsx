import { ImageResponse } from "next/og";

export const alt = "Player One IQ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f12 0%, #1a1a24 50%, #0f0f12 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 32,
          }}
        >
          P1
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1 }}>
          Player One IQ
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 28,
            color: "#a1a1aa",
            maxWidth: 720,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Creator and sponsor management for gaming agencies
        </div>
      </div>
    ),
    { ...size }
  );
}

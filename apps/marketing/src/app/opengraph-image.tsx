import { ImageResponse } from "next/og";

export const alt = "Monetura: Find your way back.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Edge: @vercel/og on the Node runtime fails to prerender on Windows builds.
export const runtime = "edge";

// Brand share image: Warm Charcoal background, Champagne headline,
// Desert Cream wordmark. Never pure white.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#2C2420",
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 18,
            color: "#FBF5ED",
            textTransform: "uppercase",
            marginBottom: 48,
          }}
        >
          Monetura
        </div>
        <div style={{ width: 120, height: 2, backgroundColor: "#D4A853", marginBottom: 48 }} />
        <div style={{ fontSize: 84, color: "#D4A853", letterSpacing: 1 }}>
          Find your way back.
        </div>
      </div>
    ),
    size,
  );
}

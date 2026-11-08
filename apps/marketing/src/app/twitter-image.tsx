import OpengraphImage from "./opengraph-image";

export const alt = "Monetura: Find your way back.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Edge: @vercel/og on the Node runtime fails to prerender on Windows builds.
export const runtime = "edge";

export default function TwitterImage() {
  return OpengraphImage();
}

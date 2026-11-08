import type { MetadataRoute } from "next";

const BASE = "https://www.monetura.com";

// Every public page. Post-submit confirmation pages (/success,
// /membership/apply/success) are noindex and deliberately left out.
const PATHS = ["/", "/story", "/how-it-works", "/membership", "/membership/apply"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PATHS.map((path) => ({
    url: `${BASE}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

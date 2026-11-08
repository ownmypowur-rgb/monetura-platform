import type { MetadataRoute } from "next";

const BASE = "https://www.monetura.com";

// Every public page. Left out on purpose (all noindex): the post-submit pages
// (/success, /membership/apply/success), /waitlist/unsubscribe, and
// /membership/apply (invited founders only).
const PATHS = ["/", "/waitlist", "/story", "/how-it-works", "/membership", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PATHS.map((path) => ({
    url: `${BASE}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

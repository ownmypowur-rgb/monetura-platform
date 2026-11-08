import type { Metadata } from "next";

// The apply page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Apply: Founders Club, Monetura",
  description:
    "Reserve your spot on the Monetura founders webinar. Founder terms are shared privately on the webinar. Be the first to know.",
  alternates: { canonical: "/membership/apply" },
  // Invited founders only: reachable by direct link, never indexed or linked.
  robots: { index: false, follow: false },
};

export default function ApplyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

import { Cormorant_Garamond } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

// TODO: Replace with Garet font when files are available
// Cormorant Garamond maps to --font-heading as the premium serif fallback
const heading = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sign In — Monetura",
  description: "Access your Monetura member dashboard.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-CA">
      <body
        className={`${heading.variable} min-h-screen bg-[#2C2420]`}
        style={{ fontFamily: "var(--font-heading), Georgia, serif" }}
      >
        {children}
      </body>
    </html>
  );
}

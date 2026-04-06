// TODO: Replace with Garet font when files are available
// Cormorant Garamond (headings) and Inter (body) are temporary Google Fonts fallbacks
import { Cormorant_Garamond, Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// TODO: Replace with Garet font when files are available
const heading = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

// TODO: Replace with Garet font when files are available
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Monetura — Passion becomes creation. Creation becomes freedom.",
  description:
    "Canada's premier founder lifestyle platform. Limited to 200 founding members. Join the movement where passion becomes creation and creation becomes freedom.",
  keywords: [
    "Monetura",
    "founder",
    "lifestyle",
    "premium",
    "Canada",
    "community",
  ],
  openGraph: {
    title: "Monetura — Passion becomes creation. Creation becomes freedom.",
    description:
      "Canada's premier founder lifestyle platform. Limited to 200 founding members.",
    type: "website",
    locale: "en_CA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA">
      {/* TODO: Replace with Garet font when files are available — swap heading.variable + body.variable for a single Garet variable */}
      <body className={`${heading.variable} ${body.variable}`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

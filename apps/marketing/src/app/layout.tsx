import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Monetura — Passion becomes creation. Creation becomes freedom.",
  description:
    "A premium travel creator platform for founders who want to turn every trip into content, community, and income.",
  keywords: [
    "Monetura",
    "premium travel platform",
    "travel creators",
    "founders club",
    "luxury lifestyle",
    "Canada",
  ],
  openGraph: {
    title: "Monetura — Passion becomes creation. Creation becomes freedom.",
    description:
      "A premium travel creator platform for founders who want to turn every trip into content, community, and income.",
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
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

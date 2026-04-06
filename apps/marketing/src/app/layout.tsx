import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.monetura.com"),
  title: "Monetura: Find your way back",
  description:
    "A travel community for people who've spent years living for everyone else. Small trips, real friends, and your story, reclaimed. Be the first to know.",
  keywords: [
    "Monetura",
    "premium travel platform",
    "travel creators",
    "founders club",
    "luxury lifestyle",
    "Canada",
  ],
  openGraph: {
    title: "Monetura: Find your way back",
    description:
      "A travel community for people who've spent years living for everyone else. Small trips, real friends, and your story, reclaimed. Be the first to know.",
    type: "website",
    locale: "en_CA",
    siteName: "Monetura",
  },
  twitter: {
    card: "summary_large_image",
    title: "Monetura: Find your way back",
    description:
      "A travel community for people who've spent years living for everyone else. Small trips, real friends, and your story, reclaimed. Be the first to know.",
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

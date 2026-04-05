import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monetura — Passion becomes creation. Creation becomes freedom.",
  description:
    "The premium lifestyle platform where passion becomes creation and creation becomes freedom.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

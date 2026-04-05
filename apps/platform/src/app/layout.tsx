import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monetura Platform — app.monetura.com",
  description: "Your Monetura member dashboard.",
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

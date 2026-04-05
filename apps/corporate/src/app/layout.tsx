import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monetura Media — moneturamedia.com",
  description: "Monetura corporate media hub.",
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

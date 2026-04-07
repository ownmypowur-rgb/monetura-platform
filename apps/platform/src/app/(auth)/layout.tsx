import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign In — Monetura",
  description: "Access your Monetura member dashboard.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

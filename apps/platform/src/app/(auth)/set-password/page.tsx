import { Suspense } from "react";
import { PasswordForm } from "@/components/auth/PasswordForm";

export const metadata = {
  title: "Choose your password — Monetura",
};

export default function SetPasswordPage() {
  return (
    <Suspense>
      <PasswordForm mode="set" />
    </Suspense>
  );
}

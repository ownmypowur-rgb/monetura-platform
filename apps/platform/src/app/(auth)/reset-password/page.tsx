import { Suspense } from "react";
import { PasswordForm } from "@/components/auth/PasswordForm";

export const metadata = {
  title: "Choose a new password — Monetura",
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <PasswordForm mode="reset" />
    </Suspense>
  );
}

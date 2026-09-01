import { Suspense } from "react";
import { getActiveFounderCount } from "@monetura/db";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Real founder count for the social-proof panel; null degrades gracefully.
  const founderCount = await getActiveFounderCount().catch(() => null);

  return (
    <Suspense>
      <LoginForm founderCount={founderCount} />
    </Suspense>
  );
}

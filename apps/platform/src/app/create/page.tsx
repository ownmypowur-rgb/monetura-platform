import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRemainingCredits } from "@monetura/db";
import type { MemberTier } from "@/types/next-auth";
import { CreateWizard } from "./CreateWizard";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { memberId, memberTier } = session.user;
  const creditsRemaining = await getRemainingCredits(memberId, memberTier as MemberTier);

  return (
    <CreateWizard
      memberId={memberId}
      memberTier={memberTier as MemberTier}
      initialCredits={creditsRemaining}
    />
  );
}

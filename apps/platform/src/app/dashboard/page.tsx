import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { MemberTier } from "@/components/dashboard/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = {
    name: session.user.name ?? "Member",
    memberTier: session.user.memberTier as MemberTier,
    founderNumber: session.user.founderNumber,
  };

  return <DashboardShell user={user} />;
}

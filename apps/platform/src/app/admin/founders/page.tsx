import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb, moneturaMembers } from "@monetura/db";
import { eq, or } from "drizzle-orm";
import { FoundersClient } from "./FoundersClient";

export const dynamic = "force-dynamic";

export default async function AdminFoundersPage() {
  const session = await auth();
  if (!session?.user || session.user.memberTier !== "admin") {
    redirect("/dashboard");
  }

  const db = getDb();

  const allMembers = await db
    .select({
      id: moneturaMembers.id,
      name: moneturaMembers.name,
      email: moneturaMembers.email,
      phone: moneturaMembers.phone,
      province: moneturaMembers.province,
      country: moneturaMembers.country,
      tierInterest: moneturaMembers.tierInterest,
      heardAbout: moneturaMembers.heardAbout,
      status: moneturaMembers.status,
      membershipTier: moneturaMembers.membershipTier,
      founderNumber: moneturaMembers.founderNumber,
      createdAt: moneturaMembers.createdAt,
    })
    .from(moneturaMembers)
    .where(
      or(
        eq(moneturaMembers.status, "pending"),
        eq(moneturaMembers.status, "awaiting_payment"),
        eq(moneturaMembers.membershipTier, "founder")
      )
    );

  const pending = allMembers.filter((m) => m.status === "pending");
  const awaitingPayment = allMembers.filter((m) => m.status === "awaiting_payment");
  const active = allMembers.filter(
    (m) => m.status === "active" && m.membershipTier === "founder"
  );

  const stats = {
    total: allMembers.length,
    pending: pending.length,
    awaitingPayment: awaitingPayment.length,
    active: active.length,
  };

  return (
    <FoundersClient
      initialData={{ pending, awaitingPayment, active, stats }}
    />
  );
}

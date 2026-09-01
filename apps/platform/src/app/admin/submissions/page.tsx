import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import {
  getDb,
  moneturaMarketplaceSubmissions,
  moneturaMembers,
} from "@monetura/db";
import { SubmissionsClient } from "./SubmissionsClient";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const session = await auth();
  if (!session?.user || session.user.memberTier !== "admin") {
    redirect("/dashboard");
  }

  const rows = await getDb()
    .select({
      id: moneturaMarketplaceSubmissions.id,
      productName: moneturaMarketplaceSubmissions.productName,
      brand: moneturaMarketplaceSubmissions.brand,
      category: moneturaMarketplaceSubmissions.category,
      publicPrice: moneturaMarketplaceSubmissions.publicPrice,
      memberPrice: moneturaMarketplaceSubmissions.memberPrice,
      description: moneturaMarketplaceSubmissions.description,
      productUrl: moneturaMarketplaceSubmissions.productUrl,
      imageUrl: moneturaMarketplaceSubmissions.imageUrl,
      notes: moneturaMarketplaceSubmissions.notes,
      createdAt: moneturaMarketplaceSubmissions.createdAt,
      memberName: moneturaMembers.name,
      memberEmail: moneturaMembers.email,
    })
    .from(moneturaMarketplaceSubmissions)
    .leftJoin(
      moneturaMembers,
      eq(moneturaMarketplaceSubmissions.memberId, moneturaMembers.id)
    )
    .where(eq(moneturaMarketplaceSubmissions.status, "pending"))
    .orderBy(desc(moneturaMarketplaceSubmissions.id));

  return (
    <SubmissionsClient
      submissions={rows.map((r) => ({
        id: r.id,
        productName: r.productName,
        brand: r.brand,
        category: r.category,
        publicPrice: r.publicPrice ?? null,
        memberPrice: r.memberPrice ?? null,
        description: r.description ?? "",
        productUrl: r.productUrl ?? null,
        imageUrl: r.imageUrl ?? null,
        notes: r.notes ?? null,
        createdAt: r.createdAt.toISOString(),
        memberName: r.memberName ?? "Unknown member",
        memberEmail: r.memberEmail ?? "",
      }))}
    />
  );
}

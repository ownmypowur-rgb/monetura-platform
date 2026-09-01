import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import {
  getDb,
  moneturaMarketplaceSubmissions,
  moneturaMarketplaceProducts,
} from "@monetura/db";

export const dynamic = "force-dynamic";

const ParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "id must be numeric"),
});

const BodySchema = z.object({
  action: z.enum(["approve", "reject"]),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const session = await auth();
  if (!session?.user || session.user.memberTier !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsedParams = ParamsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid submission id" }, { status: 400 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const submissionId = parseInt(parsedParams.data.id, 10);
  const db = getDb();

  const submissions = await db
    .select()
    .from(moneturaMarketplaceSubmissions)
    .where(eq(moneturaMarketplaceSubmissions.id, submissionId))
    .limit(1);

  const submission = submissions[0];
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  if (submission.status !== "pending") {
    return NextResponse.json(
      { error: "Submission has already been reviewed" },
      { status: 400 }
    );
  }

  if (body.action === "reject") {
    await db
      .update(moneturaMarketplaceSubmissions)
      .set({ status: "rejected", reviewedAt: new Date() })
      .where(eq(moneturaMarketplaceSubmissions.id, submissionId));

    return NextResponse.json({ success: true, status: "rejected" });
  }

  // ── Approve: create an UNPUBLISHED product row for final admin polish ─────
  const publicPrice = Math.round(Number(submission.publicPrice ?? 0));
  const memberPrice = Math.round(Number(submission.memberPrice ?? 0));
  const savingsPercent =
    publicPrice > 0 && memberPrice > 0 && memberPrice < publicPrice
      ? Math.round(((publicPrice - memberPrice) / publicPrice) * 100)
      : 0;

  await db.insert(moneturaMarketplaceProducts).values({
    // Suffix with the submission id so the slug can never collide.
    slug: `${slugify(`${submission.brand}-${submission.productName}`)}-${submissionId}`,
    name: submission.productName,
    brand: submission.brand,
    category: submission.category,
    description: submission.description,
    longDescription: submission.description,
    publicPrice,
    memberPrice,
    savingsPercent,
    image: submission.imageUrl,
    images: submission.imageUrl ? [submission.imageUrl] : [],
    tags: [],
    checkoutType: "external",
    externalUrl: submission.productUrl,
    inStock: true,
    featured: false,
    submittedByMember: true,
    approvedAt: new Date(),
    isPublished: false,
  });

  await db
    .update(moneturaMarketplaceSubmissions)
    .set({ status: "approved", reviewedAt: new Date() })
    .where(eq(moneturaMarketplaceSubmissions.id, submissionId));

  return NextResponse.json({ success: true, status: "approved" });
}

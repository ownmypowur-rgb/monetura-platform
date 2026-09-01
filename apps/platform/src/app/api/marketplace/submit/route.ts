import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  getDb,
  moneturaMarketplaceSubmissions,
  checkRateLimit,
} from "@monetura/db";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  productName: z.string().min(2).max(500),
  brand: z.string().min(1).max(255),
  category: z.enum(["travel-gear", "swimwear-beach", "photography", "wellness"]),
  publicPrice: z.coerce.number().nonnegative().max(1000000),
  memberPrice: z.coerce.number().nonnegative().max(1000000),
  description: z.string().min(10).max(5000),
  productUrl: z.string().url().max(1000),
  imageUrl: z.string().url().max(1000).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
});

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = checkRateLimit(
    `marketplace-submit:${session.user.memberId}`,
    10,
    60 * 60 * 1000
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? err.errors[0]?.message ?? "Validation failed"
        : "Invalid request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await getDb().insert(moneturaMarketplaceSubmissions).values({
    memberId: session.user.memberId,
    productName: body.productName,
    brand: body.brand,
    category: body.category,
    publicPrice: body.publicPrice.toFixed(2),
    memberPrice: body.memberPrice.toFixed(2),
    description: body.description,
    productUrl: body.productUrl,
    imageUrl: body.imageUrl || null,
    notes: body.notes || null,
  });

  return NextResponse.json({ success: true });
}

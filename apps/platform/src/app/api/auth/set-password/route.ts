import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, consumePasswordToken } from "@monetura/db";
import { apexcrmUsers } from "@/lib/apexcrm-users";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  token: z.string().min(1, "Token is required").max(128),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const consumed = await consumePasswordToken(parsed.data.token);
  if (!consumed) {
    return NextResponse.json(
      { error: "This link has expired or already been used." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await getDb()
    .update(apexcrmUsers)
    .set({ passwordHash })
    .where(eq(apexcrmUsers.id, consumed.userId));

  return NextResponse.json({ success: true });
}

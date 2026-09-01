import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import {
  getDb,
  consumePasswordToken,
  checkRateLimit,
  getClientIp,
} from "@monetura/db";
import { apexcrmUsers } from "@/lib/apexcrm-users";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  token: z.string().min(1, "Token is required").max(128),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request): Promise<Response> {
  const rl = checkRateLimit(
    `set-password:${getClientIp(req)}`,
    10,
    15 * 60 * 1000
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

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

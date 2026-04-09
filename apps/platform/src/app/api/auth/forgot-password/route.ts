import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
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

  // TODO: send password reset email via Resend when reset flow is implemented
  console.log("[forgot-password] reset requested for:", parsed.data.email);

  return NextResponse.json({ success: true });
}

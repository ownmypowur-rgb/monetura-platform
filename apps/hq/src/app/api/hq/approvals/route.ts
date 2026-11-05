import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { hasOwnerSession } from "@/server/auth";
import { recordApproval } from "@/server/store";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  eventId: z.number().int().positive(),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  if (!(await hasOwnerSession())) {
    return NextResponse.json({ error: "Owner session required" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid approval" }, { status: 400 });
  }
  try {
    const result = await recordApproval({
      eventId: parsed.data.eventId,
      decision: parsed.data.decision,
      decidedBy: "owner",
      note: parsed.data.note ?? null,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[hq] approval failed", err);
    return NextResponse.json({ error: "Approval could not be recorded" }, { status: 503 });
  }
}

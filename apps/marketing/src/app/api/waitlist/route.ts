import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp, recordWaitlistSignup } from "@monetura/db";
import {
  WAITLIST_CONSENT_TEXT,
  WAITLIST_CONSENT_VERSION,
} from "@monetura/config/src/waitlist";
import { sendWaitlistConfirmation } from "@/lib/waitlist-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.slice(0, max) : null));

const schema = z.object({
  firstName: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(320),
  consent: z.literal(true),
  consentText: z.literal(WAITLIST_CONSENT_TEXT),
  consentPage: optional(500),
  utmSource: optional(100),
  utmMedium: optional(100),
  utmCampaign: optional(100),
  referrer: optional(500),
  // Honeypot: real people never fill this in.
  company: z.string().optional(),
});

function ipHash(ip: string): string | null {
  const salt = process.env["WAITLIST_IP_SALT"];
  if (!salt || ip === "unknown") return null;
  return createHash("sha256").update(`${ip}${salt}`).digest("hex");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // CASL: consent is only valid with the sender identified, so without the
  // mailing address the waitlist is closed and nothing is saved.
  const mailingAddress = process.env["MONETURA_MAILING_ADDRESS"];
  if (!mailingAddress) {
    return NextResponse.json({ error: "Waitlist not open yet" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(`waitlist:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }
  const d = parsed.data;
  if (d.company) return NextResponse.json({ ok: true });

  try {
    const { row, shouldSend } = await recordWaitlistSignup({
      firstName: d.firstName,
      email: d.email,
      consentText: WAITLIST_CONSENT_TEXT,
      consentVersion: WAITLIST_CONSENT_VERSION,
      consentPage: d.consentPage,
      ipHash: ipHash(ip),
      utmSource: d.utmSource,
      utmMedium: d.utmMedium,
      utmCampaign: d.utmCampaign,
      referrer: d.referrer,
    });
    if (shouldSend) await sendWaitlistConfirmation(row, mailingAddress);
  } catch (err) {
    console.error("[waitlist] signup failed:", err instanceof Error ? err.message : "unknown error");
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  // Same answer whether or not the address was already on the list.
  return NextResponse.json({ ok: true });
}

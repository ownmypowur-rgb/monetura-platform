import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { deductCredit, refundCredit, INSUFFICIENT_CREDITS } from "@monetura/db";
import { getMemberAttachment, getMemberTrip, parseId } from "@/lib/trips/server";
import { getTripObjectBytes, getTripS3 } from "@/lib/trips/s3";
import { TRIPS_MODEL, logAnthropicError, messageText } from "@/lib/trips/ai";
import { RECEIPT_READ_CREDIT_COST } from "@/lib/trips/constants";
import type { MemberTier } from "@/types/next-auth";

export const maxDuration = 60;

const bodySchema = z.object({ attachmentId: z.number().int().positive() });

// Claude accepts these image types; HEIC must be converted first (the capture
// flow converts to JPEG in the browser before upload).
const VISION_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type VisionType = (typeof VISION_TYPES)[number];
const MAX_VISION_BYTES = 5 * 1024 * 1024;

const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["readable", "vendorName", "date", "totalAmount", "currency", "description"],
  properties: {
    readable: { type: "boolean" },
    vendorName: nullableString,
    date: nullableString,
    totalAmount: nullableString,
    currency: nullableString,
    description: nullableString,
  },
};

const extractedSchema = z.object({
  readable: z.boolean(),
  vendorName: z.string().nullable(),
  date: z.string().nullable(),
  totalAmount: z.string().nullable(),
  currency: z.string().nullable(),
  description: z.string().nullable(),
});

const SYSTEM_PROMPT = `You read photos of receipts, invoices and handwritten vendor notes for a travel record-keeping tool. You transcribe; you do not interpret.

Return:
- readable: false if the image is not a receipt/bill/vendor note or is too blurry to read; true otherwise.
- vendorName: the business or vendor name exactly as printed. null if not shown.
- date: the transaction date as YYYY-MM-DD. Only convert when the printed date is unambiguous; if day and month could be swapped (e.g. 03/04/2026) and nothing on the receipt settles it, return null.
- totalAmount: the final total actually paid (after tax, including any tip written on the receipt), as a plain decimal string with a dot as the decimal separator and no currency symbol or thousands separators, e.g. "1250.00". null if no total is legible.
- currency: the ISO 4217 code, only when the receipt states it or shows a symbol/country that identifies it unambiguously (e.g. "€" → EUR, "¥" with a Japanese address → JPY). A bare "$" without an identifying address or country is ambiguous: return null.
- description: a short plain description of what was bought, taken from the line items (e.g. "Dinner for two — 2 mains, 1 wine"). null if nothing is legible.

Never guess or invent a value — a null the member fills in is better than a wrong value. Do not comment on tax treatment, deductibility, or business purpose.`;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId, memberTier } = session.user;
  const tripId = parseId((await params).id);
  if (!tripId || !(await getMemberTrip(memberId, tripId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const attachment = await getMemberAttachment(memberId, parsed.data.attachmentId);
  if (
    !attachment ||
    attachment.tripId !== tripId ||
    attachment.status !== "uploaded" ||
    (attachment.type !== "receipt_photo" && attachment.type !== "vendor_note_photo")
  ) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }
  if (!(VISION_TYPES as readonly string[]).includes(attachment.mimeType)) {
    return NextResponse.json(
      { error: "This photo format can't be read automatically — please enter the details yourself." },
      { status: 415 }
    );
  }

  const s3 = getTripS3();
  if (!s3) return NextResponse.json({ error: "Storage service not configured" }, { status: 500 });

  // Load the image before charging — a storage failure should cost nothing.
  let bytes: Uint8Array;
  try {
    bytes = await getTripObjectBytes(s3, attachment.s3Bucket, attachment.s3Key);
  } catch (err) {
    console.error("[trips/read-receipt] S3 read failed:", err);
    return NextResponse.json({ error: "Couldn't load the photo — please try again" }, { status: 502 });
  }
  if (bytes.byteLength > MAX_VISION_BYTES) {
    return NextResponse.json(
      { error: "This photo is too large to read automatically — please enter the details yourself." },
      { status: 413 }
    );
  }

  // ── Debit BEFORE the paid call; refund on every failure path ──────────────
  const referenceId = `trip-receipt-${attachment.id}-${Date.now()}`;
  let creditsRemaining: number;
  try {
    creditsRemaining = await deductCredit(
      memberId,
      memberTier as MemberTier,
      "AI receipt reading",
      referenceId,
      RECEIPT_READ_CREDIT_COST
    );
  } catch (err) {
    if (err instanceof Error && err.message === INSUFFICIENT_CREDITS) {
      return NextResponse.json(
        { error: "No AI credits remaining this month — enter the details yourself.", creditsRemaining: 0 },
        { status: 402 }
      );
    }
    console.error("[trips/read-receipt] Credit deduction failed:", err);
    return NextResponse.json({ error: "Receipt reading failed" }, { status: 500 });
  }
  const refund = (why: string): Promise<void> =>
    refundCredit(memberId, `Refund — ${why}`, referenceId, RECEIPT_READ_CREDIT_COST);
  const fail = async (why: string, message = "Couldn't read this receipt — please enter the details yourself.") => {
    await refund(why);
    return NextResponse.json({ error: message }, { status: 502 });
  };

  let message: Anthropic.Message;
  try {
    message = await new Anthropic().messages.create({
      model: TRIPS_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: attachment.mimeType as VisionType,
                data: Buffer.from(bytes).toString("base64"),
              },
            },
            { type: "text", text: "Read this receipt." },
          ],
        },
      ],
    });
  } catch (err) {
    logAnthropicError("trips/read-receipt", err);
    return fail("receipt reading request failed");
  }

  if (message.stop_reason === "refusal") {
    console.error("[trips/read-receipt] Model refused. content=", JSON.stringify(message.content));
    return fail("model declined the request");
  }

  let extracted: z.infer<typeof extractedSchema>;
  try {
    extracted = extractedSchema.parse(JSON.parse(messageText(message)));
  } catch (err) {
    console.error("[trips/read-receipt] Unreadable model output:", err, messageText(message));
    return fail("receipt output could not be read");
  }

  if (!extracted.readable) {
    return fail(
      "photo was not a readable receipt",
      "That photo doesn't look like a readable receipt. Retake it in good light, or enter the details yourself."
    );
  }

  // Keep only values that are well-formed; anything else becomes blank for the
  // member to fill. Nothing here is saved — the form requires confirmation.
  const date = extracted.date && /^\d{4}-\d{2}-\d{2}$/.test(extracted.date) ? extracted.date : null;
  const amount =
    extracted.totalAmount && /^\d{1,12}(\.\d{1,3})?$/.test(extracted.totalAmount.trim())
      ? extracted.totalAmount.trim()
      : null;
  const currency =
    extracted.currency && /^[A-Za-z]{3}$/.test(extracted.currency.trim())
      ? extracted.currency.trim().toUpperCase()
      : null;

  return NextResponse.json({
    success: true,
    creditsRemaining,
    fields: {
      vendorName: extracted.vendorName?.trim().slice(0, 255) || null,
      expenseDate: date,
      amount,
      currency,
      description: extracted.description?.trim().slice(0, 2000) || null,
    },
  });
}

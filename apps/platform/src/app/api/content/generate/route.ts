import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { getDb, moneturaContentPosts } from "@monetura/db";
import { getRemainingCredits, deductCredit } from "@monetura/db";
import type { MemberTier } from "@/types/next-auth";

const bodySchema = z.object({
  memberNotes: z.string().min(1).max(2000),
  experienceType: z.enum([
    "travel",
    "dining",
    "lifestyle",
    "fitness",
    "business",
    "event",
  ]),
  locationName: z.string().max(255).optional(),
  mediaUploadIds: z.array(z.number()).max(10).optional(),
});

/**
 * Strips a wrapping markdown code fence (```json ... ``` or ``` ... ```) from
 * model output. Models sometimes fence JSON despite being told not to, which
 * is the most common cause of JSON.parse failing on otherwise valid output.
 */
function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const match = /^```[a-zA-Z0-9_-]*\s*\n?([\s\S]*?)\n?\s*```$/.exec(trimmed);
  return match?.[1] !== undefined ? match[1].trim() : trimmed;
}

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId, memberTier } = session.user;

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // ── Credit check ──────────────────────────────────────────────────────────
  const remaining = await getRemainingCredits(memberId, memberTier as MemberTier);
  if (remaining <= 0) {
    return NextResponse.json(
      { error: "No AI credits remaining this month", creditsRemaining: 0 },
      { status: 402 }
    );
  }

  // ── Build prompt ─────────────────────────────────────────────────────────
  const location = body.locationName ? ` at ${body.locationName}` : "";
  const photoNote =
    body.mediaUploadIds && body.mediaUploadIds.length > 0
      ? `\nNote: The member has uploaded ${body.mediaUploadIds.length} photo${body.mediaUploadIds.length !== 1 ? "s" : ""} of this experience. Write content that explicitly references and encourages sharing these visuals.`
      : "";
  const prompt = `You are a world-class content strategist for Monetura, a premium lifestyle brand. Create compelling, authentic social media content for a member who just had a ${body.experienceType} experience${location}.

Member's notes about their experience:
${body.memberNotes}${photoNote}

Generate content optimized for each platform. Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "instagramCaption": "...",
  "instagramHashtags": ["hashtag1", "hashtag2", ...],
  "facebookCaption": "...",
  "linkedinCaption": "...",
  "tiktokCaption": "...",
  "blogTitle": "...",
  "blogBody": "...",
  "blogExcerpt": "...",
  "magazineTitle": "...",
  "magazineIntro": "..."
}

Guidelines:
- Instagram: 150-220 chars, engaging, lifestyle-focused, 15-20 relevant hashtags
- Facebook: 100-300 chars, conversational, community-building
- LinkedIn: 200-400 chars, professional but aspirational, 3-5 hashtags inline
- TikTok: 100-150 chars, energetic, trend-aware, 5-8 hashtags
- Blog title: SEO-friendly headline, under 60 chars
- Blog body: 300-500 words, first-person narrative, vivid detail, inspires readers
- Blog excerpt: 1-2 sentences, teaser for the full post
- Magazine title: Premium editorial-style headline
- Magazine intro: 100-150 words, polished editorial voice like a luxury lifestyle magazine`;

  // ── Anthropic call ────────────────────────────────────────────────────────
  const client = new Anthropic();
  let generated: {
    instagramCaption: string;
    instagramHashtags: string[];
    facebookCaption: string;
    linkedinCaption: string;
    tiktokCaption: string;
    blogTitle: string;
    blogBody: string;
    blogExcerpt: string;
    magazineTitle: string;
    magazineIntro: string;
  };

  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error(
        "[content/generate] Anthropic auth error (check ANTHROPIC_API_KEY):",
        err.status,
        err.message
      );
    } else if (err instanceof Anthropic.RateLimitError) {
      console.error("[content/generate] Anthropic rate limited:", err.status, err.message);
    } else if (err instanceof Anthropic.APIError) {
      console.error(
        "[content/generate] Anthropic API error:",
        err.status,
        err.name,
        err.message
      );
    } else {
      console.error("[content/generate] Anthropic call failed:", err);
    }
    return NextResponse.json(
      { error: "Content generation failed" },
      { status: 500 }
    );
  }

  if (message.stop_reason === "refusal") {
    console.error(
      "[content/generate] Model refused the request. stop_reason=refusal content=",
      JSON.stringify(message.content)
    );
    return NextResponse.json(
      { error: "Content generation failed" },
      { status: 500 }
    );
  }

  const rawText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  const text = stripCodeFences(rawText);

  try {
    generated = JSON.parse(text) as typeof generated;
  } catch (err) {
    console.error(
      "[content/generate] Failed to parse model output as JSON.",
      `stop_reason=${message.stop_reason}`,
      "error:",
      err instanceof Error ? err.message : err,
      "\nraw model output:\n",
      rawText
    );
    return NextResponse.json(
      { error: "Content generation failed" },
      { status: 500 }
    );
  }

  // ── Deduct credit ─────────────────────────────────────────────────────────
  const slug = `draft-${memberId}-${Date.now()}`;
  let creditsRemaining: number;
  try {
    creditsRemaining = await deductCredit(
      memberId,
      memberTier as MemberTier,
      `AI content generation: ${body.experienceType}${location}`,
      slug
    );
  } catch {
    return NextResponse.json(
      { error: "No AI credits remaining this month", creditsRemaining: 0 },
      { status: 402 }
    );
  }

  // ── Save draft to DB ──────────────────────────────────────────────────────
  const title = generated.blogTitle || `${body.experienceType} experience${location}`;
  await getDb()
    .insert(moneturaContentPosts)
    .values({
      authorId: memberId,
      title,
      slug,
      body: generated.blogBody,
      excerpt: generated.blogExcerpt,
      status: "draft",
      contentType: "article",
      instagramCaption: generated.instagramCaption,
      instagramHashtags: generated.instagramHashtags,
      facebookCaption: generated.facebookCaption,
      linkedinCaption: generated.linkedinCaption,
      tiktokCaption: generated.tiktokCaption,
      blogTitle: generated.blogTitle,
      blogBody: generated.blogBody,
      blogExcerpt: generated.blogExcerpt,
      magazineTitle: generated.magazineTitle,
      magazineIntro: generated.magazineIntro,
      aiCreditsUsed: 1,
    });

  return NextResponse.json({
    success: true,
    slug,
    content: generated,
    creditsRemaining,
  });
}

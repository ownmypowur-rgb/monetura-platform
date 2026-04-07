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
  const prompt = `You are a world-class content strategist for Monetura, a premium lifestyle brand. Create compelling, authentic social media content for a member who just had a ${body.experienceType} experience${location}.

Member's notes about their experience:
${body.memberNotes}

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

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : "";
    generated = JSON.parse(text) as typeof generated;
  } catch (err) {
    console.error("AI generation error:", err);
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

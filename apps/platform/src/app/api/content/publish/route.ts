import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import {
  getDb,
  moneturaContentPosts,
  publishBundlePost,
  type BundleSocialPlatform,
} from "@monetura/db";

const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
] as const;

const bodySchema = z.object({
  slug: z.string().min(1),
  platforms: z
    .array(
      z.enum(["instagram", "facebook", "linkedin", "tiktok", "blog", "magazine"])
    )
    .min(1),
  scheduleAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = getDb();

  // ── Verify post belongs to this member ────────────────────────────────────
  const posts = await db
    .select({
      id: moneturaContentPosts.id,
      authorId: moneturaContentPosts.authorId,
      title: moneturaContentPosts.title,
      instagramCaption: moneturaContentPosts.instagramCaption,
      instagramHashtags: moneturaContentPosts.instagramHashtags,
      facebookCaption: moneturaContentPosts.facebookCaption,
      linkedinCaption: moneturaContentPosts.linkedinCaption,
      tiktokCaption: moneturaContentPosts.tiktokCaption,
    })
    .from(moneturaContentPosts)
    .where(eq(moneturaContentPosts.slug, body.slug))
    .limit(1);

  const post = posts[0];
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.authorId !== session.user.memberId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const scheduleAt = body.scheduleAt ? new Date(body.scheduleAt) : null;

  // ── Build per-platform content for the requested SOCIAL platforms ─────────
  const content: Partial<Record<BundleSocialPlatform, string>> = {};
  for (const platform of SOCIAL_PLATFORMS) {
    if (!body.platforms.includes(platform)) continue;
    if (platform === "instagram") {
      const tags = ((post.instagramHashtags as string[] | null) ?? [])
        .map((t) => `#${t.replace(/^#/, "")}`)
        .join(" ");
      const text = [post.instagramCaption, tags].filter(Boolean).join("\n\n");
      if (text) content.instagram = text;
    } else {
      const caption =
        platform === "facebook"
          ? post.facebookCaption
          : platform === "linkedin"
            ? post.linkedinCaption
            : post.tiktokCaption;
      if (caption) content[platform] = caption;
    }
  }

  const hasSocial = Object.keys(content).length > 0;

  // Blog/magazine are published on Monetura itself — no external call needed.
  if (!hasSocial) {
    await db
      .update(moneturaContentPosts)
      .set({
        status: "published",
        publishedAt: scheduleAt ?? new Date(),
        publishError: null,
      })
      .where(eq(moneturaContentPosts.id, post.id));

    return NextResponse.json({ success: true, slug: body.slug });
  }

  // ── Social publish: publishing → published / failed ───────────────────────
  await db
    .update(moneturaContentPosts)
    .set({ status: "publishing", publishError: null })
    .where(eq(moneturaContentPosts.id, post.id));

  const result = await publishBundlePost({
    memberId: session.user.memberId,
    title: post.title,
    content,
    scheduleAt,
  });

  if (!result.ok) {
    console.error("[content/publish] bundle.social error:", result.error);
    await db
      .update(moneturaContentPosts)
      .set({ status: "failed", publishError: result.error })
      .where(eq(moneturaContentPosts.id, post.id));

    return NextResponse.json(
      {
        error:
          "Publishing failed — we're on it. Your post is safe and you can retry any time.",
      },
      { status: 502 }
    );
  }

  await db
    .update(moneturaContentPosts)
    .set({
      status: "published",
      publishedAt: scheduleAt ?? new Date(),
      publishError: null,
    })
    .where(eq(moneturaContentPosts.id, post.id));

  return NextResponse.json({ success: true, slug: body.slug });
}

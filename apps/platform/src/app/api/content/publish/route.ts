import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, moneturaContentPosts } from "@monetura/db";

const bodySchema = z.object({
  slug: z.string().min(1),
  platforms: z.array(
    z.enum(["instagram", "facebook", "linkedin", "tiktok", "blog", "magazine"])
  ).min(1),
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

  // ── Verify post belongs to this member ────────────────────────────────────
  const posts = await getDb()
    .select({
      id: moneturaContentPosts.id,
      authorId: moneturaContentPosts.authorId,
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

  // ── Update status to publishing ───────────────────────────────────────────
  await getDb()
    .update(moneturaContentPosts)
    .set({ status: "published" })
    .where(eq(moneturaContentPosts.slug, body.slug));

  // ── Fire n8n webhook (fire-and-forget) ────────────────────────────────────
  const n8nUrl = process.env["N8N_WEBHOOK_URL"];
  if (n8nUrl) {
    fetch(`${n8nUrl}/webhook/publish-content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post.id,
        slug: body.slug,
        platforms: body.platforms,
        scheduleAt: body.scheduleAt ?? null,
        memberId: session.user.memberId,
      }),
    }).catch((err: unknown) =>
      console.error("n8n publish webhook error:", err)
    );
  }

  return NextResponse.json({ success: true, slug: body.slug });
}

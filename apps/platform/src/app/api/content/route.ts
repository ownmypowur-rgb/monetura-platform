import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, lt, desc, count } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, moneturaContentPosts } from "@monetura/db";

const PAGE_SIZE = 20;

const querySchema = z.object({
  status: z.enum(["all", "draft", "published", "archived"]).default("all"),
  cursor: z.coerce.number().int().positive().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId } = session.user;
  const { searchParams } = new URL(request.url);

  let query: z.infer<typeof querySchema>;
  try {
    query = querySchema.parse({
      status: searchParams.get("status") ?? "all",
      cursor: searchParams.get("cursor") ?? undefined,
    });
  } catch {
    return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
  }

  // Build where conditions
  const baseConditions = [eq(moneturaContentPosts.authorId, memberId)] as ReturnType<typeof eq>[];

  if (query.status !== "all") {
    baseConditions.push(eq(moneturaContentPosts.status, query.status));
  }
  if (query.cursor) {
    baseConditions.push(lt(moneturaContentPosts.id, query.cursor));
  }

  try {
    const [rows, countRows] = await Promise.all([
      getDb()
        .select({
          id: moneturaContentPosts.id,
          title: moneturaContentPosts.title,
          slug: moneturaContentPosts.slug,
          status: moneturaContentPosts.status,
          contentType: moneturaContentPosts.contentType,
          instagramCaption: moneturaContentPosts.instagramCaption,
          facebookCaption: moneturaContentPosts.facebookCaption,
          linkedinCaption: moneturaContentPosts.linkedinCaption,
          tiktokCaption: moneturaContentPosts.tiktokCaption,
          blogTitle: moneturaContentPosts.blogTitle,
          magazineTitle: moneturaContentPosts.magazineTitle,
          aiCreditsUsed: moneturaContentPosts.aiCreditsUsed,
          publishedAt: moneturaContentPosts.publishedAt,
          createdAt: moneturaContentPosts.createdAt,
        })
        .from(moneturaContentPosts)
        .where(and(...baseConditions))
        .orderBy(desc(moneturaContentPosts.id))
        .limit(PAGE_SIZE + 1),
      getDb()
        .select({ total: count() })
        .from(moneturaContentPosts)
        .where(
          query.status === "all"
            ? eq(moneturaContentPosts.authorId, memberId)
            : and(
                eq(moneturaContentPosts.authorId, memberId),
                eq(moneturaContentPosts.status, query.status)
              )
        ),
    ]);

    const hasMore = rows.length > PAGE_SIZE;
    const posts = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = hasMore ? (posts[posts.length - 1]?.id ?? null) : null;
    const total = Number(countRows[0]?.total ?? 0);

    const serialised = posts.map((p) => ({
      ...p,
      captionPreview: (p.instagramCaption ?? "").slice(0, 100),
      platforms: [
        p.instagramCaption ? "instagram" : null,
        p.facebookCaption ? "facebook" : null,
        p.linkedinCaption ? "linkedin" : null,
        p.tiktokCaption ? "tiktok" : null,
        p.blogTitle ? "blog" : null,
        p.magazineTitle ? "magazine" : null,
      ].filter(Boolean),
      createdAt: p.createdAt.toISOString(),
      publishedAt: p.publishedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({ posts: serialised, nextCursor, total });
  } catch (err) {
    console.error("[GET /api/content] error:", err);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

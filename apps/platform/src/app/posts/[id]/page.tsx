import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb, moneturaContentPosts } from "@monetura/db";
import { eq, and } from "drizzle-orm";
import { PostDetail } from "./PostDetail";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const { memberId } = session.user;

  const rows = await getDb()
    .select()
    .from(moneturaContentPosts)
    .where(
      and(
        eq(moneturaContentPosts.id, id),
        eq(moneturaContentPosts.authorId, memberId)
      )
    )
    .limit(1);

  const post = rows[0];
  if (!post) notFound();

  return (
    <PostDetail
      post={{
        id: post.id,
        title: post.title,
        status: post.status,
        contentType: post.contentType,
        aiCreditsUsed: post.aiCreditsUsed,
        createdAt: post.createdAt.toISOString(),
        publishedAt: post.publishedAt?.toISOString() ?? null,
        instagramCaption: post.instagramCaption ?? null,
        instagramHashtags: (post.instagramHashtags as string[] | null) ?? null,
        facebookCaption: post.facebookCaption ?? null,
        linkedinCaption: post.linkedinCaption ?? null,
        tiktokCaption: post.tiktokCaption ?? null,
        blogTitle: post.blogTitle ?? null,
        blogBody: post.blogBody ?? null,
        blogExcerpt: post.blogExcerpt ?? null,
        magazineTitle: post.magazineTitle ?? null,
        magazineIntro: post.magazineIntro ?? null,
      }}
    />
  );
}

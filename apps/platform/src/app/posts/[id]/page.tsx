import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getDb,
  moneturaContentPosts,
  moneturaMediaUploads,
  moneturaPostMedia,
} from "@monetura/db";
import { eq, and, asc } from "drizzle-orm";
import { PostDetail, type PostMediaItem } from "./PostDetail";

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

  const mediaRows = await getDb()
    .select({
      id: moneturaPostMedia.id,
      url: moneturaMediaUploads.publicUrl,
      fileName: moneturaMediaUploads.fileName,
    })
    .from(moneturaPostMedia)
    .innerJoin(
      moneturaMediaUploads,
      eq(moneturaPostMedia.mediaUploadId, moneturaMediaUploads.id)
    )
    .where(eq(moneturaPostMedia.postId, post.id))
    .orderBy(asc(moneturaPostMedia.sortOrder), asc(moneturaPostMedia.id));

  const media: PostMediaItem[] = mediaRows.flatMap((row) =>
    row.url ? [{ id: row.id, url: row.url, fileName: row.fileName }] : []
  );

  return (
    <PostDetail
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        coverImageUrl: post.coverImageUrl ?? null,
        media,
        publishError: post.publishError ?? null,
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

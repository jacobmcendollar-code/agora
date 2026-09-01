import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { timeAgo } from "@/lib/utils";
import { CommentForm } from "@/components/comment-form";
import { VoteButtons } from "@/components/vote-buttons";
import { Comment } from "@/components/comment";
import { CommentSortTabs } from "@/components/comment-sort-tabs";
import { RemovePostButton } from "@/components/remove-post-button";
import {
  PostEditProvider,
  EditablePostContent,
  EditPostButton,
} from "@/components/edit-post-button";
import { DeletePostButton } from "@/components/delete-post-button";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { ImageLightbox } from "@/components/image-lightbox";
import { LinkPreviewCard } from "@/components/link-preview-card";
import { XEmbed } from "@/components/x-embed";
import { TikTokEmbed } from "@/components/tiktok-embed";
import { RedditEmbed } from "@/components/reddit-embed";
import { InstagramEmbed } from "@/components/instagram-embed";
import { MarkdownBody } from "@/components/markdown-body";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ name: string; postId: string }>;
  searchParams: Promise<{ sort?: string }>;
};

function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/");
      const idx = parts.findIndex((p) => p === "embed" || p === "shorts");
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch {
    return null;
  }
  return null;
}

function isXLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("x.com") || url.includes("twitter.com");
}

function isTikTokLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("tiktok.com");
}

function isRedditLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("reddit.com");
}

function isInstagramLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("instagram.com") || url.includes("instagr.am");
}

function isGenericBody(body: string | null | undefined): boolean {
  if (!body) return true;
  const lower = body.toLowerCase();
  return (
    lower.includes("enjoy the videos and music you love") ||
    lower.includes("upload original content, and share it all")
  );
}

function decodeBasicEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

function buildCommentTree(comments: any[], sort: "best" | "newest") {
  const map = new Map<string, any>();
  const roots: any[] = [];

  comments.forEach((c) => {
    map.set(c.id, { ...c, replies: [] });
  });

  comments.forEach((c) => {
    const node = map.get(c.id);
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId).replies.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortFn =
    sort === "newest"
      ? (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : (a: any, b: any) => {
          if (b.score !== a.score) return b.score - a.score;
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        };

  roots.sort(sortFn);
  map.forEach((node) => {
    node.replies.sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  });

  return roots;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name, postId } = await params;
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      community: { select: { name: true, title: true } },
      author: { select: { username: true } },
    },
  });

  if (!post || post.community.name !== name) {
    return { title: "Post not found · Agora" };
  }

  const title = `${post.title} · ${post.community.title}`;
  const rawDescription =
    post.body && !isGenericBody(post.body) ? post.body : null;
  const description =
    rawDescription?.slice(0, 160) ||
    `A post in ${post.community.title} on Agora`;
  const url = `https://agor4.com/c/${post.community.name}/posts/${post.id}`;

  return {
    title,
    description,
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: "Agora",
      type: "article",
      images: post.thumbnail
        ? [{ url: post.thumbnail, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: post.thumbnail ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.thumbnail ? [post.thumbnail] : undefined,
    },
  };
}

export default async function PostPage({ params, searchParams }: Props) {
  const { name, postId } = await params;
  const sp = await searchParams;
  const sort: "best" | "newest" = sp.sort === "newest" ? "newest" : "best";

  const session = await auth();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { username: true } },
      community: { select: { name: true, title: true } },
    },
  });

  if (!post || post.community.name !== name) notFound();
  if (post.moderationStatus === "removed") notFound();

  const isSoftDeleted = post.moderationStatus === "author_deleted";

  let mutedIds: string[] = [];
  if (session?.user?.id) {
    const mutes = await prisma.mute.findMany({
      where: { muterId: session.user.id },
      select: { mutedId: true },
    });
    mutedIds = mutes.map((m) => m.mutedId);
  }

  const allComments = await prisma.comment.findMany({
    where: {
      postId: post.id,
      moderationStatus: { in: ["approved", "author_deleted"] },
      ...(mutedIds.length ? { authorId: { notIn: mutedIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { username: true } },
    },
  });

  const commentTree = buildCommentTree(allComments, sort);
  const showAdmin = isAdmin(session?.user?.username);
  const youtubeId = getYouTubeId(post.url);
  const isX = isXLink(post.url);
  const isTikTok = isTikTokLink(post.url);
  const isReddit = isRedditLink(post.url);
  const isInstagram = isInstagramLink(post.url);
  const hasRichEmbed = !!(
    youtubeId ||
    isX ||
    isTikTok ||
    isReddit ||
    isInstagram
  );
  const isAuthor = session?.user?.id === post.authorId;
  const sharePath = `/c/${post.community.name}/posts/${post.id}`;
  const isPlainLink = !!(post.url && !hasRichEmbed);
  const showBody = !!(post.body && !isGenericBody(post.body));
  const bodyText = showBody ? decodeBasicEntities(post.body!) : null;

  return (
    <div className="space-y-6">
      <article className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
        <div className="flex gap-4">
          <VoteButtons
            targetType="post"
            targetId={post.id}
            initialScore={post.score}
          />
          <div className="min-w-0 flex-1">
            <PostEditProvider
              postId={post.id}
              initialTitle={post.title}
              initialBody={
                post.body ? decodeBasicEntities(post.body) : null
              }
              createdAt={post.createdAt.toISOString()}
              canEdit={isAuthor && !isSoftDeleted}
              canEditBody={!post.url && !post.thumbnail}
            >
              <EditablePostContent>
                {youtubeId ? (
                  <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={post.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                ) : null}

                {isX && post.url && <XEmbed url={post.url} />}
                {isTikTok && post.url && <TikTokEmbed url={post.url} />}
                {isReddit && post.url && <RedditEmbed url={post.url} />}
                {isInstagram && post.url && <InstagramEmbed url={post.url} />}

                {isPlainLink && post.url && (
                  <div className="mt-4">
                    <LinkPreviewCard
                      url={post.url}
                      title={post.title}
                      thumbnail={post.thumbnail}
                      showDescription={!showBody}
                    />
                  </div>
                )}

                {!isPlainLink && post.thumbnail && !hasRichEmbed && (
                  <div className="mt-4">
                    <ImageLightbox src={post.thumbnail} alt={post.title} />
                  </div>
                )}

                {bodyText && (post.url || post.thumbnail) ? (
                  <div className="mt-4 text-zinc-800 dark:text-zinc-200">
                    <MarkdownBody text={bodyText} className="text-base" />
                  </div>
                ) : null}
              </EditablePostContent>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs text-zinc-500">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link
                    href={`/c/${post.community.name}`}
                    className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                  >
                    {post.community.title}
                  </Link>
                  <SaveButton postId={post.id} />
                  <ShareButton url={sharePath} title={post.title} />
                  {isSoftDeleted ? (
                    <span className="font-medium text-zinc-400">[deleted]</span>
                  ) : (
                    <Link
                      href={`/u/${post.author.username}`}
                      className="font-medium text-emerald-500 hover:underline"
                    >
                      {post.author.username}
                    </Link>
                  )}
                  <time>{timeAgo(post.createdAt)}</time>
                  {isAuthor && !isSoftDeleted && (
                    <>
                      <EditPostButton />
                      <DeletePostButton
                        postId={post.id}
                        communityName={post.community.name}
                        createdAt={post.createdAt.toISOString()}
                      />
                    </>
                  )}
                </div>
                {showAdmin && !isSoftDeleted && (
                  <div className="ml-auto">
                    <RemovePostButton postId={post.id} />
                  </div>
                )}
              </div>
            </PostEditProvider>
          </div>
        </div>
      </article>

      <section id="comments">
        {!isSoftDeleted && (
          <div className="mb-8">
            <CommentForm
              postId={post.id}
              communityName={post.community.name}
            />
          </div>
        )}

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <div className="mb-5">
            <CommentSortTabs
              basePath={sharePath}
              sort={sort}
              commentCount={post.commentCount}
            />
          </div>
          <div className="space-y-4">
            {commentTree.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                postId={post.id}
                communityName={post.community.name}
                isAdminUser={showAdmin}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
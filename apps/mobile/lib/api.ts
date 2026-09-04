import { API_URL } from "./config";
import { cookieHeader, loadCookies } from "./cookies";
import type {
  CommentNode,
  Community,
  FeedPost,
  FeedResponse,
  PostDetailResponse,
} from "./types";

export { API_URL };

const postCache = new Map<string, FeedPost>();

export function cachePost(post: FeedPost) {
  postCache.set(post.id, post);
}

export function peekCachedPost(id: string): FeedPost | undefined {
  return postCache.get(id);
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  await loadCookies();
  const headers = new Headers(init.headers);
  const cookies = cookieHeader();
  if (cookies) headers.set("Cookie", cookies);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!headers.has("Origin")) headers.set("Origin", API_URL);
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    (err as Error & { status?: number; data?: unknown }).status = res.status;
    (err as Error & { status?: number; data?: unknown }).data = data;
    throw err;
  }
  return data;
}

export function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function normalizePost(post: FeedPost): FeedPost {
  return {
    ...post,
    thumbnail: post.thumbnail ? decodeHtml(post.thumbnail) : post.thumbnail,
    url: post.url ? decodeHtml(post.url) : post.url,
    body: post.body ? decodeHtml(post.body) : post.body,
  };
}

export async function fetchFeed(opts: {
  sort?: string;
  page?: number;
  scope?: string;
  community?: string;
}): Promise<FeedResponse> {
  const params = new URLSearchParams({
    sort: opts.sort || "trending",
    page: String(opts.page || 1),
    scope: opts.scope || "all",
  });
  if (opts.community) params.set("community", opts.community);
  const data = await apiJson<FeedResponse>(`/api/feed?${params.toString()}`);
  const posts = (data.posts || []).map((p) => {
    const normalized = normalizePost(p);
    cachePost(normalized);
    return normalized;
  });
  return { posts, nextPage: data.nextPage ?? null };
}

export async function fetchCommunities(): Promise<Community[]> {
  const data = await apiJson<Community[] | { error?: string }>("/api/communities");
  if (!Array.isArray(data)) return [];
  return data;
}

export async function resolveCommunityId(
  community: Community,
  posts?: FeedPost[]
): Promise<string | null> {
  if (community.id) return community.id;
  const fromPost =
    posts?.find((p) => p.community?.name === community.name)?.communityId ||
    posts?.find((p) => p.community?.name === community.name)?.community?.id;
  if (fromPost) return fromPost;
  const feed = await fetchFeed({ community: community.name, page: 1, sort: "recent" });
  return feed.posts[0]?.communityId || feed.posts[0]?.community?.id || null;
}

export async function fetchPostDetail(id: string): Promise<PostDetailResponse> {
  const data = await apiJson<PostDetailResponse>(`/api/posts/${id}`);
  const post = normalizePost(data.post);
  cachePost(post);
  return { post, comments: data.comments || [] };
}

export async function vote(targetType: "post" | "comment", targetId: string, value: 1 | -1 | 0) {
  return apiJson<{ score: number }>("/api/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetType, targetId, value }),
  });
}

export async function fetchMyVote(targetType: "post" | "comment", targetId: string) {
  const data = await apiJson<{ value: number }>(
    `/api/vote/me?targetType=${targetType}&targetId=${targetId}`
  );
  return data.value === 1 || data.value === -1 ? data.value : 0;
}

export async function subscribe(communityId: string, action: "join" | "leave") {
  return apiJson<{ joined: boolean }>("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ communityId, action }),
  });
}

export async function createPost(payload: {
  communityName: string;
  title: string;
  body?: string | null;
  url?: string | null;
  imageUrl?: string | null;
}) {
  return apiJson<{ id: string; communityName: string; error?: string; existingPostId?: string }>(
    "/api/posts",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
}

export async function createComment(payload: {
  postId: string;
  body: string;
  parentId?: string | null;
}) {
  return apiJson<{ id: string }>("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function setShowNsfw(showNsfw: boolean) {
  return apiJson<{ showNsfw: boolean }>("/api/user/show-nsfw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ showNsfw }),
  });
}

export async function fetchSaved(postId: string) {
  const data = await apiJson<{ saved?: boolean }>(`/api/posts/${postId}/save`);
  return Boolean(data.saved);
}

export async function toggleSaved(postId: string) {
  return apiJson<{ saved: boolean }>(`/api/posts/${postId}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

export function postShareUrl(post: { id: string; community?: { name?: string } }) {
  const community = post.community?.name;
  if (community) return `${API_URL}/c/${community}/posts/${post.id}`;
  return `${API_URL}/post/${post.id}`;
}

export function postSnippet(body: string | null | undefined, max = 120) {
  if (!body) return null;
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

export type MutedUser = {
  userId: string;
  username: string;
  image?: string | null;
};

export async function muteUser(userId: string, action: "mute" | "unmute") {
  return apiJson<{ muted: boolean }>("/api/mute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, action }),
  });
}

export async function fetchMutes(): Promise<MutedUser[]> {
  const data = await apiJson<{ mutes?: MutedUser[] }>("/api/mute");
  return data.mutes || [];
}

export async function fetchLinkPreview(url: string) {
  return apiJson<{ title?: string; thumbnail?: string | null }>(
    `/api/link-preview?url=${encodeURIComponent(url)}`
  );
}

export async function uploadImage(file: {
  fileName: string;
  fileType: string;
  fileData: string;
}) {
  return apiJson<{ url: string }>("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(file),
  });
}

export function commentCount(post: FeedPost): number {
  return post._count?.comments ?? post.commentCount ?? 0;
}

export function buildCommentTree(comments: CommentNode[], sort: "best" | "newest"): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  comments.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  comments.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  });
  const byBest = (a: CommentNode, b: CommentNode) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  };
  const byNew = (a: CommentNode, b: CommentNode) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  const sortFn = sort === "newest" ? byNew : byBest;
  roots.sort(sortFn);
  map.forEach((node) => node.replies?.sort(byBest));
  return roots;
}

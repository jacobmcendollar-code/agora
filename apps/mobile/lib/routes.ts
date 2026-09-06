/** Map site paths (notification `link`, etc.) onto Expo routes. */

export function commentIdFromSiteLink(link: string): string | null {
  const raw = link.trim();
  if (!raw) return null;

  const hash = (raw.split("#")[1] || "").split("?")[0];
  const hashId =
    hash.match(/^comment-([^/?&#]+)$/i)?.[1] ||
    hash.match(/^comment[=/]([^/?&#]+)$/i)?.[1];
  if (hashId) return decodeURIComponent(hashId);

  const query = raw.split("#")[0].split("?")[1] || "";
  const params = new URLSearchParams(query);
  return params.get("comment") || params.get("commentId") || params.get("comment_id");
}

function withComment(path: string, commentId: string | null): string {
  if (!commentId || !/^\/post\/[^/]+$/.test(path)) return path;
  return `${path}?comment=${encodeURIComponent(commentId)}`;
}

export function mapSitePath(link: string): string {
  const raw = link.trim();
  if (!raw) return "/";
  const withoutOrigin = raw.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, "");
  const path = (withoutOrigin.split("#")[0] || "/").split("?")[0] || "/";
  const commentId = commentIdFromSiteLink(raw);

  const post = path.match(/^\/c\/[^/]+\/posts\/([^/]+)\/?$/);
  if (post) return withComment(`/post/${post[1]}`, commentId);

  const community = path.match(/^\/c\/([^/]+)\/?$/);
  if (community) return `/community/${community[1]}`;

  const user = path.match(/^\/u\/([^/]+)\/?$/);
  if (user) return `/u/${user[1]}`;

  if (path.startsWith("/post/") || path.startsWith("/community/") || path.startsWith("/u/")) {
    return withComment(path, commentId);
  }

  if (
    path === "/settings" ||
    path === "/about" ||
    path === "/login" ||
    path === "/register" ||
    path === "/submit" ||
    path === "/communities" ||
    path === "/search" ||
    path === "/account" ||
    path === "/edit-profile" ||
    path === "/notifications" ||
    path === "/"
  ) {
    return path;
  }

  return path.startsWith("/") ? path : `/${path}`;
}

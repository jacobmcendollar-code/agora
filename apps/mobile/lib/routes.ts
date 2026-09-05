/** Map site paths (notification `link`, etc.) onto Expo routes. */
export function mapSitePath(link: string): string {
  const raw = link.trim();
  if (!raw) return "/";
  const withoutOrigin = raw.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, "");
  const path = (withoutOrigin.split("#")[0] || "/").split("?")[0] || "/";

  const post = path.match(/^\/c\/[^/]+\/posts\/([^/]+)\/?$/);
  if (post) return `/post/${post[1]}`;

  const community = path.match(/^\/c\/([^/]+)\/?$/);
  if (community) return `/community/${community[1]}`;

  const user = path.match(/^\/u\/([^/]+)\/?$/);
  if (user) return `/u/${user[1]}`;

  if (path.startsWith("/post/") || path.startsWith("/community/") || path.startsWith("/u/")) {
    return path;
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

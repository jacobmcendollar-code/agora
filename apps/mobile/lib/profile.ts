import { apiFetch, decodeHtml } from "./api";

export type ProfilePost = {
  id: string;
  title: string;
  communityName: string;
  communityTitle: string;
};

export type PublicProfile = {
  username: string;
  id: string | null;
  image: string | null;
  bio: string | null;
  joined: string | null;
  posts: ProfilePost[];
};

function unescapeFlight(html: string) {
  return html
    .replace(/\\u0026/g, "&")
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n");
}

function extractJsonArray(source: string, key: string): unknown[] | null {
  const needle = `"${key}":[`;
  const start = source.indexOf(needle);
  if (start === -1) return null;
  let i = start + needle.length - 1;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === "\\") {
        esc = true;
        continue;
      }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(source.slice(start + needle.length - 1, i + 1)) as unknown[];
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function postsFromHtml(html: string): ProfilePost[] {
  const posts: ProfilePost[] = [];
  const seen = new Set<string>();
  const re = /href="\/c\/([^/"]+)\/posts\/([^"#]+)"[^>]*>([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const id = m[2];
    if (seen.has(id)) continue;
    seen.add(id);
    posts.push({
      id,
      title: decodeHtml(m[3]).trim(),
      communityName: m[1],
      communityTitle: m[1],
    });
  }
  return posts;
}

function postsFromFlight(raw: unknown[]): ProfilePost[] {
  const posts: ProfilePost[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const id = typeof rec.id === "string" ? rec.id : "";
    const title = typeof rec.title === "string" ? rec.title : "";
    const community = rec.community as { name?: string; title?: string } | undefined;
    if (!id || !title) continue;
    posts.push({
      id,
      title: decodeHtml(title),
      communityName: community?.name || "",
      communityTitle: community?.title || community?.name || "",
    });
  }
  return posts;
}

function extractUserId(flight: string, html: string, posts: unknown[] | null): string | null {
  const fromMute = flight.match(/"userId":"(cm[a-z0-9]+)"/);
  if (fromMute) return fromMute[1];
  if (posts) {
    for (const item of posts) {
      if (!item || typeof item !== "object") continue;
      const authorId = (item as { authorId?: unknown }).authorId;
      if (typeof authorId === "string" && authorId.startsWith("cm")) return authorId;
    }
  }
  const fromHtml = html.match(/userId["']?\s*[:=]\s*["'](cm[a-z0-9]+)["']/);
  return fromHtml?.[1] || null;
}

export function parsePublicProfile(html: string, fallbackUsername: string): PublicProfile | null {
  if (html.includes('id="__next_error__"') && !/<h1[^>]*>/.test(html)) return null;
  const nameMatch = html.match(/<h1[^>]*>([^<]+)/);
  const username = decodeHtml(nameMatch?.[1] || fallbackUsername).trim();
  if (!username) return null;

  const imgMatch =
    html.match(new RegExp(`<img src="([^"]+)" alt="${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`)) ||
    html.match(/<img src="([^"]+)" alt="[^"]*" class="[^"]*rounded-full/);
  const image = imgMatch ? decodeHtml(imgMatch[1]) : null;

  const joinedMatch = html.match(/Joined(?:<!-- -->\s*)?(?:<!-- -->\s*)?([^<]+)/);
  const joined = joinedMatch ? decodeHtml(joinedMatch[1]).trim() : null;

  const bioMatch = html.match(/whitespace-pre-wrap break-words[^>]*>([\s\S]*?)<\/p>/);
  const bio = bioMatch ? decodeHtml(bioMatch[1].replace(/<[^>]+>/g, "")).trim() : null;

  const flight = unescapeFlight(html);
  const flightPosts = extractJsonArray(flight, "posts");
  const posts = flightPosts ? postsFromFlight(flightPosts) : postsFromHtml(html);

  return {
    username,
    id: extractUserId(flight, html, flightPosts),
    image,
    bio: bio || null,
    joined: joined && !joined.startsWith("communities") ? joined : null,
    posts,
  };
}

export async function fetchPublicProfile(username: string): Promise<PublicProfile> {
  const name = username.trim().toLowerCase();
  const res = await apiFetch(`/u/${encodeURIComponent(name)}`, {
    headers: { Accept: "text/html" },
  });
  const html = await res.text();
  if (res.status === 404) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  const profile = parsePublicProfile(html, name);
  if (!profile) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  return profile;
}

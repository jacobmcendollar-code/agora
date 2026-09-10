/** Same URL matcher as web `linkify` — scheme required, trailing punct stripped. */
const BODY_URL_RE = /https?:\/\/[^\s<]+[^\s<.,;:"')\]}>]/g;

export type BodyLinkPart = { type: "text" | "url"; value: string };

export function splitBodyLinks(text: string): BodyLinkPart[] {
  const parts: BodyLinkPart[] = [];
  let last = 0;
  for (const match of text.matchAll(BODY_URL_RE)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ type: "text", value: text.slice(last, start) });
    parts.push({ type: "url", value: match[0] });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  if (parts.length === 0) parts.push({ type: "text", value: text });
  return parts;
}

/** Host + path (not domain-only, no scheme). Style C comment-body display. */
export function displayLinkPath(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "");
    const rest = `${parsed.pathname}${parsed.search}${parsed.hash}`.replace(/\/$/, "");
    return rest && rest !== "/" ? `${host}${rest}` : host;
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
  }
}

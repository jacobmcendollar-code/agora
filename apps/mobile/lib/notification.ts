import { commentIdFromSiteLink, mapSitePath } from "./routes";
import type { CommentNode, SiteNotification } from "./types";

export type ParsedNotification =
  | { kind: "comment"; username: string; title: string | null }
  | { kind: "reply"; username: string }
  | { kind: "mention"; username: string }
  | { kind: "other"; username: string | null; text: string };

const COMMENT_MSG =
  /^(\S+)\s+commented on your post\s+[“"']?([\s\S]+?)[”"']?\s*$/i;
const REPLY_MSG = /^(\S+)\s+replied to your comment\s*$/i;
const MENTION_MSG = /^(\S+)\s+mentioned you\s*$/i;

function firstToken(message: string): string | null {
  const token = message.trim().split(/\s+/, 1)[0];
  return token || null;
}

export function parseNotification(n: SiteNotification): ParsedNotification {
  const type = n.type.trim().toLowerCase();
  const message = n.message.trim();

  if (type === "reply_to_comment" || REPLY_MSG.test(message)) {
    const match = message.match(REPLY_MSG);
    return { kind: "reply", username: match?.[1] || firstToken(message) || "Someone" };
  }

  if (type === "comment_on_post" || /commented on your post/i.test(message)) {
    const match = message.match(COMMENT_MSG);
    const username = match?.[1] || firstToken(message) || "Someone";
    const title = match?.[2]?.trim() || null;
    return { kind: "comment", username, title };
  }

  if (type === "mention" || MENTION_MSG.test(message)) {
    const match = message.match(MENTION_MSG);
    return { kind: "mention", username: match?.[1] || firstToken(message) || "Someone" };
  }

  return { kind: "other", username: firstToken(message), text: message };
}

function commentIdFromPayload(n: SiteNotification): string | null {
  const fromField = n.commentId || n.comment_id;
  if (fromField) return fromField;
  return commentIdFromSiteLink(n.link);
}

export type NotificationPostHref = {
  pathname: "/post/[id]";
  params: {
    id: string;
    comment?: string;
    commentUser?: string;
    at?: string;
  };
};

export type NotificationHref = string | NotificationPostHref;

/**
 * Expo href for a notification.
 * Post targets use { pathname, params } so root-stack `post/[id]` receives
 * comment / commentUser / at. After Note 53 moved the screen out of (tabs),
 * string query hrefs (`/post/:id?comment=`) only delivered `id`.
 */
export function notificationHref(n: SiteNotification): NotificationHref {
  const mapped = mapSitePath(n.link);
  const commentId = commentIdFromPayload(n);
  const post = mapped.split("?")[0].match(/^\/post\/([^/]+)$/);
  if (!post) return mapped;

  const params: NotificationPostHref["params"] = { id: post[1] };
  const existing = mapped.split("?")[1];
  if (existing) {
    new URLSearchParams(existing).forEach((value, key) => {
      if (key === "comment" || key === "commentUser" || key === "at") {
        params[key] = value;
      }
    });
  }
  if (commentId) params.comment = commentId;

  const parsed = parseNotification(n);
  if (!params.comment && (parsed.kind === "comment" || parsed.kind === "reply" || parsed.kind === "mention")) {
    params.commentUser = parsed.username;
    if (n.createdAt) params.at = n.createdAt;
  }

  return { pathname: "/post/[id]", params };
}

export function flattenComments(comments: CommentNode[]): CommentNode[] {
  const out: CommentNode[] = [];
  const walk = (nodes: CommentNode[]) => {
    for (const node of nodes) {
      out.push(node);
      if (node.replies?.length) walk(node.replies);
    }
  };
  walk(comments);
  return out;
}

export function findNotificationComment(
  comments: CommentNode[],
  opts: { commentId?: string | null; commentUser?: string | null; at?: string | null }
): CommentNode | null {
  const flat = flattenComments(comments);
  if (opts.commentId) {
    return flat.find((c) => c.id === opts.commentId) || null;
  }
  if (!opts.commentUser) return null;
  const user = opts.commentUser.toLowerCase();
  const matches = flat.filter((c) => c.author.username.toLowerCase() === user);
  if (matches.length === 0) return null;
  if (matches.length === 1 || !opts.at) return matches[0];
  const t = new Date(opts.at).getTime();
  if (Number.isNaN(t)) return matches[0];
  return matches.reduce((best, c) => {
    const d = Math.abs(new Date(c.createdAt).getTime() - t);
    const bd = Math.abs(new Date(best.createdAt).getTime() - t);
    return d < bd ? c : best;
  });
}

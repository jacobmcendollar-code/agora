import type { SiteNotification } from "./types";

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

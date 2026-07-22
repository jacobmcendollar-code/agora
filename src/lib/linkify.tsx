import React from "react";
import Link from "next/link";

const URL_REGEX =
  /(https?:\/\/[^\s<]+[^\s<.,;:"')\]}>])/g;
const MENTION_REGEX = /(@[a-zA-Z0-9_]{2,30})/g;

export function linkify(text: string) {
  // First split by URLs
  const urlParts = text.split(URL_REGEX);

  return urlParts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
      return (
        <a
          key={`url-${i}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400 break-all"
        >
          {part}
        </a>
      );
    }

    // Then split remaining text by mentions
    const mentionParts = part.split(MENTION_REGEX);
    return mentionParts.map((m, j) => {
      if (MENTION_REGEX.test(m)) {
        MENTION_REGEX.lastIndex = 0;
        const username = m.slice(1);
        return (
          <Link
            key={`mention-${i}-${j}`}
            href={`/u/${username.toLowerCase()}`}
            className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {m}
          </Link>
        );
      }
      return <React.Fragment key={`text-${i}-${j}`}>{m}</React.Fragment>;
    });
  });
}
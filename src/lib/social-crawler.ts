export const SITE_ORIGIN = "https://www.agor4.com";
export const OG_IMAGE_URL = `${SITE_ORIGIN}/agora-og-card.jpg`;
export const OG_IMAGE_TYPE = "image/jpeg";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_TITLE = "Agora | Speak Freely";
export const OG_DESCRIPTION = "Topic communities with minimal interference";
export const TWITTER_CARD = "summary_large_image" as const;
export const TWITTER_SITE = "@agora_hello";

const SOCIAL_CRAWLER_UA = /Twitterbot|facebookexternalhit|LinkedInBot/i;

export function isSocialCrawlerUserAgent(
  userAgent: string | null | undefined
): boolean {
  return typeof userAgent === "string" && SOCIAL_CRAWLER_UA.test(userAgent);
}

/** Tiny static document for link-preview crawlers. No scripts, CSS, or app UI. */
export function socialCrawlerHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${OG_TITLE}</title>
<meta name="twitter:card" content="${TWITTER_CARD}">
<meta name="twitter:site" content="${TWITTER_SITE}">
<meta name="twitter:title" content="${OG_TITLE}">
<meta name="twitter:description" content="${OG_DESCRIPTION}">
<meta name="twitter:image" content="${OG_IMAGE_URL}">
<meta property="og:type" content="website">
<meta property="og:title" content="${OG_TITLE}">
<meta property="og:description" content="${OG_DESCRIPTION}">
<meta property="og:url" content="${SITE_ORIGIN}">
<meta property="og:image" content="${OG_IMAGE_URL}">
<meta property="og:image:type" content="${OG_IMAGE_TYPE}">
<meta property="og:image:width" content="${OG_IMAGE_WIDTH}">
<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}">
</head>
</html>
`;
}

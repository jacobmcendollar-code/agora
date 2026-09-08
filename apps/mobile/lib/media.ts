import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";

export function getYouTubeId(url: string | null | undefined): string | null {
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

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isXLink(url: string | null | undefined): boolean {
  if (!url) return false;
  const host = hostnameOf(url);
  if (host) {
    return host === "x.com" || host === "twitter.com" || host.endsWith(".x.com") || host.endsWith(".twitter.com");
  }
  return url.includes("x.com") || url.includes("twitter.com");
}

export function isTikTokLink(url: string | null | undefined): boolean {
  if (!url) return false;
  const host = hostnameOf(url);
  if (host) return host === "tiktok.com" || host.endsWith(".tiktok.com");
  return url.includes("tiktok.com");
}

export function isInstagramLink(url: string | null | undefined): boolean {
  if (!url) return false;
  const host = hostnameOf(url);
  if (host) {
    return (
      host === "instagram.com" ||
      host === "instagr.am" ||
      host.endsWith(".instagram.com") ||
      host.endsWith(".instagr.am")
    );
  }
  return url.includes("instagram.com") || url.includes("instagr.am");
}

/** X, TikTok, and Instagram — the networks that honor "Open links in apps". */
export function isNativeSocialLink(url: string | null | undefined): boolean {
  return isXLink(url) || isTikTokLink(url) || isInstagramLink(url);
}

const INSTAGRAM_RESERVED = new Set([
  "p",
  "reel",
  "reels",
  "tv",
  "stories",
  "explore",
  "accounts",
  "about",
  "legal",
  "developer",
  "direct",
  "privacy",
  "emailsignup",
]);

export function displayHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toUpperCase();
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").toUpperCase();
  }
}

export function linkOpenLabel(url: string): string {
  if (isTikTokLink(url)) return "Open TikTok";
  if (isXLink(url)) return "Open X";
  if (isInstagramLink(url)) return "Open Instagram";
  return "Read original →";
}

export function isGenericBody(body: string | null | undefined): boolean {
  if (!body) return true;
  const lower = body.toLowerCase();
  return (
    lower.includes("enjoy the videos and music you love") ||
    lower.includes("upload original content, and share it all")
  );
}

/**
 * Custom schemes that open the exact X status, TikTok video, or Instagram
 * profile. Empty means fall through to https Universal Links.
 */
export function nativeUrlsFor(url: string): string[] {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "x.com" || host === "twitter.com" || host.endsWith(".x.com") || host.endsWith(".twitter.com")) {
      const id = u.pathname.match(/\/status(?:es)?\/(\d+)/)?.[1];
      // X still registers twitter://. twitter://status?id= is the status deep link;
      // twitter://user/status/ID (old builder) only launched the app.
      return id ? [`twitter://status?id=${id}`] : [];
    }

    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const id = u.pathname.match(/\/(?:video|photo|v)\/(\d+)/)?.[1];
      if (!id) return [];
      // snssdk1233 is TikTok's iOS scheme; aweme/detail/{id} opens that video.
      // tiktok://video?id= is the public-scheme equivalent if snssdk isn't queryable.
      return [`snssdk1233://aweme/detail/${id}`, `tiktok://video?id=${id}`];
    }

    if (
      host === "instagram.com" ||
      host === "instagr.am" ||
      host.endsWith(".instagram.com") ||
      host.endsWith(".instagr.am")
    ) {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "stories" && parts[1] && !INSTAGRAM_RESERVED.has(parts[1].toLowerCase())) {
        return [`instagram://user?username=${encodeURIComponent(parts[1])}`];
      }
      // Posts / reels / tv: no public shortcode scheme. Empty list → https UL.
      if (parts[0] && ["p", "reel", "reels", "tv"].includes(parts[0].toLowerCase())) {
        return [];
      }
      const user = parts[0];
      if (user && !INSTAGRAM_RESERVED.has(user.toLowerCase())) {
        return [`instagram://user?username=${encodeURIComponent(user)}`];
      }
      return [];
    }
  } catch {
    return [];
  }
  return [];
}

export async function openExternal(url: string, openSocialInNativeApp: boolean) {
  const social = isNativeSocialLink(url);
  if (social && openSocialInNativeApp) {
    for (const native of nativeUrlsFor(url)) {
      try {
        if (await Linking.canOpenURL(native)) {
          await Linking.openURL(native);
          return;
        }
      } catch {
        // try the next scheme, then https
      }
    }
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // fall through to in-app browser
    }
  }
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    controlsColor: "#10b981",
  });
}

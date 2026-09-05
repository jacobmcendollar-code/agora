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

export function isXLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("x.com") || url.includes("twitter.com");
}

export function isTikTokLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("tiktok.com");
}

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

function nativeUrlFor(url: string): string | null {
  try {
    const u = new URL(url);
    if (isXLink(url)) {
      const path = `${u.pathname}${u.search}`;
      return `twitter://post?url=${encodeURIComponent(url)}`.replace(
        "twitter://post?url=",
        `twitter:/${path}`
      );
    }
    if (isTikTokLink(url)) {
      return `tiktok:/${u.pathname}${u.search}`;
    }
  } catch {
    return null;
  }
  return null;
}

export async function openExternal(url: string, openSocialInNativeApp: boolean) {
  const social = isXLink(url) || isTikTokLink(url);
  if (social && openSocialInNativeApp) {
    const native = nativeUrlFor(url);
    if (native) {
      try {
        const can = await Linking.canOpenURL(native);
        if (can) {
          await Linking.openURL(native);
          return;
        }
      } catch {
        // fall through
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

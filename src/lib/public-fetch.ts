import { lookup } from "dns/promises";
import http from "http";
import https from "https";
import { isIP } from "net";

const MAX_REDIRECTS = 3;
const DEFAULT_MAX_BYTES = 1_000_000;
const DEFAULT_TIMEOUT_MS = 4_000;

type Resolved = { address: string; family: 4 | 6 };

export function isBlockedIp(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return isBlockedIpv4(ip);
  if (kind === 6) return isBlockedIpv6(ip);
  return true;
}

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number(part));
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true;
  }
  const a = parts[0];
  const b = parts[1];
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true;
  if (a === 198 && (b === 18 || b === 19 || b === 51)) return true;
  if (a === 203 && b === 0) return true;
  if (a >= 224) return true;
  return false;
}

function isBlockedIpv6(ip: string): boolean {
  const value = ip.toLowerCase();
  if (value === "::" || value === "::1") return true;
  if (value.startsWith("::ffff:")) {
    const mapped = value.slice("::ffff:".length);
    if (mapped.includes(".")) return isBlockedIpv4(mapped);
  }
  if (/^f[cd]/.test(value)) return true;
  if (/^fe[89ab]/.test(value)) return true;
  if (value.startsWith("ff")) return true;
  if (value.startsWith("2001:db8")) return true;
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal"
  );
}

/** Public http(s) URL on port 80 or 443, with no private address in DNS. */
export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("blocked");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("blocked");
  if (url.username || url.password) throw new Error("blocked");
  const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;
  if (port !== 80 && port !== 443) throw new Error("blocked");
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isBlockedHostname(hostname)) throw new Error("blocked");
  const addresses = await resolvePublic(hostname);
  if (addresses.length === 0) throw new Error("blocked");
  return url;
}

async function resolvePublic(hostname: string): Promise<Resolved[]> {
  if (isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new Error("blocked");
    return [{ address: hostname, family: isIP(hostname) === 6 ? 6 : 4 }];
  }
  let records: { address: string; family: number }[];
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("blocked");
  }
  if (records.length === 0 || records.some((record) => isBlockedIp(record.address))) {
    throw new Error("blocked");
  }
  return records.map((record) => ({
    address: record.address,
    family: record.family === 6 ? 6 : 4,
  }));
}

function pinnedLookup(addresses: Resolved[]) {
  return (hostname: string, options: unknown, callback?: unknown) => {
    const cb = (typeof options === "function" ? options : callback) as (
      err: NodeJS.ErrnoException | null,
      address: string | Resolved[],
      family?: number
    ) => void;
    const all =
      typeof options === "object" &&
      options !== null &&
      "all" in options &&
      Boolean((options as { all?: boolean }).all);
    if (all) cb(null, addresses);
    else cb(null, addresses[0].address, addresses[0].family);
  };
}

type FetchResult = {
  ok: boolean;
  status: number;
  text: string;
};

/**
 * Fetches a public URL and follows a few redirects, re-checking each target.
 * DNS answers are pinned for the connection so a rebinding response cannot
 * switch the socket onto a private address. Returns null when the URL is
 * refused, the request fails, or the body exceeds the size cap.
 */
export async function fetchPublicText(
  raw: string,
  options?: { maxBytes?: number; timeoutMs?: number; accept?: string; userAgent?: string }
): Promise<FetchResult | null> {
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let current: URL;
  try {
    current = await assertPublicHttpUrl(raw);
  } catch {
    return null;
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let addresses: Resolved[];
    try {
      addresses = await resolvePublic(current.hostname.replace(/^\[|\]$/g, ""));
    } catch {
      return null;
    }

    const lib = current.protocol === "https:" ? https : http;
    const response = await requestOnce(lib, current, addresses, maxBytes, timeoutMs, options);
    if (!response) return null;

    if (response.status >= 300 && response.status < 400) {
      if (hop === MAX_REDIRECTS || !response.location) return null;
      try {
        current = await assertPublicHttpUrl(new URL(response.location, current).href);
      } catch {
        return null;
      }
      continue;
    }

    return { ok: response.status >= 200 && response.status < 300, status: response.status, text: response.text };
  }

  return null;
}

function requestOnce(
  lib: typeof http | typeof https,
  current: URL,
  addresses: Resolved[],
  maxBytes: number,
  timeoutMs: number,
  options?: { accept?: string; userAgent?: string }
) {
  return new Promise<{ status: number; location?: string; text: string } | null>((resolve) => {
    let settled = false;
    const finish = (value: { status: number; location?: string; text: string } | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const req = lib.request(
      current,
      {
        method: "GET",
        headers: {
          Accept: options?.accept || "text/html,application/json;q=0.9,*/*;q=0.8",
          "User-Agent":
            options?.userAgent ||
            "Mozilla/5.0 (compatible; AgoraBot/1.0; +https://agor4.com)",
        },
        lookup: pinnedLookup(addresses) as never,
        timeout: timeoutMs,
      },
      (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400) {
          res.resume();
          finish({ status, location: res.headers.location, text: "" });
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            req.destroy();
            finish(null);
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          finish({ status, text: Buffer.concat(chunks).toString("utf8") });
        });
        res.on("error", () => finish(null));
      }
    );
    req.on("timeout", () => {
      req.destroy();
      finish(null);
    });
    req.on("error", () => finish(null));
    req.end();
  });
}

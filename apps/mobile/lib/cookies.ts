import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "agora.auth.cookies";

type CookieRecord = {
  value: string;
  expiresAt?: number;
};

type CookieJar = Record<string, CookieRecord>;

let jar: CookieJar = {};
let readyPromise: Promise<void> | null = null;

function splitSetCookieList(raw: string): string[] {
  return raw.split(/,(?=\s*[\w!#$%&'*+\-.^`|~]+=)/);
}

function getSetCookieHeaders(res: Response): string[] {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") {
    const list = headers.getSetCookie();
    if (list?.length) return list;
  }
  const raw = headers.get("set-cookie");
  if (!raw) return [];
  return splitSetCookieList(raw);
}

function parseOne(header: string): { name: string; record: CookieRecord } | null {
  const parts = header.split(";").map((p) => p.trim());
  const first = parts[0];
  if (!first) return null;
  const eq = first.indexOf("=");
  if (eq <= 0) return null;
  const name = first.slice(0, eq).trim();
  const value = first.slice(eq + 1);
  let expiresAt: number | undefined;
  for (const attr of parts.slice(1)) {
    const [k, v] = attr.split("=");
    const key = (k || "").trim().toLowerCase();
    if (key === "max-age" && v) {
      const seconds = Number(v);
      if (Number.isFinite(seconds)) expiresAt = Date.now() + seconds * 1000;
    }
    if (key === "expires" && v && !expiresAt) {
      const ts = Date.parse(v);
      if (!Number.isNaN(ts)) expiresAt = ts;
    }
  }
  return { name, record: { value, expiresAt } };
}

function prune() {
  const now = Date.now();
  for (const [name, rec] of Object.entries(jar)) {
    if (rec.expiresAt && rec.expiresAt <= now) delete jar[name];
  }
}

async function persist() {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(jar));
  } catch {
    // SecureStore is unavailable in some web/dev cases; memory jar still works.
  }
}

export function loadCookies(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (raw) jar = JSON.parse(raw) as CookieJar;
        prune();
      } catch {
        jar = {};
      }
    })();
  }
  return readyPromise;
}

export function ingestCookies(res: Response) {
  const headers = getSetCookieHeaders(res);
  if (!headers.length) return;
  for (const header of headers) {
    const parsed = parseOne(header);
    if (!parsed) continue;
    if (parsed.record.value === "" || parsed.record.value === '""') {
      delete jar[parsed.name];
    } else {
      jar[parsed.name] = parsed.record;
    }
  }
  prune();
  void persist();
}

export function cookieHeader(): string {
  prune();
  return Object.entries(jar)
    .map(([name, rec]) => `${name}=${rec.value}`)
    .join("; ");
}

export async function clearCookies() {
  jar = {};
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasSessionCookie(): boolean {
  prune();
  return Object.keys(jar).some(
    (name) =>
      name.includes("authjs.session-token") || name.includes("next-auth.session-token")
  );
}

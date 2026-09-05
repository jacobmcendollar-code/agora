import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "agora.auth.session";
const LEGACY_JAR_KEY = "agora.auth.cookies";

type StoredSession = {
  sessionToken: string;
  cookieName: string;
};

let stored: StoredSession | null = null;
let readyPromise: Promise<void> | null = null;
const clearedListeners = new Set<() => void>();

function notifyCleared() {
  for (const listener of clearedListeners) listener();
}

export function onSessionCleared(listener: () => void): () => void {
  clearedListeners.add(listener);
  return () => {
    clearedListeners.delete(listener);
  };
}

export function loadCookies(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (raw) stored = JSON.parse(raw) as StoredSession;
      } catch {
        stored = null;
      }
    })();
  }
  return readyPromise;
}

export async function saveSession(sessionToken: string, cookieName: string) {
  stored = { sessionToken, cookieName };
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // SecureStore is unavailable in some web/dev cases; memory store still works.
  }
}

export function cookieHeader(): string {
  if (!stored?.sessionToken || !stored.cookieName) return "";
  return `${stored.cookieName}=${stored.sessionToken}`;
}

export function sessionToken(): string {
  return stored?.sessionToken || "";
}

export async function clearCookies() {
  stored = null;
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    await SecureStore.deleteItemAsync(LEGACY_JAR_KEY);
  } catch {
    // ignore
  }
  notifyCleared();
}

export function hasSession(): boolean {
  return Boolean(stored?.sessionToken && stored.cookieName);
}

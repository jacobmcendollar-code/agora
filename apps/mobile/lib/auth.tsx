import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, apiJson } from "./api";
import { API_URL } from "./config";
import {
  clearCookies,
  hasSession,
  loadCookies,
  onSessionCleared,
  saveSession,
} from "./cookies";
import type { AuthSession, SessionUser } from "./types";

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<SessionUser | null>;
  updateUser: (patch: Partial<SessionUser>) => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  signIn: async () => {},
  signOut: async () => {},
  refresh: async () => null,
  updateUser: () => {},
});

type MobileLoginResponse = {
  sessionToken?: string;
  cookieName?: string;
  user?: Record<string, unknown>;
  error?: string;
};

function normalizeUser(raw: Record<string, unknown> | undefined | null): SessionUser | null {
  if (!raw) return null;
  const username = String(raw.username || raw.name || "").trim();
  const id = String(raw.id || "").trim();
  if (!id && !username) return null;
  return {
    id,
    username,
    email: (raw.email as string | null) ?? null,
    image: (raw.image as string | null) ?? null,
    showNsfw: Boolean(raw.showNsfw),
  };
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("network request failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("network error") ||
    msg.includes("internet connection")
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const userRef = useRef<SessionUser | null>(null);
  userRef.current = user;

  const refresh = useCallback(async () => {
    await loadCookies();
    if (!hasSession()) {
      setUser(null);
      return null;
    }
    try {
      const res = await apiFetch("/api/mobile/session");
      if (res.status === 401) {
        await clearCookies();
        setUser(null);
        return null;
      }
      if (!res.ok) {
        return userRef.current;
      }
      const data = (await res.json().catch(() => null)) as AuthSession | SessionUser | null;
      const next = normalizeUser(
        data && typeof data === "object" && "user" in data
          ? (data.user as Record<string, unknown>)
          : (data as Record<string, unknown> | null)
      );
      if (!next) {
        await clearCookies();
        setUser(null);
        return null;
      }
      setUser(next);
      return next;
    } catch (err) {
      if (isNetworkError(err) || userRef.current) {
        return userRef.current;
      }
      return null;
    }
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => {})
      .finally(() => setReady(true));
  }, [refresh]);

  useEffect(() => onSessionCleared(() => setUser(null)), []);

  const signIn = useCallback(async (username: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/mobile/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
        }),
      });
    } catch {
      throw new Error("Could not reach Agora. Check your connection.");
    }

    const data = (await res.json().catch(() => ({}))) as MobileLoginResponse;
    if (res.status === 401) {
      throw new Error(data.error || "Invalid username or password");
    }
    if (!res.ok) {
      throw new Error(data.error || `Could not sign in (${res.status})`);
    }
    if (!data.sessionToken || !data.cookieName) {
      throw new Error("Could not start login");
    }

    await saveSession(data.sessionToken, data.cookieName);
    const next = normalizeUser(data.user);
    if (next) {
      setUser(next);
      return;
    }

    const sessionUser = await refresh();
    if (!sessionUser) {
      await clearCookies();
      throw new Error("Signed in, but the session could not be loaded. Try again.");
    }
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await apiFetch("/api/mobile/logout", { method: "POST" });
    } catch {
      // JWT cannot be revoked; still clear the local token.
    }
    await clearCookies();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<SessionUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({ user, ready, signIn, signOut, refresh, updateUser }),
    [user, ready, signIn, signOut, refresh, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export async function registerAccount(input: {
  username: string;
  email: string;
  password: string;
}) {
  return apiJson<{ ok: boolean }>("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

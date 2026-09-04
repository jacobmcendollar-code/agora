import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, apiJson } from "./api";
import { API_URL } from "./config";
import { clearCookies, ingestCookies, loadCookies } from "./cookies";
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

async function getCsrfToken(): Promise<string> {
  const res = await apiFetch("/api/auth/csrf");
  const data = (await res.json()) as { csrfToken?: string };
  if (!data.csrfToken) throw new Error("Could not start login");
  return data.csrfToken;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    await loadCookies();
    const res = await apiFetch("/api/auth/session");
    const data = (await res.json().catch(() => null)) as AuthSession | SessionUser | null;
    const next = normalizeUser(
      data && typeof data === "object" && "user" in data
        ? (data.user as Record<string, unknown>)
        : (data as Record<string, unknown> | null)
    );
    setUser(next);
    return next;
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, [refresh]);

  const signIn = useCallback(
    async (username: string, password: string) => {
      const csrfToken = await getCsrfToken();
      const body = new URLSearchParams({
        csrfToken,
        username: username.trim().toLowerCase(),
        password,
        callbackUrl: `${API_URL}/`,
        json: "true",
        redirect: "false",
      });
      const res = await apiFetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "X-Auth-Return-Redirect": "1",
          Origin: API_URL,
          Referer: `${API_URL}/login`,
        },
        body: body.toString(),
      });
      ingestCookies(res);
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      const redirected = data.url || "";
      if (redirected.includes("error=CredentialsSignin") || data.error === "CredentialsSignin") {
        throw new Error("Invalid username or password");
      }
      const sessionUser = await refresh();
      if (!sessionUser) {
        // TODO(auth): Cookie/session jar against /api/auth/* did not yield a
        // session after credentials POST. Do NOT add a mobile Bearer endpoint
        // without a CoS/Jacob ping — Auth.js JWT cookies are the intended path.
        throw new Error(
          "Signed in on the server, but this build could not keep the session cookie. Try again, or use the site."
        );
      }
    },
    [refresh]
  );

  const signOut = useCallback(async () => {
    try {
      const csrfToken = await getCsrfToken();
      const body = new URLSearchParams({
        csrfToken,
        callbackUrl: `${API_URL}/`,
        json: "true",
      });
      await apiFetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
          Origin: API_URL,
        },
        body: body.toString(),
      });
    } catch {
      // still clear local jar
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

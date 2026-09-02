"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
type SuggestCommunity = {
  name: string;
  title: string;
  nsfw?: boolean;
};

type SuggestPost = {
  id: string;
  title: string;
  community: { name: string; title: string };
};

type SuggestResults = {
  communities: SuggestCommunity[];
  posts: SuggestPost[];
};

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [suggestions, setSuggestions] = useState<SuggestResults>({
    communities: [],
    posts: [],
  });
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      setUnread(0);
      return;
    }
    if (pathname === "/notifications") {
      setUnread(0);
      return;
    }
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setUnread(data.unreadCount || 0))
      .catch(() => {});
  }, [status, pathname]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setShowSuggest(false);
    setQuery("");
    setSuggestions({ communities: [], posts: [] });
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
      const inDesktop =
        desktopSearchRef.current && desktopSearchRef.current.contains(target);
      const inMobile =
        mobileSearchRef.current && mobileSearchRef.current.contains(target);
      if (!inDesktop && !inMobile) {
        setShowSuggest(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    const q = query.trim();
    if (q.length < 1) {
      setSuggestions({ communities: [], posts: [] });
      setShowSuggest(false);
      setLoadingSuggest(false);
      return;
    }
    setLoadingSuggest(true);
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(q)}`
        );
        const data = await res.json();
        setSuggestions({
          communities: data.communities || [],
          posts: data.posts || [],
        });
        setShowSuggest(true);
      } catch {
        setSuggestions({ communities: [], posts: [] });
      } finally {
        setLoadingSuggest(false);
      }
    }, 200);
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
  }, [query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setShowSuggest(false);
    setQuery("");
  }

  function goToCommunity(name: string) {
    router.push(`/c/${name}`);
    setQuery("");
    setShowSuggest(false);
    setSearchOpen(false);
  }

  function goToPost(communityName: string, postId: string) {
    router.push(`/c/${communityName}/posts/${postId}`);
    setQuery("");
    setShowSuggest(false);
    setSearchOpen(false);
  }

  const hasSuggestions =
    suggestions.communities.length > 0 || suggestions.posts.length > 0;

  function SuggestDropdown() {
    if (!showSuggest || query.trim().length < 1) return null;
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        {loadingSuggest && !hasSuggestions ? (
          <div className="px-3 py-2 text-sm text-zinc-500">Searching…</div>
        ) : !hasSuggestions ? (
          <div className="px-3 py-2 text-sm text-zinc-500">No matches</div>
        ) : (
          <div className="max-h-80 overflow-y-auto py-1">
            {suggestions.communities.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Communities
                </div>
                {suggestions.communities.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => goToCommunity(c.name)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {c.title}
                    </span>
                    {c.nsfw && (
                      <span className="text-[10px] font-medium text-rose-500">
                        NSFW
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {suggestions.posts.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Posts
                </div>
                {suggestions.posts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => goToPost(p.community.name, p.id)}
                    className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <span className="line-clamp-1 text-sm text-zinc-900 dark:text-zinc-100">
                      {p.title}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {p.community.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                const q = query.trim();
                if (!q) return;
                router.push(`/search?q=${encodeURIComponent(q)}`);
                setShowSuggest(false);
                setSearchOpen(false);
                setQuery("");
              }}
              className="w-full border-t px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Search for “{query.trim()}”
            </button>
          </div>
        )}
      </div>
    );
  }

  const initial = session?.user?.username
    ? session.user.username.charAt(0).toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur dark:bg-zinc-900/80">
      <div className="container relative mx-auto flex h-14 max-w-5xl items-center px-3 sm:px-4">
        {/* Left: Logo + Communities */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <Link
            href="/"
            className="flex shrink-0 cursor-pointer select-none items-center"
            aria-label="Agora home"
          >
            <Image
              src="/agora-logo.png"
              alt="Agora"
              width={120}
              height={44}
              className="pointer-events-none h-7 w-auto select-none sm:h-8"
              priority
              draggable={false}
            />
          </Link>
          <Link
            href="/communities"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Communities
          </Link>
        </div>

        {/* Center: Search (desktop) */}
        <div
          ref={desktopSearchRef}
          className="absolute left-1/2 hidden w-80 -translate-x-1/2 sm:block lg:w-96"
        >
          <form onSubmit={handleSearch}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (query.trim().length >= 1) setShowSuggest(true);
              }}
              placeholder="Search..."
              autoComplete="off"
              className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700"
            />
          </form>
          <SuggestDropdown />
        </div>

        {/* Right */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:hidden"
            aria-label="Search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          {status === "authenticated" && (
            <Link
              href="/notifications"
              className="relative rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              aria-label="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-medium text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )}

          {status === "loading" ? (
            <div className="h-8 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          ) : session ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label="Menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700/80 dark:bg-zinc-900 dark:shadow-black/40">
                  {/* 1. User */}
                  <Link
                    href={`/u/${session.user.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 transition hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {session.user.username}
                      </div>
                      <div className="text-xs text-zinc-500">View profile</div>
                    </div>
                  </Link>

                  <div className="mx-3 border-t border-zinc-200 dark:border-zinc-800" />

                  {/* 2. Log out */}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log out
                  </button>

                  <div className="mx-3 border-t border-zinc-200 dark:border-zinc-800" />

                  {/* 3. Settings */}
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-white"
                  >
                    <svg
                      className="h-4 w-4 text-zinc-400 dark:text-zinc-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Settings
                  </Link>

                  {/* 4. About Agora */}
                  <Link
                    href="/about"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-white"
                  >
                    <svg
                      className="h-4 w-4 text-zinc-400 dark:text-zinc-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    About Agora
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="hidden rounded-md bg-zinc-900 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:inline-block"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile search panel */}
      {searchOpen && (
        <div
          ref={mobileSearchRef}
          className="relative border-t px-3 py-2 sm:hidden"
        >
          <form onSubmit={handleSearch}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (query.trim().length >= 1) setShowSuggest(true);
              }}
              placeholder="Search posts and communities..."
              autoFocus
              autoComplete="off"
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700"
            />
          </form>
          <SuggestDropdown />
        </div>
      )}
    </header>
  );
}

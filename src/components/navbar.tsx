"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

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

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur dark:bg-zinc-900/80">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-3 sm:px-4">
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/" className="flex shrink-0 items-center" aria-label="Agora home">
            <Image
              src="/agora-logo.png"
              alt="Agora"
              width={120}
              height={44}
              className="h-7 w-auto sm:h-8"
              priority
            />
          </Link>
          <Link
            href="/communities"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Communities
          </Link>
          <Link
            href="/about"
            className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 sm:inline"
          >
            About
          </Link>
        </div>

        <div
          ref={desktopSearchRef}
          className="relative hidden max-w-xs flex-1 sm:block"
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
              className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700"
              autoComplete="off"
            />
          </form>
          <SuggestDropdown />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:hidden"
            aria-label="Search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          {session && (
            <Link
              href="/notifications"
              className="relative rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
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
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="Open menu"
                aria-expanded={menuOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-lg border bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="flex items-center justify-end gap-2 rounded-md px-2 py-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">
                      Theme
                    </span>
                    <ThemeToggle />
                  </div>
                  <div className="my-1 border-t dark:border-zinc-700" />
                  <Link
                    href={`/u/${session.user.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-md px-2 py-2 text-right text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {session.user.username}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="block w-full rounded-md px-2 py-2 text-right text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Log out
                  </button>
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
                className="rounded-md bg-zinc-900 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

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
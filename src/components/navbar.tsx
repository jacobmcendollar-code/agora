"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

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
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setQuery("");
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
        <form
          onSubmit={handleSearch}
          className="absolute left-1/2 hidden -translate-x-1/2 sm:block"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-48 rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 lg:w-64"
          />
        </form>

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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                      {initial}
                    </div>
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

                  {/* 3. Theme */}
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <svg
                        className="h-4 w-4 text-zinc-400 dark:text-zinc-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                      </svg>
                      Theme
                    </div>
                    <ThemeToggle />
                  </div>

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
        <div className="border-t px-3 py-2 sm:hidden">
          <form onSubmit={handleSearch}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts and communities..."
              autoFocus
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700"
            />
          </form>
        </div>
      )}
    </header>
  );
}

"use client";

import Link from "next/link";
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

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur dark:bg-zinc-900/80">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-3 sm:px-4">
        {/* Left: Logo + Communities only */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-emerald-500 sm:text-xl"
          >
            Agora
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <Link
              href="/communities"
              className="hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Communities
            </Link>
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
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

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden sm:block">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-40 rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 lg:w-56"
            />
          </form>

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
                <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Theme
                    </span>
                    <ThemeToggle />
                  </div>
                  <Link
                    href="/about"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    About
                  </Link>
                  <Link
                    href={`/u/${session.user.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-right text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {session.user.username}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="block w-full px-3 py-2 text-right text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
                className="hidden rounded-md bg-zinc-900 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:inline-block"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

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
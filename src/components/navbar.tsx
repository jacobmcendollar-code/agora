"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

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
        {/* Left side */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight sm:text-xl">
            Agora
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 sm:gap-4">
            <Link href="/communities" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Communities
            </Link>
            <Link href="/about" className="hidden hover:text-zinc-900 dark:hover:text-zinc-100 sm:inline">
              About
            </Link>
          </nav>
        </div>

        {/* Desktop search */}
        <form onSubmit={handleSearch} className="hidden flex-1 max-w-xs sm:block">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700"
          />
        </form>

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:hidden"
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          <ThemeToggle />

          {status === "loading" ? (
            <div className="h-8 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          ) : session ? (
            <>
              <Link
                href={`/u/${session.user.username}`}
                className="hidden text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300 sm:inline"
              >
                {session.user.username}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Log out
              </button>
            </>
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

      {/* Mobile expanded search */}
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
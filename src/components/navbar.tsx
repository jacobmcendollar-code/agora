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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur dark:bg-zinc-900/80">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-3 sm:px-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight sm:text-xl">
            Agora
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400 sm:flex">
            <Link href="/communities" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Communities
            </Link>
            <Link href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              About
            </Link>
          </nav>
        </div>

        {/* Search - visible on all screen sizes */}
        <form onSubmit={handleSearch} className="flex-1 max-w-[140px] sm:max-w-xs">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-md border bg-transparent px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700"
          />
        </form>

        <div className="flex items-center gap-1.5 sm:gap-2">
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
                className="rounded-md bg-zinc-900 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
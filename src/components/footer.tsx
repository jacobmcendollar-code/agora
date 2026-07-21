import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Agora</p>
            <p className="mt-1 text-sm text-zinc-500">
              Open discussion with minimal interference
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              About
            </Link>
            <Link href="/communities/new" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Create a community
            </Link>
            <Link href="/communities" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Communities
            </Link>
          </nav>
        </div>

        <p className="mt-6 text-xs text-zinc-400">
          © {new Date().getFullYear()} Agora
        </p>
      </div>
    </footer>
  );
}
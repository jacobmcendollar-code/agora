"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function NewCommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === "loading") {
    return <div className="py-12 text-center text-zinc-500">Loading…</div>;
  }

  if (!session) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4">You need an account to create a community.</p>
        <Link href="/login" className="underline">
          Log in
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string).trim().toLowerCase();
    const title = (form.get("title") as string).trim();
    const description = (form.get("description") as string).trim();
    const rules = (form.get("rules") as string).trim() || null;

    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, title, description, rules }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create community");
        setLoading(false);
        return;
      }

      router.push(`/c/${data.name}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create a community</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Communities are topic-based. The AI moderator will use the description
          (and optional rules) to keep posts roughly on-topic and free of spam.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm dark:bg-zinc-900">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Community name (slug)
          </label>
          <div className="flex items-center">
            <span className="rounded-l-md border border-r-0 bg-zinc-100 px-3 py-2 text-sm text-zinc-500 dark:bg-zinc-800">
              c/
            </span>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={3}
              maxLength={32}
              pattern="[a-z0-9_]+"
              placeholder="technology"
              className="w-full rounded-r-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">Lowercase letters, numbers, underscores only</p>
        </div>

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Display title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={100}
            placeholder="Technology"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            maxLength={500}
            placeholder="A place to discuss technology, gadgets, software, and the future."
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />
          <p className="mt-1 text-xs text-zinc-500">
            This is the main signal the AI uses for on-topic checks.
          </p>
        </div>

        <div>
          <label htmlFor="rules" className="mb-1 block text-sm font-medium">
            Extra AI guidance (optional)
          </label>
          <textarea
            id="rules"
            name="rules"
            rows={2}
            maxLength={500}
            placeholder="e.g. No product promotion. Memes are fine."
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Creating…" : "Create community"}
        </button>
      </form>
    </div>
  );
}

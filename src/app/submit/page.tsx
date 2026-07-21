"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

function SubmitForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("community") || "";

  const [communities, setCommunities] = useState<{ name: string; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/communities")
      .then((r) => r.json())
      .then(setCommunities)
      .catch(() => {});
  }, []);

  if (status === "loading") {
    return <div className="py-12 text-center text-zinc-500">Loading…</div>;
  }

  if (!session) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4">You need an account to post.</p>
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
    const communityName = form.get("community") as string;
    const title = (form.get("title") as string).trim();
    const body = (form.get("body") as string).trim();
    const url = (form.get("url") as string).trim() || null;

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityName, title, body, url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create post");
        setLoading(false);
        return;
      }

      router.push(`/c/${communityName}/posts/${data.id}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create a post</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Content is checked by a minimal AI moderator (spam + off-topic only).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm dark:bg-zinc-900">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="community" className="mb-1 block text-sm font-medium">
            Community
          </label>
          <select
            id="community"
            name="community"
            required
            defaultValue={preselected}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          >
            <option value="">Select a community</option>
            {communities.map((c) => (
              <option key={c.name} value={c.name}>
                c/{c.name} — {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={300}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />
        </div>

        <div>
          <label htmlFor="url" className="mb-1 block text-sm font-medium">
            URL (optional)
          </label>
          <input
            id="url"
            name="url"
            type="url"
            placeholder="https://"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />
        </div>

        <div>
          <label htmlFor="body" className="mb-1 block text-sm font-medium">
            Body (optional if URL provided)
          </label>
          <textarea
            id="body"
            name="body"
            rows={6}
            maxLength={40000}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Checking & posting…" : "Post"}
        </button>
      </form>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center">Loading…</div>}>
      <SubmitForm />
    </Suspense>
  );
}

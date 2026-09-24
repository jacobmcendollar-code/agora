"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type PostFormat = "any" | "media" | "discussion";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export default function NewCommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nsfw, setNsfw] = useState(false);
  const [title, setTitle] = useState("");
  const [postFormat, setPostFormat] = useState<PostFormat>("any");

  const slug = useMemo(() => slugify(title), [title]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const communityTitle = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();

    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: communityTitle,
          description,
          nsfw,
          postFormat,
        }),
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

  const cardClass = (value: PostFormat) =>
    `cursor-pointer rounded-lg border px-2 py-3 text-center transition ${
      postFormat === value
        ? "border-emerald-500 bg-emerald-500/10"
        : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
    }`;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create a community</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Communities are topic-based. The AI moderator uses the description
          to keep posts roughly on-topic and free of spam.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-lg border bg-white p-6 shadow-sm dark:bg-zinc-900"
      >
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Community Name
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Technology"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            {slug
              ? `URL will be agor4.com/c/${slug}`
              : "URL will appear here as you type"}
          </p>
        </div>
        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium"
          >
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
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Posts</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPostFormat("any")}
              className={cardClass("any")}
            >
              <span className="block text-sm font-medium">Any</span>
              <span className="mt-1 block text-[11px] leading-snug text-zinc-500">
                Links, photos, and discussion
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPostFormat("media")}
              className={cardClass("media")}
            >
              <span className="block text-sm font-medium">Media</span>
              <span className="mt-1 block text-[11px] leading-snug text-zinc-500">
                Links and images only
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPostFormat("discussion")}
              className={cardClass("discussion")}
            >
              <span className="block text-sm font-medium">Discussion</span>
              <span className="mt-1 block text-[11px] leading-snug text-zinc-500">
                Text posts only
              </span>
            </button>
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={nsfw}
            onChange={(e) => setNsfw(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300"
          />
          <span>
            <span className="font-medium">This community is for adults only</span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              Adult content is allowed here. The community stays hidden from
              users who have not opted in to adult content.
            </span>
          </span>
        </label>
        <button
          type="submit"
          disabled={loading || !slug}
          className="w-full rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create community"}
        </button>
      </form>
    </div>
  );
}
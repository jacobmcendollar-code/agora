"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { UploadButton } from "@/lib/uploadthing";

type Community = {
  name: string;
  title: string;
};

function SubmitForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("community") || "";

  const [communities, setCommunities] = useState<Community[]>([]);
  const [filtered, setFiltered] = useState<Community[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(preselected);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/communities")
      .then((r) => r.json())
      .then((data) => {
        setCommunities(data);
        setFiltered(data);

        if (preselected) {
          const match = data.find((c: Community) => c.name === preselected);
          if (match) setQuery(match.title);
        }
      })
      .catch(() => {});
  }, [preselected]);

  function handleSearch(value: string) {
    setQuery(value);
    setSelected("");
    setShowDropdown(true);

    if (!value.trim()) {
      setFiltered(communities);
      return;
    }

    const lower = value.toLowerCase();
    setFiltered(
      communities.filter(
        (c) =>
          c.title.toLowerCase().includes(lower) ||
          c.name.toLowerCase().includes(lower)
      )
    );
  }

  function selectCommunity(community: Community) {
    setSelected(community.name);
    setQuery(community.title);
    setShowDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selected) {
      setError("Please select a community");
      return;
    }

    setLoading(true);

    const form = new FormData(e.currentTarget);
    const title = (form.get("title") as string).trim();
    const body = (form.get("body") as string).trim();
    const url = (form.get("url") as string).trim() || null;

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityName: selected,
          title,
          body,
          url,
          imageUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create post");
        setLoading(false);
        return;
      }

      router.push(`/c/${selected}/posts/${data.id}`);
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
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">
          You need an account to post.
        </p>
        <Link
          href="/login"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create a post</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Posts are lightly checked for spam and off-topic content.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border bg-white p-5 shadow-sm dark:bg-zinc-900 sm:p-6"
      >
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Community */}
        <div className="relative">
          <label
            htmlFor="community-search"
            className="mb-1.5 block text-sm font-medium"
          >
            Community
          </label>
          <input
            id="community-search"
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search communities..."
            autoComplete="off"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
          />

          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              {filtered.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => selectCommunity(c)}
                  className="block w-full px-3 py-2.5 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  {c.title}
                </button>
              ))}
            </div>
          )}

          {showDropdown && filtered.length === 0 && query && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-500 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              No communities found
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={300}
            placeholder="A clear, descriptive title"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        {/* Image */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Image <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          {imageUrl ? (
            <div className="space-y-2">
              <img
                src={imageUrl}
                alt="Upload preview"
                className="max-h-52 w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="text-sm text-red-600 hover:underline dark:text-red-400"
              >
                Remove image
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
              <UploadButton
                endpoint="postImage"
                onClientUploadComplete={(res) => {
                  if (res && res[0]) {
                    setImageUrl(res[0].ufsUrl || res[0].url);
                  }
                }}
                onUploadError={(error: Error) => {
                  setError(`Upload failed: ${error.message}`);
                }}
              />
            </div>
          )}
        </div>

        {/* URL */}
        <div>
          <label htmlFor="url" className="mb-1.5 block text-sm font-medium">
            Link <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <input
            id="url"
            name="url"
            type="url"
            placeholder="https://"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        {/* Body */}
        <div>
          <label htmlFor="body" className="mb-1.5 block text-sm font-medium">
            Text <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <textarea
            id="body"
            name="body"
            rows={5}
            maxLength={40000}
            placeholder="Add more context if you want..."
            className="w-full resize-y rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Posting…" : "Post"}
        </button>
      </form>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-zinc-500">Loading…</div>}>
      <SubmitForm />
    </Suspense>
  );
}
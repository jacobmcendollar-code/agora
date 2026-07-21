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
          imageUrl, // uploaded image
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
        <p className="mb-4">You need an account to post.</p>
        <Link href="/login" className="underline">
          Log in
        </Link>
      </div>
    );
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

        {/* Community search */}
        <div className="relative">
          <label htmlFor="community-search" className="mb-1 block text-sm font-medium">
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
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />

          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg dark:bg-zinc-900">
              {filtered.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => selectCommunity(c)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {c.title}
                </button>
              ))}
            </div>
          )}
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

        {/* Image Upload */}
        <div>
          <label className="mb-1 block text-sm font-medium">Image (optional)</label>
          {imageUrl ? (
            <div className="relative">
              <img
                src={imageUrl}
                alt="Upload preview"
                className="max-h-48 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="mt-2 text-sm text-red-600 hover:underline"
              >
                Remove image
              </button>
            </div>
          ) : (
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
          )}
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
            Body (optional)
          </label>
          <textarea
            id="body"
            name="body"
            rows={5}
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
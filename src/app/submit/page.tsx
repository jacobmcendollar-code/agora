"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Community = {
  name: string;
  title: string;
};

type PostType = "text" | "link" | "image";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SubmitForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("community") || "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [communities, setCommunities] = useState<Community[]>([]);
  const [filtered, setFiltered] = useState<Community[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(preselected);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [postType, setPostType] = useState<PostType>("link");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [nsfw, setNsfw] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [titleLoading, setTitleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/communities")
      .then((r) => r.json())
      .then((data) => {
        setCommunities(data);
        setFiltered(data);

        if (preselected) {
          const match = data.find((c: Community) => c.name === preselected);
          if (match) {
            setSelected(match.name);
            setSelectedTitle(match.title);
            setQuery("");
          }
        }
      })
      .catch(() => {});
  }, [preselected]);

  useEffect(() => {
    if (postType !== "link" || !url.trim()) {
      setPreviewThumb(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setTitleLoading(true);
      setPreviewLoading(true);
      try {
        const res = await fetch(
          `/api/link-preview?url=${encodeURIComponent(url.trim())}`
        );
        const data = await res.json();

        if (!cancelled) {
          if (data.title && !title.trim()) {
            setTitle(data.title);
          }
          setPreviewThumb(data.thumbnail || null);
        }
      } catch {
        if (!cancelled) {
          setPreviewThumb(null);
        }
      } finally {
        if (!cancelled) {
          setTitleLoading(false);
          setPreviewLoading(false);
        }
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url, postType, title]);

  function handleSearch(value: string) {
    setQuery(value);
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
    setSelectedTitle(community.title);
    setQuery("");
    setShowDropdown(false);
  }

  function clearCommunity() {
    setSelected("");
    setSelectedTitle("");
    setQuery("");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      if (!file.type.startsWith("image/")) {
        setError("File must be an image");
        setUploading(false);
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        setError("Image must be under 4MB");
        setUploading(false);
        return;
      }

      const fileData = await fileToBase64(file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
      } else {
        setImageUrl(data.url);
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selected) {
      setError("Please select a community");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityName: selected,
          title: title.trim(),
          body: body.trim() || null,
          url: postType === "link" ? url.trim() || null : null,
          imageUrl: postType === "image" ? imageUrl : null,
          nsfw,
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

  const types: { key: PostType; label: string }[] = [
    { key: "link", label: "Link" },
    { key: "image", label: "Image" },
    { key: "text", label: "Text" },
  ];

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
          <label className="mb-1.5 block text-sm font-medium">Community</label>

          {selected ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border bg-zinc-50 px-3 py-1.5 text-sm dark:bg-zinc-800">
                {selectedTitle}
                <button
                  type="button"
                  onClick={clearCommunity}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  aria-label="Clear community"
                >
                  ×
                </button>
              </span>
            </div>
          ) : (
            <>
              <input
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
            </>
          )}
        </div>

        {/* Post type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Type</label>
          <div className="flex gap-1 rounded-lg border p-1 dark:border-zinc-700">
            {types.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setPostType(t.key)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  postType === t.key
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <span className="text-xs text-zinc-400">{title.length}/300</span>
          </div>
          <input
            id="title"
            type="text"
            required
            maxLength={300}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A clear, descriptive title"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
          />
          {titleLoading && (
            <p className="mt-1 text-xs text-zinc-500">Fetching title…</p>
          )}
        </div>

        {/* Link */}
        {postType === "link" && (
          <div>
            <label htmlFor="url" className="mb-1.5 block text-sm font-medium">
              Link
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
            />
            {previewLoading && (
              <p className="mt-1 text-xs text-zinc-500">Loading preview…</p>
            )}
            {previewThumb && (
              <img
                src={previewThumb}
                alt="Link preview"
                className="mt-3 max-h-48 w-full rounded-lg object-cover"
              />
            )}
          </div>
        )}

        {/* Image */}
        {postType === "image" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Image</label>
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
              <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white dark:text-zinc-400 dark:file:bg-zinc-100 dark:file:text-zinc-900"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  {uploading ? "Uploading…" : "Image up to 4MB"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div>
          <label htmlFor="body" className="mb-1.5 block text-sm font-medium">
            Text{" "}
            {postType !== "text" && (
              <span className="font-normal text-zinc-400">(optional)</span>
            )}
          </label>
          <textarea
            id="body"
            rows={postType === "text" ? 6 : 3}
            maxLength={40000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              postType === "text"
                ? "Write your post..."
                : "Add more context if you want..."
            }
            className="w-full resize-y rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        {/* NSFW */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={nsfw}
            onChange={(e) => setNsfw(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <span>NSFW</span>
        </label>

        <button
          type="submit"
          disabled={loading || uploading || !selected || !title.trim()}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
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
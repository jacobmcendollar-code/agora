"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useToast } from "@/components/toast-provider";
import { useNsfw } from "@/components/nsfw-provider";

type Community = {
  name: string;
  title: string;
  nsfw?: boolean;
};

type PostType = "text" | "link" | "image";

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:placeholder:text-zinc-500";

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

function isXUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return (
      u.hostname.includes("x.com") || u.hostname.includes("twitter.com")
    );
  } catch {
    return value.includes("x.com") || value.includes("twitter.com");
  }
}

function SubmitForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("community") || "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const communityBoxRef = useRef<HTMLDivElement>(null);
  const titleAutoFilledForUrl = useRef<string | null>(null);
  const { toast } = useToast();
  const { showNsfw, ready: nsfwReady } = useNsfw();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [filtered, setFiltered] = useState<Community[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(preselected);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [postType, setPostType] = useState<PostType>("link");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [titleLoading, setTitleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const visibleCommunities = communities.filter((c) => showNsfw || !c.nsfw);

  useEffect(() => {
    fetch("/api/communities")
      .then((r) => r.json())
      .then((data: Community[]) => {
        setCommunities(data);
        if (preselected) {
          const match = data.find((c) => c.name === preselected);
          if (match && (showNsfw || !match.nsfw)) {
            setSelected(match.name);
            setSelectedTitle(match.title);
            setQuery("");
          }
        }
      })
      .catch(() => {});
  }, [preselected, showNsfw]);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (!communityBoxRef.current) return;
      if (!communityBoxRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered, showDropdown]);

  useEffect(() => {
    if (postType !== "link" || !url.trim()) {
      setPreviewThumb(null);
      setTitleLoading(false);
      setPreviewLoading(false);
      return;
    }

    const trimmedUrl = url.trim();
    const skipTitleSuggest = isXUrl(trimmedUrl);
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (!skipTitleSuggest) setTitleLoading(true);
      setPreviewLoading(true);
      try {
        const res = await fetch(
          `/api/link-preview?url=${encodeURIComponent(trimmedUrl)}`
        );
        const data = await res.json();
        if (cancelled) return;
        setPreviewThumb(data.thumbnail || null);
        if (
          !skipTitleSuggest &&
          data.title &&
          titleAutoFilledForUrl.current !== trimmedUrl &&
          !title.trim()
        ) {
          setTitle(data.title);
          titleAutoFilledForUrl.current = trimmedUrl;
        }
      } catch {
        if (!cancelled) setPreviewThumb(null);
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
  }, [url, postType]);

  useEffect(() => {
    if (!url.trim()) {
      titleAutoFilledForUrl.current = null;
    }
  }, [url]);

  const uploadImageFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        if (!file.type.startsWith("image/")) {
          setError("File must be an image");
          toast("File must be an image", "error");
          return;
        }
        if (file.size > 4 * 1024 * 1024) {
          setError("Image must be under 4MB");
          toast("Image must be under 4MB", "error");
          return;
        }
        const fileData = await fileToBase64(file);
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name || "pasted-image.png",
            fileType: file.type,
            fileData,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Upload failed");
          toast(data.error || "Upload failed", "error");
        } else {
          setImageUrl(data.url);
          toast("Image uploaded");
        }
      } catch {
        setError("Upload failed");
        toast("Upload failed", "error");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [toast]
  );

  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      if (postType !== "image" || imageUrl || uploading) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) await uploadImageFile(file);
          break;
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [postType, imageUrl, uploading, uploadImageFile]);

  function handleSearch(value: string) {
    setQuery(value);
    const trimmed = value.trim();
    if (trimmed.length < 1) {
      setFiltered([]);
      setShowDropdown(false);
      return;
    }
    const lower = trimmed.toLowerCase();
    const matches = visibleCommunities.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.name.toLowerCase().includes(lower)
    );
    setFiltered(matches);
    setShowDropdown(true);
  }

  function selectCommunity(community: Community) {
    setSelected(community.name);
    setSelectedTitle(community.title);
    setQuery("");
    setFiltered([]);
    setShowDropdown(false);
    setHighlightIndex(0);
  }

  function clearCommunity() {
    setSelected("");
    setSelectedTitle("");
    setQuery("");
    setFiltered([]);
    setShowDropdown(false);
  }

  function handleCommunityKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const choice = filtered[highlightIndex];
      if (choice) selectCommunity(choice);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowDropdown(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImageFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selected) {
      setError("Please select a community");
      toast("Please select a community", "error");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title");
      toast("Please enter a title", "error");
      return;
    }
    if (postType === "link" && !url.trim()) {
      setError("Please enter a link");
      toast("Please enter a link", "error");
      return;
    }
    if (postType === "image" && !imageUrl) {
      setError("Please upload an image");
      toast("Please upload an image", "error");
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
          body: postType === "link" ? null : body.trim() || null,
          url: postType === "link" ? url.trim() || null : null,
          imageUrl: postType === "image" ? imageUrl : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create post");
        toast(data.error || "Failed to create post", "error");
        setLoading(false);
        return;
      }
      toast("Post created");
      router.push(`/c/${selected}/posts/${data.id}`);
    } catch {
      setError("Something went wrong");
      toast("Something went wrong", "error");
      setLoading(false);
    }
  }

  if (status === "loading" || !nsfwReady) {
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
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
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
        className="space-y-5 rounded-xl border border-stone-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#161618] sm:p-6"
      >
        {error && (
          <div className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="relative" ref={communityBoxRef}>
          <label className="mb-1.5 block text-sm font-medium">Community</label>
          {selected ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-stone-50 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800">
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
                onFocus={() => {
                  if (query.trim().length >= 1 && filtered.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                onKeyDown={handleCommunityKeyDown}
                placeholder="Search communities..."
                autoComplete="off"
                role="combobox"
                aria-expanded={showDropdown}
                aria-autocomplete="list"
                className={inputClass}
              />
              {showDropdown && filtered.length > 0 && (
                <div
                  className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-stone-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                  role="listbox"
                >
                  {filtered.map((c, index) => (
                    <button
                      key={c.name}
                      type="button"
                      role="option"
                      aria-selected={index === highlightIndex}
                      onClick={() => selectCommunity(c)}
                      onMouseEnter={() => setHighlightIndex(index)}
                      className={`block w-full px-3 py-2.5 text-left text-sm ${
                        index === highlightIndex
                          ? "bg-stone-100 dark:bg-zinc-800"
                          : "hover:bg-stone-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {c.title}
                      {c.nsfw && (
                        <span className="ml-2 text-xs font-medium text-rose-500">
                          Adult
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Type</label>
          <div className="flex gap-1 rounded-xl border border-stone-300 p-1 dark:border-zinc-700">
            {types.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setPostType(t.key)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  postType === t.key
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

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
            className={inputClass}
          />
          {titleLoading && (
            <p className="mt-1 text-xs text-zinc-500">Fetching title…</p>
          )}
        </div>

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
              className={inputClass}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Add discussion in the comments after posting.
            </p>
            {previewLoading && (
              <p className="mt-1 text-xs text-zinc-500">Loading preview…</p>
            )}
            {previewThumb && (
              <img
                src={previewThumb}
                alt="Link preview"
                className="mt-3 max-h-48 w-full rounded-xl object-cover"
              />
            )}
          </div>
        )}

        {postType === "image" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Image</label>
            {imageUrl ? (
              <div className="space-y-2">
                <img
                  src={imageUrl}
                  alt="Upload preview"
                  className="max-h-52 w-full rounded-xl object-cover"
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
              <div className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center dark:border-zinc-700">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white dark:text-zinc-400"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  {uploading
                    ? "Uploading…"
                    : "Upload a file, or paste an image (Ctrl/Cmd+V)"}
                </p>
              </div>
            )}
          </div>
        )}

        {(postType === "text" || postType === "image") && (
          <div>
            <label htmlFor="body" className="mb-1.5 block text-sm font-medium">
              Text <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <textarea
              id="body"
              rows={postType === "text" ? 6 : 3}
              maxLength={40000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                postType === "text"
                  ? "Add more detail if you want..."
                  : "Add a caption if you want..."
              }
              className={`${inputClass} resize-y`}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || uploading || !selected || !title.trim()}
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Posting…" : "Post"}
        </button>
      </form>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense
      fallback={<div className="py-12 text-center text-zinc-500">Loading…</div>}
    >
      <SubmitForm />
    </Suspense>
  );
}
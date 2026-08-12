"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/toast-provider";

type Props = {
  postId: string;
  communityName: string;
  parentId?: string;
  onSuccess?: () => void;
};

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

function ImageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[18px] w-[18px] fill-none stroke-current"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M21 16l-5-5-9 9" />
    </svg>
  );
}

export function CommentForm({
  postId,
  communityName,
  parentId,
  onSuccess,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!session) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-zinc-500">
        <Link href="/login" className="underline">
          Log in
        </Link>{" "}
        to comment
      </div>
    );
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      toast("Only image files are allowed", "error");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Image must be under 4MB");
      toast("Image must be under 4MB", "error");
      return;
    }

    setError(null);
    setUploading(true);
    try {
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
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Upload failed");
        toast(json.error || "Upload failed", "error");
        return;
      }
      setImageUrl(json.url);
    } catch {
      setError("Upload failed");
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && !imageUrl) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          body: body.trim() || null,
          parentId: parentId || null,
          imageUrl,
          communityName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to post comment");
        toast(data.error || "Failed to post comment", "error");
        setLoading(false);
        return;
      }
      setBody("");
      clearImage();
      toast(parentId ? "Reply posted" : "Comment posted");
      router.refresh();
      onSuccess?.();
    } catch {
      setError("Something went wrong");
      toast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="relative overflow-hidden rounded-md border border-zinc-300 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-400/40 dark:border-zinc-700 dark:focus-within:border-zinc-500">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={10000}
          placeholder={parentId ? "Write a reply..." : "What are your thoughts?"}
          className="w-full resize-y border-0 bg-transparent px-3 pb-2 pt-2.5 pr-10 text-sm outline-none dark:bg-transparent"
        />

        {imageUrl && (
          <div className="relative mb-9 ml-3 mr-3 inline-block max-w-[calc(100%-1.5rem)]">
            <img
              src={imageUrl}
              alt="Comment attachment"
              className="max-h-40 max-w-full rounded-md border border-zinc-300 object-contain dark:border-zinc-700"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-sm leading-none text-white hover:bg-black/90"
              title="Remove image"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          title={uploading ? "Uploading…" : "Add image"}
          aria-label={uploading ? "Uploading…" : "Add image"}
        >
          <ImageIcon />
        </button>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || uploading || (!body.trim() && !imageUrl)}
          className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Posting…" : parentId ? "Reply" : "Comment"}
        </button>
      </div>
    </form>
  );
}
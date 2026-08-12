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
  const [focused, setFocused] = useState(false);

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
    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be under 8MB");
      toast("Image must be under 8MB", "error");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const data = await fileToBase64(file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          data,
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
      setImageUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={3}
        maxLength={10000}
        placeholder={parentId ? "Write a reply..." : "What are your thoughts?"}
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
      />

      {imageUrl ? (
        <div className="relative inline-block">
          <img
            src={imageUrl}
            alt="Comment attachment"
            className="max-h-40 rounded-md border object-contain dark:border-zinc-700"
          />
          <button
            type="button"
            onClick={() => {
              setImageUrl(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="absolute right-1 top-1 rounded bg-black/70 px-2 py-0.5 text-xs text-white hover:bg-black"
          >
            Remove
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
            }}
            className="block w-full text-sm text-zinc-500 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white dark:file:bg-zinc-100 dark:file:text-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500">
            {uploading ? "Uploading…" : "Optional · one image, max 8MB"}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={`text-xs text-zinc-500 transition-opacity ${
            focused || body ? "opacity-100" : "opacity-0"
          }`}
        >
          Supports <span className="font-semibold text-zinc-400">bold</span>,{" "}
          <span className="italic text-zinc-400">italic</span>, lists, quotes,
          and links
        </p>
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
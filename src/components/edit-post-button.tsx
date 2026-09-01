"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { MarkdownBody } from "@/components/markdown-body";

const ONE_HOUR_MS = 60 * 60 * 1000;

const fieldClass =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:placeholder:text-zinc-500";

type PostEditContextValue = {
  editing: boolean;
  canShowEdit: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: (e?: FormEvent) => void;
  title: string;
  setTitle: (value: string) => void;
  body: string;
  setBody: (value: string) => void;
  displayTitle: string;
  displayBody: string | null;
  canEditBody: boolean;
  loading: boolean;
  error: string | null;
};

const PostEditContext = createContext<PostEditContextValue | null>(null);

function usePostEdit() {
  const ctx = useContext(PostEditContext);
  if (!ctx) {
    throw new Error("Post edit components must be used within PostEditProvider");
  }
  return ctx;
}

function withinEditWindow(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() <= ONE_HOUR_MS;
}

type ProviderProps = {
  postId: string;
  initialTitle: string;
  initialBody: string | null;
  createdAt: string;
  canEdit: boolean;
  canEditBody: boolean;
  children: ReactNode;
};

export function PostEditProvider({
  postId,
  initialTitle,
  initialBody,
  createdAt,
  canEdit,
  canEditBody,
  children,
}: ProviderProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody || "");
  const [displayTitle, setDisplayTitle] = useState(initialTitle);
  const [displayBody, setDisplayBody] = useState<string | null>(initialBody);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initialTitle);
    setBody(initialBody || "");
    setDisplayTitle(initialTitle);
    setDisplayBody(initialBody);
  }, [initialTitle, initialBody]);

  const canShowEdit = canEdit && !editing && withinEditWindow(createdAt);

  const startEdit = useCallback(() => {
    if (!canEdit || !withinEditWindow(createdAt)) return;
    setTitle(displayTitle);
    setBody(displayBody || "");
    setError(null);
    setEditing(true);
  }, [canEdit, createdAt, displayTitle, displayBody]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setTitle(displayTitle);
    setBody(displayBody || "");
    setError(null);
  }, [displayTitle, displayBody]);

  const saveEdit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const nextTitle = title.trim();
      if (!nextTitle || loading) return;

      setLoading(true);
      setError(null);

      try {
        const payload: { title: string; body?: string | null } = {
          title: nextTitle,
        };
        // Link/image/media posts: title only. Sending body:null would wipe
        // fetched link descriptions stored on the post.
        if (canEditBody) {
          payload.body = body.trim() || null;
        }

        const res = await fetch(`/api/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to save");
          setLoading(false);
          return;
        }

        setDisplayTitle(nextTitle);
        if (canEditBody) {
          setDisplayBody(body.trim() || null);
        }
        setEditing(false);
        router.refresh();
      } catch {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [title, body, canEditBody, loading, postId, router]
  );

  return (
    <PostEditContext.Provider
      value={{
        editing,
        canShowEdit,
        startEdit,
        cancelEdit,
        saveEdit,
        title,
        setTitle,
        body,
        setBody,
        displayTitle,
        displayBody,
        canEditBody,
        loading,
        error,
      }}
    >
      {children}
    </PostEditContext.Provider>
  );
}

export function EditablePostContent({ children }: { children: ReactNode }) {
  const {
    editing,
    canEditBody,
    title,
    setTitle,
    body,
    setBody,
    displayTitle,
    displayBody,
    saveEdit,
    cancelEdit,
    loading,
    error,
  } = usePostEdit();
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) titleRef.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <>
        <h1 className="text-2xl font-bold leading-tight">{displayTitle}</h1>
        {children}
        {canEditBody && displayBody ? (
          <div className="mt-4 text-zinc-800 dark:text-zinc-200">
            <MarkdownBody text={displayBody} className="text-base" />
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <form onSubmit={saveEdit} className="space-y-3">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
          required
          aria-label="Post title"
          className={`${fieldClass} text-2xl font-bold leading-tight`}
        />
        {canEditBody ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            maxLength={40000}
            aria-label="Post text"
            className={`${fieldClass} resize-y text-base leading-relaxed`}
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            disabled={loading}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <span className="text-xs text-zinc-500">1 hour from posting</span>
        </div>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </form>
      {canEditBody ? null : children}
    </>
  );
}

export function EditPostButton() {
  const { canShowEdit, startEdit } = usePostEdit();
  if (!canShowEdit) return null;

  return (
    <button
      type="button"
      onClick={startEdit}
      className="text-xs text-zinc-500 hover:underline"
    >
      Edit
    </button>
  );
}

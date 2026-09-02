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

type CommentEditContextValue = {
  editing: boolean;
  canShowEdit: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: (e?: FormEvent) => void;
  body: string;
  setBody: (value: string) => void;
  displayBody: string;
  loading: boolean;
  error: string | null;
};

const CommentEditContext = createContext<CommentEditContextValue | null>(null);

function useCommentEdit() {
  const ctx = useContext(CommentEditContext);
  if (!ctx) {
    throw new Error(
      "Comment edit components must be used within CommentEditProvider"
    );
  }
  return ctx;
}

function withinEditWindow(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() <= ONE_HOUR_MS;
}

type ProviderProps = {
  commentId: string;
  initialBody: string;
  createdAt: string;
  canEdit: boolean;
  children: ReactNode;
};

export function CommentEditProvider({
  commentId,
  initialBody,
  createdAt,
  canEdit,
  children,
}: ProviderProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(initialBody);
  const [displayBody, setDisplayBody] = useState(initialBody);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBody(initialBody);
    setDisplayBody(initialBody);
  }, [initialBody]);

  const canShowEdit = canEdit && !editing && withinEditWindow(createdAt);

  const startEdit = useCallback(() => {
    if (!canEdit || !withinEditWindow(createdAt)) return;
    setBody(displayBody);
    setError(null);
    setEditing(true);
  }, [canEdit, createdAt, displayBody]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setBody(displayBody);
    setError(null);
  }, [displayBody]);

  const saveEdit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const nextBody = body.trim();
      if (!nextBody || loading) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/comments/${commentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: nextBody }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to save");
          setLoading(false);
          return;
        }

        setDisplayBody(nextBody);
        setEditing(false);
        router.refresh();
      } catch {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [body, loading, commentId, router]
  );

  return (
    <CommentEditContext.Provider
      value={{
        editing,
        canShowEdit,
        startEdit,
        cancelEdit,
        saveEdit,
        body,
        setBody,
        displayBody,
        loading,
        error,
      }}
    >
      {children}
    </CommentEditContext.Provider>
  );
}

export function EditableCommentContent({ children }: { children?: ReactNode }) {
  const {
    editing,
    body,
    setBody,
    displayBody,
    saveEdit,
    cancelEdit,
    loading,
    error,
  } = useCommentEdit();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) bodyRef.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <>
        {displayBody ? <MarkdownBody text={displayBody} /> : null}
        {children ? (
          <div className={displayBody ? "mt-2" : ""}>{children}</div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <form onSubmit={saveEdit} className="space-y-2">
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={10000}
          required
          aria-label="Comment text"
          className={`${fieldClass} resize-y text-sm leading-relaxed`}
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="submit"
            disabled={loading || !body.trim()}
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
      {children ? <div className="mt-2">{children}</div> : null}
    </>
  );
}

export function CommentReplySlot({ children }: { children: ReactNode }) {
  const { editing } = useCommentEdit();
  if (editing) return null;
  return <>{children}</>;
}

export function EditCommentButton() {
  const { canShowEdit, startEdit } = useCommentEdit();
  if (!canShowEdit) return null;

  return (
    <>
      <span>•</span>
      <button
        type="button"
        onClick={startEdit}
        className="text-xs text-zinc-500 hover:underline"
      >
        Edit
      </button>
    </>
  );
}

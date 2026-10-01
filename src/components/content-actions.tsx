"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BLOCK_CONFIRM, UNBLOCK_CONFIRM } from "@/lib/block-copy";
import { REPORT_REASONS, type ReportReason, type ReportTargetType } from "@/lib/reports";
import { useToast } from "@/components/toast-provider";

type Props = {
  targetType: ReportTargetType;
  targetId: string;
  authorId: string;
  authorUsername: string;
  initialBlocked?: boolean;
  canBlock?: boolean;
};

export function ContentActions({
  targetType,
  targetId,
  authorId,
  authorUsername,
  initialBlocked = false,
  canBlock = true,
}: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [blocking, setBlocking] = useState(false);

  const viewerId = session?.user?.id;
  const isSelf = Boolean(viewerId && viewerId === authorId);
  const showBlock = canBlock && !isSelf && authorUsername !== "[deleted]";

  useEffect(() => {
    setBlocked(initialBlocked);
  }, [initialBlocked]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setReporting(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function requireUser() {
    if (status === "loading") return false;
    if (!session?.user?.id) {
      router.push("/login");
      return false;
    }
    return true;
  }

  async function blockUser(next: boolean) {
    if (!requireUser()) return;
    const ok = window.confirm(next ? BLOCK_CONFIRM : UNBLOCK_CONFIRM);
    if (!ok) return;
    setBlocking(true);
    try {
      const res = await fetch("/api/mute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: authorId, action: next ? "block" : "unblock" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Something went wrong", "error");
        return;
      }
      setBlocked(Boolean(data.blocked));
      setOpen(false);
      setThanks(false);
      setReporting(false);
      toast(data.blocked ? `Blocked ${authorUsername}` : `Unblocked ${authorUsername}`);
      router.refresh();
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setBlocking(false);
    }
  }

  async function submitReport() {
    if (!requireUser()) return;
    setSending(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          note: note.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Could not send report", "error");
        return;
      }
      setThanks(true);
    } catch {
      toast("Could not send report", "error");
    } finally {
      setSending(false);
    }
  }

  function closeReport() {
    setReporting(false);
    setThanks(false);
    setNote("");
    setReason(REPORT_REASONS[0]);
  }

  if (isSelf) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="rounded px-1.5 py-0.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        ···
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-1 w-36 rounded-md border bg-white py-1 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
            onClick={() => {
              if (!requireUser()) return;
              setOpen(false);
              setReporting(true);
            }}
          >
            Report
          </button>
          {showBlock && (
            <button
              type="button"
              role="menuitem"
              disabled={blocking}
              className="block w-full px-3 py-2 text-left hover:bg-zinc-50 disabled:opacity-50 dark:hover:bg-zinc-800"
              onClick={() => void blockUser(!blocked)}
            >
              {blocked ? "Unblock" : "Block"}
            </button>
          )}
        </div>
      )}

      {reporting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${menuId}-title`}
            className="w-full max-w-md rounded-xl border bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            {thanks ? (
              <div className="space-y-4">
                <h2 id={`${menuId}-title`} className="text-lg font-semibold">
                  Thanks, we&apos;ll take a look
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Reporting does not hide the content. You can block this user if
                  you don&apos;t want to see them.
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  {showBlock && !blocked && (
                    <button
                      type="button"
                      disabled={blocking}
                      onClick={() => void blockUser(true)}
                      className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                    >
                      Block this user
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeReport}
                    className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitReport();
                }}
              >
                <h2 id={`${menuId}-title`} className="text-lg font-semibold">
                  Report
                </h2>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Reason</legend>
                  {REPORT_REASONS.map((item) => (
                    <label key={item} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`${menuId}-reason`}
                        value={item}
                        checked={reason === item}
                        onChange={() => setReason(item)}
                      />
                      {item}
                    </label>
                  ))}
                </fieldset>
                <label className="block text-sm">
                  <span className="font-medium">Note (optional)</span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={2000}
                    rows={3}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeReport}
                    className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:underline dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {sending ? "Sending…" : "Submit report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

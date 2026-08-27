"use client";

import { useState } from "react";
import { useToast } from "@/components/toast-provider";

type Props = {
  initialValue: boolean;
};

export function PromotionalEmailsToggle({ initialValue }: Props) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    try {
      const res = await fetch("/api/user/promotional-emails", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotionalEmails: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEnabled(!next);
        toast(data.error || "Could not update email preference", "error");
        return;
      }
      toast(next ? "Opted in to product emails" : "Opted out of product emails");
    } catch {
      setEnabled(!next);
      toast("Could not update email preference", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className="flex items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">Product emails</span>
        <span className="mt-1 block text-xs text-zinc-500">
          Occasional updates about Agora. Account recovery email is always on.
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Product emails"
        disabled={saving}
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
          enabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}


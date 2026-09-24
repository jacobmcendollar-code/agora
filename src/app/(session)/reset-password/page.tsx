"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!token || !email) {
      setError("Reset link is invalid");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not reset password");
        setLoading(false);
        return;
      }

      router.push("/login?reset=1");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  if (!token || !email) {
    return (
      <div className="mx-auto max-w-md space-y-4 pt-12 text-center">
        <h1 className="text-2xl font-bold">Invalid reset link</h1>
        <p className="text-sm text-zinc-500">
          This link is missing information or is no longer valid.
        </p>
        <Link href="/forgot-password" className="underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pt-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <p className="mt-2 text-sm text-zinc-500">{email}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-white p-6 shadow-sm dark:bg-zinc-900"
      >
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm font-medium">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
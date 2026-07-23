"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setMessage(
          data.message || "If that email exists, we sent a reset link."
        );
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pt-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Enter your account email and we’ll send a reset link.
        </p>
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
        {message && (
          <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {message}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600">
        <Link href="/login" className="font-medium underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
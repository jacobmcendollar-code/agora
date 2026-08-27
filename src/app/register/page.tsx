"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const username = (form.get("username") as string).trim().toLowerCase();
    const email = (form.get("email") as string).trim().toLowerCase();
    const password = form.get("password") as string;
    const promotionalEmails = form.get("promotionalEmails") === "on";

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, promotionalEmails }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto login after register
      router.push("/login?registered=1");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pt-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Pseudonymous by design. Your username is your public identity.
          Email is used for account recovery, and for optional product emails
          if you opt in. It is never shown.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm dark:bg-zinc-900">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            minLength={3}
            maxLength={32}
            pattern="[a-zA-Z0-9_]+"
            placeholder="choose_a_username"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />
          <p className="mt-1 text-xs text-zinc-500">3–32 characters, letters, numbers, underscores</p>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email (private)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Used for account recovery. Never shown on your profile.
          </p>
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-950"
          />
        </div>

        <label
          htmlFor="promotionalEmails"
          className="flex cursor-pointer items-start gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-700"
        >
          <input
            id="promotionalEmails"
            name="promotionalEmails"
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm">
            <span className="font-medium">Send me product emails</span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              Occasional updates about Agora. Optional — leave unchecked if you
              only want account-recovery email. You can change this later in{" "}
              <Link href="/settings" className="underline" onClick={(e) => e.stopPropagation()}>
                Settings
              </Link>
              .
            </span>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

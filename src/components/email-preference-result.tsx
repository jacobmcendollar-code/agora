import Link from "next/link";

type Props = {
  ok: boolean;
  title: string;
  body: string;
};

export function EmailPreferenceResult({ ok, title, body }: Props) {
  return (
    <div className="mx-auto max-w-md space-y-6 pt-12 text-center">
      <div className="rounded-xl border border-stone-200/90 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-[#161618]">
        <p
          className={`mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
            ok
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
          aria-hidden
        >
          {ok ? "✓" : "!"}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {body}
        </p>
      </div>
      <p className="text-sm text-zinc-500">
        <Link
          href="/"
          className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          Back to Agora
        </Link>
        {" · "}
        <Link href="/settings" className="hover:underline">
          Email settings
        </Link>
      </p>
    </div>
  );
}


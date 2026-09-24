import Link from "next/link";

export const metadata = {
  title: "About",
  description: "What Agora is and how it works",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl py-10 sm:py-14">
      {/* Hero */}
      <header className="mb-12 border-b border-stone-200/80 pb-10 dark:border-zinc-800">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-4xl">
          About Agora
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
          Agora is a place for open discussion. It is built around the idea that
          adults should be able to talk freely, with as little interference as
          possible.
        </p>
      </header>

      <div className="space-y-6">
        <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#161618] sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-xl">
            Free speech first
          </h2>
          <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">
            The default is that speech is allowed. We do not try to shape culture,
            enforce political orthodoxy, or protect people from ideas they dislike.
            Disagreement, criticism, and unpopular opinions are expected.
          </p>
        </section>

        <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#161618] sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-xl">
            Light moderation
          </h2>
          <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">
            Moderation is intentionally minimal. An AI checks new posts and comments
            for a narrow set of problems:
          </p>
          <ul className="mt-4 space-y-2.5">
            {[
              "Spam and obvious scams",
              "Content that is completely off-topic for the community it was posted in",
              "Content that is clearly illegal",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-zinc-700 dark:text-zinc-300">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                  aria-hidden
                />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
            It does not police tone, politics, or ideology. If something is legal
            and roughly on-topic, it should stay up.
          </p>
        </section>

        <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#161618] sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-xl">
            Community ranking, not personal clout
          </h2>
          <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">
            Posts rise or fall based on how the community votes. We show vote
            scores on posts so people can see what is resonating. We deliberately
            avoid heavy personal scoreboards and creator branding that turn
            discussion into a popularity contest.
          </p>
        </section>

        <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#161618] sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-xl">
            How to use it well
          </h2>
          <ul className="mt-4 space-y-2.5">
            {[
              "Post in the community that best matches the topic",
              "Vote on what you find valuable or interesting",
              "Reply when you have something worth saying",
              "Don’t spam, and don’t try to game the system",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-zinc-700 dark:text-zinc-300">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                  aria-hidden
                />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#161618] sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-xl">
            This is an early version
          </h2>
          <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">
            Agora is still being built. Features will change. The core idea will
            not: a public square where people can speak with minimal interference.
          </p>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-stone-200/80 pt-8 dark:border-zinc-800">
        <Link
          href="/communities"
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Browse communities
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
import Link from "next/link";

export const metadata = {
  title: "About · Agora",
  description: "What Agora is and how it works",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">About Agora</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Agora is a place for open discussion. It is built around the idea that
          adults should be able to talk freely, with as little interference as
          possible.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Free speech first</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          The default is that speech is allowed. We do not try to shape culture,
          enforce political orthodoxy, or protect people from ideas they dislike.
          Disagreement, criticism, and unpopular opinions are expected.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Light moderation</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          Moderation is intentionally minimal. An AI checks new posts and comments
          for a narrow set of problems:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
          <li>Spam and obvious scams</li>
          <li>Content that is completely off-topic for the community it was posted in</li>
        </ul>
        <p className="text-zinc-700 dark:text-zinc-300">
          It does not police tone, politics, or ideology. If something is legal
          and roughly on-topic, it should stay up.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Community ranking, not personal clout</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          Posts rise or fall based on how the community votes. We show vote
          scores on posts so people can see what is resonating. We deliberately
          avoid heavy personal scoreboards and creator branding that turn
          discussion into a popularity contest.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How to use it well</h2>
        <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
          <li>Post in the community that best matches the topic</li>
          <li>Vote on what you find valuable or interesting</li>
          <li>Reply when you have something worth saying</li>
          <li>Don’t spam, and don’t try to game the system</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">This is an early version</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          Agora is still being built. Features will change. The core idea will not:
          a public square where people can speak with minimal interference.
        </p>
      </section>

      <div className="pt-4">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
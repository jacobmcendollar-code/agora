import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Support · Agora",
  description: "Get help with your Agora account, reports, and blocks.",
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Questions about your account, a post, or the app? Email{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Delete your account
          </h2>
          <p>
            Open{" "}
            <Link href="/settings" className="text-emerald-500 hover:underline">
              Settings
            </Link>{" "}
            and choose Delete account. In the iOS app, it is under Settings as
            well. You can also email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-emerald-500 hover:underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            and ask us to delete it.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Report a post, comment, or profile
          </h2>
          <p>
            Open the ··· menu on a post, comment, or profile and choose Report.
            Pick a reason (illegal content, threat of violence, doxxing, targeted
            harassment, or spam) and add a note if you want. We review every
            report. Reporting does not hide the content.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Block someone
          </h2>
          <p>
            Use Block on their profile, or Block in the ··· menu on their post or
            comment. You will not see their posts or comments, and they cannot
            reply to or mention you. Manage the list under Blocked users in{" "}
            <Link href="/settings" className="text-emerald-500 hover:underline">
              Settings
            </Link>
            .
          </p>
        </section>
      </div>

      <p className="text-sm text-zinc-500">
        <Link href="/privacy" className="hover:underline">
          Privacy
        </Link>
        {" · "}
        <Link href="/terms" className="hover:underline">
          Terms
        </Link>
        {" · "}
        <Link href="/about" className="hover:underline">
          About Agora
        </Link>
      </p>
    </div>
  );
}

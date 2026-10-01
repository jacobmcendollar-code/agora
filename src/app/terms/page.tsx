import type { Metadata } from "next";
import Link from "next/link";
import { TERMS_EFFECTIVE_DATE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Use · Agora",
  description: "Terms of Use for agor4.com and the Agora app.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Terms of Use</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Effective date: {TERMS_EFFECTIVE_DATE}
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <p>
          These Terms are an agreement between you and Agora App LLC, a Missouri
          limited liability company (&quot;Agora,&quot; &quot;we,&quot; &quot;us&quot;),
          which operates agor4.com and the Agora app (the &quot;Service&quot;). By
          using the Service, you agree to these Terms. If you don&apos;t agree,
          please don&apos;t use it.
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            1. Free speech, with a few hard lines
          </h2>
          <p>
            Agora is built for open conversation. We don&apos;t remove posts
            because they are unpopular, offensive to some, or critical of anyone,
            including us. We do remove content, and may suspend or ban accounts,
            for:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Illegal content, including child sexual abuse material (CSAM), which
              we report to the authorities.
            </li>
            <li>Credible threats of violence against a person or group.</li>
            <li>
              Doxxing, meaning posting someone&apos;s private personal information
              (such as a home address, phone number, or financial details) without
              their consent.
            </li>
            <li>Targeted harassment of an individual.</li>
            <li>
              Spam, scams, and automated or bulk posting meant to manipulate the
              Service.
            </li>
          </ul>
          <p>We have zero tolerance for this content and for users who post it.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            2. Your controls and reporting
          </h2>
          <p>
            You decide what you see. You can mute or block any user, and that only
            changes your own experience. To report content or a user, use the
            report option in the app or email{" "}
            <a href="mailto:hello@agor4.com" className="text-emerald-500 hover:underline">
              hello@agor4.com
            </a>
            . We review reports and act on violations promptly. We may use
            automated tools to help review content.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            3. Age
          </h2>
          <p>
            You must be at least 17 to use Agora. Content marked as adult is only
            for users 18 and older, and by viewing it you confirm you are 18 or
            older.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            4. Your account and your content
          </h2>
          <p>
            You are responsible for your account and for what you post. You keep
            ownership of your content. By posting, you give Agora a non-exclusive,
            worldwide, royalty-free license to host, display, and distribute it as
            needed to run the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            5. Deleting your account
          </h2>
          <p>
            You can delete your account at any time in the app&apos;s settings or
            by emailing{" "}
            <a href="mailto:hello@agor4.com" className="text-emerald-500 hover:underline">
              hello@agor4.com
            </a>
            . When you delete your account, we remove your profile and posts from
            the Service, except where we must keep information to comply with the
            law or to handle a report.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            6. No warranty and limited liability
          </h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available,&quot;
            without warranties of any kind. Users&apos; posts are their own views,
            not Agora&apos;s. To the fullest extent allowed by law, Agora App LLC
            is not liable for indirect, incidental, or consequential damages, or
            for content posted by users, and our total liability to you will not
            exceed $100.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            7. Changes
          </h2>
          <p>
            We may update these Terms. If we make material changes, we&apos;ll
            post the new version here with a new effective date. If you keep using
            the Service after that, you accept the updated Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            8. Governing law
          </h2>
          <p>
            These Terms are governed by the laws of the State of Missouri, without
            regard to its conflict of law rules. Any dispute will be handled in
            the state or federal courts located in St. Louis County, Missouri.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            9. Contact
          </h2>
          <p>
            Agora App LLC, Ellisville, Missouri
            <br />
            <a href="mailto:hello@agor4.com" className="text-emerald-500 hover:underline">
              hello@agor4.com
            </a>
          </p>
        </section>
      </div>

      <p className="text-sm text-zinc-500">
        <Link href="/privacy" className="hover:underline">
          Privacy
        </Link>
        {" · "}
        <Link href="/support" className="hover:underline">
          Support
        </Link>
        {" · "}
        <Link href="/about" className="hover:underline">
          About Agora
        </Link>
      </p>
    </div>
  );
}

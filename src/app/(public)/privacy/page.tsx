import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · Agora",
  description: "How Agora collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Last updated: August 27, 2026
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <p>
          Agora (&quot;we&quot;, &quot;us&quot;, &quot;the site&quot;) is a discussion
          platform at{" "}
          <Link href="/" className="text-emerald-500 hover:underline">
            agor4.com
          </Link>
          . This policy explains what information we collect, how we use it, and
          your choices. By using Agora, you agree to this policy.
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            1. Information we collect
          </h2>
          <p>
            <strong className="text-zinc-900 dark:text-zinc-100">
              Account information.
            </strong>{" "}
            When you register, we store a username, email address, and a hashed
            password (we do not store your password in plain text). You may also
            add an optional profile image and short about text. Email is private
            and is never shown on your profile.
          </p>
          <p>
            <strong className="text-zinc-900 dark:text-zinc-100">
              Content you create.
            </strong>{" "}
            Posts, comments, votes, saved posts, community subscriptions, and
            similar activity are stored so the site can function.
          </p>
          <p>
            <strong className="text-zinc-900 dark:text-zinc-100">
              Preferences.
            </strong>{" "}
            Some settings (for example theme, NSFW visibility, or whether you
            opted in to product emails) may be stored in your account or in your
            browser.
          </p>
          <p>
            <strong className="text-zinc-900 dark:text-zinc-100">
              Technical data.
            </strong>{" "}
            Like most sites, our hosts may process IP address, browser type, and
            basic request logs needed to operate and secure the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            2. How we use information
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>To provide and maintain your account and the Agora service</li>
            <li>To show posts, comments, communities, and notifications</li>
            <li>
              To send account emails such as password reset messages. Your email
              is used for account recovery, and for optional product emails only
              if you opt in (at signup, in{" "}
              <Link href="/settings" className="text-emerald-500 hover:underline">
                Settings
              </Link>
              , or via a signed opt-in link).
            </li>
            <li>
              To apply light automated moderation (spam, off-topic, and illegal
              content checks)
            </li>
            <li>To prevent abuse, enforce bans, and keep the service reliable</li>
            <li>To improve performance and fix problems</li>
          </ul>
          <p>We do not sell your personal information.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            3. AI moderation
          </h2>
          <p>
            When you submit a post or comment, limited content (such as title and
            body, plus community context) may be sent to an automated moderation
            service so we can check for spam, pure off-topic noise, and illegal
            content. We use this for safety and usability, not to police opinions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            4. Service providers
          </h2>
          <p>
            We use trusted processors to run Agora. That typically includes:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Hosting and application infrastructure</li>
            <li>Database hosting</li>
            <li>Image upload / media storage</li>
            <li>
              Email delivery for account messages, and for product emails only if
              you have opted in
            </li>
            <li>Automated moderation (AI API)</li>
          </ul>
          <p>
            These providers process data only to provide their services to us,
            under their own security and privacy practices.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            5. Cookies and sessions
          </h2>
          <p>
            We use cookies or similar technologies to keep you logged in and to
            operate core features. These are necessary for the site to work as a
            signed-in product. If you clear cookies or use private browsing, you
            may need to log in again.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            6. Public information
          </h2>
          <p>
            Agora is a public discussion platform. Username, posts, comments, and
            similar public activity can be seen by other people on the site and
            may be indexed or shared outside Agora (for example when someone
            copies a link). Do not post information you want to keep private.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            7. NSFW content
          </h2>
          <p>
            Some communities or posts may be marked NSFW. You can choose whether
            to show NSFW content in your settings. That preference is used to
            filter what you see; it does not change the public nature of content
            you post.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            8. How long we keep data
          </h2>
          <p>
            We keep account and content data while your account is active and as
            needed to operate the service, handle abuse, and meet legal
            obligations. If you delete content within allowed windows, or if
            content is removed by moderation, residual copies may remain briefly
            in backups.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            9. Your choices
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Update profile information when those controls are available</li>
            <li>
              Opt in or out of product emails in{" "}
              <Link href="/settings" className="text-emerald-500 hover:underline">
                Settings
              </Link>{" "}
              (logged in), or via a signed opt-in / opt-out link
            </li>
            <li>Delete or soft-delete your own posts/comments under site rules</li>
            <li>Contact us to request account help or deletion</li>
            <li>Stop using the service and stop submitting content at any time</li>
          </ul>
          <p>
            Full self-serve account export/delete may be expanded over time. Until
            then, email support for account deletion requests.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            10. Children
          </h2>
          <p>
            Agora is not directed at children under 13, and we do not knowingly
            collect personal information from children under 13. If you believe a
            child has created an account, contact us and we will take appropriate
            steps.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            11. Security
          </h2>
          <p>
            We use reasonable technical measures to protect accounts and data
            (including hashed passwords and HTTPS). No method of transmission or
            storage is 100% secure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            12. Changes
          </h2>
          <p>
            We may update this policy as Agora changes. The &quot;Last
            updated&quot; date at the top will change when we do. Continued use
            after an update means you accept the revised policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            13. Contact
          </h2>
          <p>
            Questions about privacy or account data:{" "}
            <a
              href="mailto:hello@agor4.com"
              className="text-emerald-500 hover:underline"
            >
              hello@agor4.com
            </a>
            .
          </p>
        </section>
      </div>

      <p className="text-sm text-zinc-500">
        <Link href="/about" className="hover:underline">
          About Agora
        </Link>
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PromotionalEmailsToggle } from "@/components/promotional-emails-toggle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      promotionalEmails: true,
      username: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pt-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Email preferences for @{user.username}
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#161618]">
        <div>
          <p className="text-sm font-medium">Account email</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{user.email}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Private. Used for account recovery. Never shown on your profile.
          </p>
        </div>

        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <PromotionalEmailsToggle initialValue={user.promotionalEmails} />
        </div>
      </div>

      <p className="text-sm text-zinc-500">
        See the{" "}
        <Link
          href="/privacy"
          className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          privacy policy
        </Link>{" "}
        for how email is used.
      </p>
    </div>
  );
}


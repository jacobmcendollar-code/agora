import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PromotionalEmailsToggle } from "@/components/promotional-emails-toggle";
import { NsfwToggle } from "@/components/nsfw-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { BlockedUsers } from "@/components/blocked-users";
import { ensurePromotionalEmailsColumn } from "@/lib/ensure-promotional-emails-column";
import { ensureComplianceSchema } from "@/lib/ensure-compliance-schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await ensurePromotionalEmailsColumn();
  await ensureComplianceSchema();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      promotionalEmails: true,
      username: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    redirect("/login");
  }

  const blocks = await prisma.mute.findMany({
    where: { muterId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      muted: {
        select: { id: true, username: true, image: true, deletedAt: true },
      },
    },
  });
  const blockedUsers = blocks
    .filter((row) => !row.muted.deletedAt)
    .map((row) => ({
      id: row.muted.id,
      username: row.muted.username,
      image: row.muted.image,
    }));

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
        </Link>
        ,{" "}
        <Link
          href="/terms"
          className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          terms
        </Link>
        , and{" "}
        <Link
          href="/support"
          className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          support
        </Link>
        .
      </p>

      <div className="space-y-4 rounded-xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#161618]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium">Theme</p>
          <ThemeToggle />
        </div>

        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <NsfwToggle />
        </div>
      </div>

      <BlockedUsers initial={blockedUsers} />

      <div className="rounded-xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/60 dark:bg-[#161618]">
        <p className="text-sm font-medium">Delete account</p>
        <p className="mt-1 text-xs text-zinc-500">
          Permanently remove your profile and personal data. Posts and comments
          remain as [deleted] so threads stay intact.
        </p>
        <Link
          href="/settings/delete"
          className="mt-4 inline-block rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          Delete account
        </Link>
      </div>
    </div>
  );
}

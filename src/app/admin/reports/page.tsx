import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user?.username || !isAdmin(session.user.username)) {
    redirect("/");
  }

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      reporter: { select: { username: true, deletedAt: true } },
    },
  });

  const postIds = reports.filter((r) => r.targetType === "post").map((r) => r.targetId);
  const commentIds = reports.filter((r) => r.targetType === "comment").map((r) => r.targetId);
  const userIds = reports.filter((r) => r.targetType === "user").map((r) => r.targetId);

  const [posts, comments, users] = await Promise.all([
    postIds.length
      ? prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            title: true,
            community: { select: { name: true } },
          },
        })
      : [],
    commentIds.length
      ? prisma.comment.findMany({
          where: { id: { in: commentIds } },
          select: {
            id: true,
            post: { select: { id: true, community: { select: { name: true } } } },
          },
        })
      : [],
    userIds.length
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true },
        })
      : [],
  ]);

  const postById = new Map(posts.map((post) => [post.id, post]));
  const commentById = new Map(comments.map((comment) => [comment.id, comment]));
  const userById = new Map(users.map((user) => [user.id, user]));

  function targetLink(report: (typeof reports)[number]) {
    if (report.targetType === "post") {
      const post = postById.get(report.targetId);
      if (!post) return null;
      return { href: `/c/${post.community.name}/posts/${post.id}`, label: post.title };
    }
    if (report.targetType === "comment") {
      const comment = commentById.get(report.targetId);
      if (!comment) return null;
      return {
        href: `/c/${comment.post.community.name}/posts/${comment.post.id}#comment-${comment.id}`,
        label: "Comment",
      };
    }
    const user = userById.get(report.targetId);
    if (!user) return null;
    return { href: `/u/${user.username}`, label: `@${user.username}` };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {reports.length} shown · Admin only · Reports never hide content on their own
          </p>
        </div>
        <Link href="/admin/users" className="text-sm font-medium text-emerald-600 hover:underline">
          Users
        </Link>
      </div>

      <div className="overflow-x-auto overflow-hidden rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Reporter</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-500" colSpan={5}>
                  No reports yet.
                </td>
              </tr>
            ) : (
              reports.map((report) => {
                const link = targetLink(report);
                return (
                  <tr
                    key={report.id}
                    className="border-b align-top last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <td className="px-4 py-3 text-zinc-500">
                      {timeAgo(report.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {report.reporter.deletedAt ? (
                        <span className="text-zinc-400">[deleted]</span>
                      ) : (
                        <Link href={`/u/${report.reporter.username}`} className="font-medium hover:underline">
                          {report.reporter.username}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3">{report.reason}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs uppercase tracking-wide text-zinc-400">
                        {report.targetType}
                      </div>
                      {link ? (
                        <Link href={link.href} className="hover:underline">
                          {link.label}
                        </Link>
                      ) : (
                        <span className="text-zinc-400">{report.targetId}</span>
                      )}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {report.note || "(none)"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

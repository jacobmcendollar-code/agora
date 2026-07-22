import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/utils";
import { BanUserButton } from "@/components/ban-user-button";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.username || !isAdmin(session.user.username)) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      banned: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          comments: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {users.length} total · Admin only
        </p>
      </div>

      <div className="overflow-x-auto overflow-hidden rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Posts</th>
              <th className="px-4 py-3 font-medium">Comments</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/u/${user.username}`}
                    className="font-medium hover:underline"
                  >
                    {user.username}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {user.banned ? (
                    <span className="text-rose-600 dark:text-rose-400">Banned</span>
                  ) : (
                    <span className="text-zinc-500">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {user.createdAt.toLocaleDateString()} · {timeAgo(user.createdAt)}
                </td>
                <td className="px-4 py-3 text-zinc-500">{user._count.posts}</td>
                <td className="px-4 py-3 text-zinc-500">{user._count.comments}</td>
                <td className="px-4 py-3">
                  {user.id !== session.user.id && !isAdmin(user.username) && (
                    <BanUserButton
                      userId={user.id}
                      username={user.username}
                      initialBanned={user.banned}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
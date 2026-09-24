import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import {
  PostScreen,
  buildPostMetadata,
} from "@/components/post-screen";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ name: string; postId: string }>;
  searchParams: Promise<{ sort?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name, postId } = await params;
  const metadata = await buildPostMetadata(name, postId);
  return { ...metadata, robots: { index: false, follow: false } };
}

export default async function InternalPostPage({ params, searchParams }: Props) {
  const { name, postId } = await params;
  const sp = await searchParams;
  const sort = sp.sort === "newest" ? "newest" : "best";
  const session = await auth();
  return <PostScreen name={name} postId={postId} sort={sort} session={session} />;
}

import type { Metadata } from "next";
import {
  PostScreen,
  buildPostMetadata,
} from "@/components/post-screen";

export const dynamic = "force-static";
export const revalidate = 120;

type Props = {
  params: Promise<{ name: string; postId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name, postId } = await params;
  return buildPostMetadata(name, postId);
}

export default async function PostPage({ params }: Props) {
  const { name, postId } = await params;
  return (
    <PostScreen name={name} postId={postId} sort="best" session={null} />
  );
}

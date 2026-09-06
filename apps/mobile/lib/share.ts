import { Share } from "react-native";
import { postShareUrl } from "./api";

export async function sharePost(post: {
  id: string;
  title: string;
  community?: { name?: string };
}) {
  const url = postShareUrl(post);
  try {
    await Share.share({ message: url, url, title: post.title });
  } catch {
    // user cancelled
  }
}

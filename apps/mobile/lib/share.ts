import { Platform, Share } from "react-native";
import { postShareUrl } from "./api";

export async function sharePost(post: {
  id: string;
  title: string;
  community?: { name?: string };
}) {
  const url = postShareUrl(post);
  try {
    // iOS concatenates `message` + `url` (space-separated) when both are set,
    // so Copy Link / paste would show the same post URL twice.
    await Share.share(
      Platform.OS === "ios"
        ? { url, title: post.title }
        : { message: url, title: post.title },
    );
  } catch {
    // user cancelled
  }
}

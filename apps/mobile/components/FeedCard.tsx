import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { cachePost, commentCount } from "@/lib/api";
import { getYouTubeId, isTikTokLink, isXLink, openExternal } from "@/lib/media";
import { usePreferences } from "@/lib/preferences";
import { colors } from "@/lib/theme";
import type { FeedPost } from "@/lib/types";
import { IconComments } from "./Icons";
import { Thumb } from "./Thumb";
import { VoteSpears } from "./VoteSpears";

export function FeedCard({
  post,
  hideCommunity,
}: {
  post: FeedPost;
  hideCommunity?: boolean;
}) {
  const router = useRouter();
  const { openSocialInNativeApp } = usePreferences();
  const comments = commentCount(post);
  const discussion = post.community?.postFormat === "discussion";
  const youtubeId = getYouTubeId(post.url);

  function openPost() {
    cachePost(post);
    router.push(`/post/${post.id}`);
  }

  async function onThumb() {
    if (youtubeId) {
      openPost();
      return;
    }
    if (post.url && (isXLink(post.url) || isTikTokLink(post.url))) {
      await openExternal(post.url, openSocialInNativeApp);
      return;
    }
    if (post.url) {
      await openExternal(post.url, false);
      return;
    }
    openPost();
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <VoteSpears targetType="post" targetId={post.id} initialScore={post.score} />
        <Pressable onPress={onThumb} style={styles.thumbWrap}>
          <Thumb src={post.thumbnail} communityTitle={post.community.title} />
        </Pressable>
        <Pressable onPress={openPost} style={styles.body}>
          <Text style={styles.title}>{post.title}</Text>
          {discussion ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>Discussion</Text>
            </View>
          ) : null}
          <View style={styles.meta}>
            {!hideCommunity ? (
              <Pressable
                onPress={() => router.push(`/community/${post.community.name}`)}
                hitSlop={6}
              >
                <Text style={styles.community}>{post.community.title}</Text>
              </Pressable>
            ) : null}
            <View style={styles.comments}>
              <IconComments color={colors.muted} />
              <Text style={styles.commentCount}>{comments}</Text>
            </View>
            {post.nsfw ? <Text style={styles.nsfw}>NSFW</Text> : null}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  thumbWrap: { marginTop: 2 },
  body: { flex: 1, minHeight: 80, minWidth: 0 },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 21,
  },
  pill: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  meta: {
    marginTop: "auto",
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  community: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  comments: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  nsfw: {
    color: colors.rose,
    fontSize: 12,
    fontWeight: "700",
  },
});

import { useEffect, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  cachePost,
  commentCount,
  fetchSaved,
  postShareUrl,
  postSnippet,
  toggleSaved,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getYouTubeId, isGenericBody, isTikTokLink, isXLink, openExternal } from "@/lib/media";
import { usePreferences } from "@/lib/preferences";
import { colors } from "@/lib/theme";
import type { FeedPost } from "@/lib/types";
import { IconBookmark, IconComments, IconShare } from "./Icons";
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
  const { user } = useAuth();
  const { openSocialInNativeApp } = usePreferences();
  const comments = commentCount(post);
  const discussion = post.community?.postFormat === "discussion";
  const youtubeId = getYouTubeId(post.url);
  const snippet =
    post.body && !isGenericBody(post.body) ? postSnippet(post.body) : null;
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    let cancelled = false;
    fetchSaved(post.id)
      .then((next) => {
        if (!cancelled) setSaved(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [post.id, user]);

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

  async function onBookmark() {
    if (!user) {
      router.push("/login");
      return;
    }
    const previous = saved;
    setSaved(!previous);
    try {
      const data = await toggleSaved(post.id);
      setSaved(Boolean(data.saved));
    } catch {
      setSaved(previous);
    }
  }

  async function onShare() {
    const url = postShareUrl(post);
    try {
      await Share.share({ message: url, url, title: post.title });
    } catch {
      // user cancelled
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <VoteSpears targetType="post" targetId={post.id} initialScore={post.score} />
        <Pressable onPress={onThumb} style={styles.thumbWrap}>
          <Thumb src={post.thumbnail} communityTitle={post.community.title} />
        </Pressable>
        <View style={styles.body}>
          <Pressable onPress={openPost}>
            <Text style={styles.title}>{post.title}</Text>
            {discussion ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>Discussion</Text>
              </View>
            ) : null}
            {snippet ? (
              <Text style={styles.snippet} numberOfLines={2}>
                {snippet}
              </Text>
            ) : null}
          </Pressable>
          <View style={styles.meta}>
            <View style={styles.metaLeft}>
              {!hideCommunity ? (
                <Pressable
                  onPress={() => router.push(`/community/${post.community.name}`)}
                  hitSlop={6}
                >
                  <Text style={styles.community} numberOfLines={1}>
                    {post.community.title}
                  </Text>
                </Pressable>
              ) : post.nsfw ? (
                <Text style={styles.nsfw}>NSFW</Text>
              ) : null}
            </View>
            <View style={styles.actions}>
              <Pressable onPress={openPost} style={styles.action} hitSlop={6}>
                <IconComments color={colors.muted} />
                <Text style={styles.commentCount}>{comments}</Text>
              </Pressable>
              <Pressable
                onPress={onBookmark}
                hitSlop={6}
                accessibilityLabel={saved ? "Unsave post" : "Save post"}
              >
                <IconBookmark color={saved ? colors.emerald : colors.muted} filled={saved} />
              </Pressable>
              <Pressable onPress={onShare} hitSlop={6} accessibilityLabel="Share post">
                <IconShare color={colors.muted} />
              </Pressable>
              {!hideCommunity && post.nsfw ? <Text style={styles.nsfw}>NSFW</Text> : null}
            </View>
          </View>
        </View>
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
  snippet: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  metaLeft: { flex: 1, minWidth: 0 },
  community: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  action: {
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

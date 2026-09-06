import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { sharePost } from "@/lib/share";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import type { FeedPost } from "@/lib/types";
import { IconShare } from "./Icons";
import { Username } from "./Username";

type ShareStyle = "icon" | "labeled";

export function PostMetaRow({
  post,
  hideCommunity,
  share,
  actions,
  afterShare,
  style,
}: {
  post: FeedPost;
  hideCommunity?: boolean;
  share: ShareStyle;
  actions?: ReactNode;
  afterShare?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const communityLabel = post.community.title || post.community.name;

  return (
    <View style={[styles.row, style]}>
      <View style={styles.left}>
        {!hideCommunity ? (
          <Pressable
            onPress={() => router.push(`/community/${post.community.name}`)}
            hitSlop={6}
            accessibilityRole="link"
            accessibilityLabel={`${communityLabel} community`}
            style={styles.pill}
          >
            <Text style={styles.pillText} numberOfLines={1}>
              {communityLabel}
            </Text>
          </Pressable>
        ) : post.nsfw ? (
          <Text style={styles.nsfw}>NSFW</Text>
        ) : null}
        <View style={styles.authorTime}>
          <Username username={post.author.username} style={styles.author} />
          <Text style={styles.time}> · {timeAgo(post.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.right}>
        {actions}
        <Pressable
          onPress={() => void sharePost(post)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Share post"
          style={share === "labeled" ? styles.shareLabeled : undefined}
        >
          <IconShare color={colors.muted} />
          {share === "labeled" ? <Text style={styles.shareLabel}>Share</Text> : null}
        </Pressable>
        {afterShare}
      </View>
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
    },
    left: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    pill: {
      flexShrink: 1,
      maxWidth: "58%",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.emerald,
      backgroundColor: colors.chipActive,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    pillText: {
      color: colors.emerald,
      fontSize: 12,
      fontWeight: "600",
    },
    authorTime: {
      flexDirection: "row",
      alignItems: "center",
      flexShrink: 1,
      minWidth: 0,
    },
    author: {
      color: colors.muted,
      fontSize: 13,
    },
    time: {
      color: colors.muted,
      fontSize: 13,
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flexShrink: 0,
    },
    shareLabeled: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    shareLabel: {
      color: colors.muted,
      fontSize: 13,
    },
    nsfw: {
      color: colors.rose,
      fontSize: 12,
      fontWeight: "700",
    },
  });
}

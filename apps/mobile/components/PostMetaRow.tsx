import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { sharePost } from "@/lib/share";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import type { FeedPost } from "@/lib/types";
import { IconShare } from "./Icons";
import { Username } from "./Username";

/** Post detail only: emerald community pill + author · time + labeled Share. */
export function PostMetaRow({
  post,
  style,
}: {
  post: FeedPost;
  style?: StyleProp<ViewStyle>;
}) {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const communityLabel = post.community.title || post.community.name;
  const letter = (communityLabel.trim()[0] || "?").toUpperCase();

  return (
    <View style={[styles.row, style]}>
      <View style={styles.cluster}>
        <Pressable
          onPress={() => router.push(`/community/${post.community.name}`)}
          hitSlop={6}
          accessibilityRole="link"
          accessibilityLabel={`${communityLabel} community`}
          style={styles.pill}
        >
          <View style={styles.letterBox}>
            <Text style={styles.letter}>{letter}</Text>
          </View>
          <Text style={styles.pillText} numberOfLines={1} ellipsizeMode="tail">
            {communityLabel}
          </Text>
        </Pressable>
        <View style={styles.mid}>
          <Username username={post.author.username} style={styles.author} numberOfLines={1} />
          <Text style={styles.time}> · {timeAgo(post.createdAt)}</Text>
        </View>
      </View>
      <Pressable
        onPress={() => void sharePost(post)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Share post"
        style={styles.shareLabeled}
      >
        <IconShare color={colors.muted} />
        <Text style={styles.shareLabel}>Share</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    cluster: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      flexShrink: 1,
      maxWidth: "58%",
      minWidth: 0,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.emerald,
      backgroundColor: colors.chipActive,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    letterBox: {
      width: 14,
      height: 14,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.emerald,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    letter: {
      color: colors.emerald,
      fontSize: 9,
      fontWeight: "700",
      lineHeight: 11,
    },
    pillText: {
      color: colors.emerald,
      fontSize: 12,
      fontWeight: "600",
      flexShrink: 1,
      minWidth: 0,
    },
    mid: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
    },
    author: {
      color: colors.muted,
      fontSize: 13,
    },
    time: {
      color: colors.muted,
      fontSize: 13,
      flexShrink: 0,
    },
    shareLabeled: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      flexShrink: 0,
      marginLeft: 10,
    },
    shareLabel: {
      color: colors.muted,
      fontSize: 13,
    },
  });
}

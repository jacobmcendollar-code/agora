import { Pressable, Text, type StyleProp, type TextStyle } from "react-native";
import { useRouter } from "expo-router";

export function isDeletedUsername(username?: string | null) {
  return !username || username === "[deleted]";
}

export function Username({
  username,
  style,
  numberOfLines,
}: {
  username: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const router = useRouter();
  if (isDeletedUsername(username)) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {username || "[deleted]"}
      </Text>
    );
  }
  return (
    <Pressable
      onPress={() => router.push(`/u/${encodeURIComponent(username.toLowerCase())}`)}
      hitSlop={6}
      accessibilityRole="link"
      accessibilityLabel={`${username} profile`}
      style={numberOfLines != null ? { flexShrink: 1, minWidth: 0, overflow: "hidden" } : undefined}
    >
      <Text style={style} numberOfLines={numberOfLines} ellipsizeMode="tail">
        {username}
      </Text>
    </Pressable>
  );
}

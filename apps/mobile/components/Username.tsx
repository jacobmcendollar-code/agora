import { Pressable, Text, type StyleProp, type TextStyle } from "react-native";
import { useRouter } from "expo-router";

export function isDeletedUsername(username?: string | null) {
  return !username || username === "[deleted]";
}

export function Username({
  username,
  style,
}: {
  username: string;
  style?: StyleProp<TextStyle>;
}) {
  const router = useRouter();
  if (isDeletedUsername(username)) {
    return <Text style={style}>{username || "[deleted]"}</Text>;
  }
  return (
    <Pressable
      onPress={() => router.push(`/u/${encodeURIComponent(username.toLowerCase())}`)}
      hitSlop={6}
      accessibilityRole="link"
      accessibilityLabel={`${username} profile`}
    >
      <Text style={style}>{username}</Text>
    </Pressable>
  );
}

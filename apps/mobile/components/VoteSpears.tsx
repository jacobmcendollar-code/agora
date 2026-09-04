import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { fetchMyVote, vote } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";
import { useRouter } from "expo-router";

type Props = {
  targetType: "post" | "comment";
  targetId: string;
  initialScore: number;
  size?: "sm" | "md";
};

function Spear({
  down,
  filled,
  color,
  size,
}: {
  down?: boolean;
  filled: boolean;
  color: string;
  size: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={down ? { transform: [{ rotate: "180deg" }] } : undefined}
    >
      <Path
        d="M12 2.8L19.6 12.2h-4.35V21.2H8.75V12.2H4.4z"
        fill={filled ? color : "none"}
        stroke={filled ? "none" : color}
        strokeWidth={filled ? 0 : 1.7}
        strokeLinejoin="miter"
      />
    </Svg>
  );
}

export function VoteSpears({ targetType, targetId, initialScore, size = "md" }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setScore(initialScore);
  }, [initialScore]);

  useEffect(() => {
    if (!user?.id) {
      setUserVote(0);
      return;
    }
    fetchMyVote(targetType, targetId)
      .then((value) => setUserVote(value as 1 | -1 | 0))
      .catch(() => {});
  }, [user?.id, targetType, targetId]);

  async function onVote(value: 1 | -1) {
    if (!user) {
      router.push("/login");
      return;
    }
    if (loading) return;
    const next = userVote === value ? 0 : value;
    const prevVote = userVote;
    const prevScore = score;
    setUserVote(next);
    setScore(prevScore - prevVote + next);
    setLoading(true);
    try {
      const data = await vote(targetType, targetId, next);
      if (typeof data.score === "number") setScore(data.score);
    } catch {
      setUserVote(prevVote);
      setScore(prevScore);
    } finally {
      setLoading(false);
    }
  }

  const icon = size === "sm" ? 16 : 20;
  const upColor = userVote === 1 ? colors.emerald : colors.faint;
  const downColor = userVote === -1 ? colors.rose : colors.faint;
  const scoreColor =
    userVote === 1 ? colors.emerald : userVote === -1 ? colors.rose : colors.muted;

  return (
    <View style={styles.col}>
      <Pressable onPress={() => onVote(1)} hitSlop={8} accessibilityLabel="Upvote">
        <Spear filled={userVote === 1} color={upColor} size={icon} />
      </Pressable>
      <Text style={[styles.score, { color: scoreColor, fontSize: size === "sm" ? 12 : 14 }]}>
        {score}
      </Text>
      <Pressable onPress={() => onVote(-1)} hitSlop={8} accessibilityLabel="Downvote">
        <Spear down filled={userVote === -1} color={downColor} size={icon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  col: { alignItems: "center", gap: 2 },
  score: { fontWeight: "600", fontVariant: ["tabular-nums"] },
});

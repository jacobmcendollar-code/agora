import { StyleSheet, Text, View } from "react-native";
import { ScreenScroll } from "@/components/Screen";
import { colors } from "@/lib/theme";

const BLOCKS = [
  {
    title: "Free speech first",
    body: "The default is that speech is allowed. We do not try to shape culture, enforce political orthodoxy, or protect people from ideas they dislike. Disagreement, criticism, and unpopular opinions are expected.",
  },
  {
    title: "Light moderation",
    body: "Moderation is intentionally minimal. An AI checks new posts and comments for spam and obvious scams, content that is completely off-topic, and content that is clearly illegal. It does not police tone, politics, or ideology.",
  },
  {
    title: "Community ranking, not personal clout",
    body: "Posts rise or fall based on how the community votes. We show vote scores on posts so people can see what is resonating.",
  },
  {
    title: "How to use it well",
    body: "Post in the community that best matches the topic. Vote on what you find valuable. Reply when you have something worth saying. Don’t spam.",
  },
  {
    title: "This is an early version",
    body: "Agora is still being built. Features will change. The core idea will not: a public square where people can speak with minimal interference.",
  },
];

export default function AboutScreen() {
  return (
    <ScreenScroll includeTabs={false}>
      <Text style={styles.heading}>About Agora</Text>
      <Text style={styles.lede}>
        Agora is a place for open discussion. It is built around the idea that adults should be able to talk freely, with as little interference as possible.
      </Text>
      {BLOCKS.map((block) => (
        <View key={block.title} style={styles.card}>
          <Text style={styles.cardTitle}>{block.title}</Text>
          <Text style={styles.cardBody}>{block.body}</Text>
        </View>
      ))}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.emerald, fontSize: 28, fontWeight: "800", marginBottom: 10 },
  lede: { color: colors.muted, fontSize: 16, lineHeight: 23, marginBottom: 18 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { color: colors.emerald, fontSize: 17, fontWeight: "700" },
  cardBody: { color: colors.muted, marginTop: 8, lineHeight: 22, fontSize: 15 },
});

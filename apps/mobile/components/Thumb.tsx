import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "@/lib/preferences";
import { space, type Palette } from "@/lib/theme";
import { communityThumbLabel } from "@/lib/thumbs";

type Props = {
  src?: string | null;
  communityTitle: string;
};

export function CommunityLetterFallback({ communityTitle }: { communityTitle: string }) {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const label = communityThumbLabel(communityTitle);
  return (
    <View style={styles.fallback} accessibilityElementsHidden>
      <Text
        numberOfLines={1}
        style={[styles.fallbackText, label.large ? styles.fallbackLarge : styles.fallbackWord]}
      >
        {label.text}
      </Text>
    </View>
  );
}

export function Thumb({ src, communityTitle }: Props) {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [failed, setFailed] = useState(!src);

  if (!src || failed) {
    return <CommunityLetterFallback communityTitle={communityTitle} />;
  }

  return (
    <Image
      source={{ uri: src }}
      style={styles.img}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
  img: {
    width: space.thumb,
    height: space.thumb,
    borderRadius: 8,
    backgroundColor: colors.field,
  },
  fallback: {
    width: space.thumb,
    height: space.thumb,
    borderRadius: 8,
    backgroundColor: colors.field,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  fallbackText: {
    color: colors.emerald,
    fontWeight: "700",
  },
  fallbackLarge: {
    fontSize: 32,
    lineHeight: 36,
  },
  fallbackWord: {
    fontSize: 14,
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  });
}

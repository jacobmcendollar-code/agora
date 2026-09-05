import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  displayHostname,
  isTikTokLink,
  isXLink,
  linkOpenLabel,
  openExternal,
} from "@/lib/media";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";
import { communityThumbLabel } from "@/lib/thumbs";

type Props = {
  url: string;
  title?: string | null;
  thumbnail?: string | null;
  communityTitle: string;
  openSocialInNativeApp: boolean;
};

export function LinkPreviewCard({
  url,
  title,
  thumbnail,
  communityTitle,
  openSocialInNativeApp,
}: Props) {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [failed, setFailed] = useState(!thumbnail);
  const label = communityThumbLabel(communityTitle);
  const cta = linkOpenLabel(url);
  const headline = title?.trim();

  function onPress() {
    void openExternal(url, (isXLink(url) || isTikTokLink(url)) && openSocialInNativeApp);
  }

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityRole="link"
      accessibilityLabel={cta}
    >
      <View style={styles.media}>
        {thumbnail && !failed ? (
          <Image
            source={{ uri: thumbnail }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <View style={styles.fallback} accessibilityElementsHidden>
            <Text
              numberOfLines={1}
              style={[styles.fallbackText, label.large ? styles.fallbackLarge : styles.fallbackWord]}
            >
              {label.text}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.domain} numberOfLines={1}>
          {displayHostname(url)}
        </Text>
        {headline ? <Text style={styles.headline}>{headline}</Text> : null}
        <Text style={styles.cta}>{cta}</Text>
      </View>
    </Pressable>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    card: {
      marginTop: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.field,
      overflow: "hidden",
    },
    media: {
      width: "100%",
      aspectRatio: 16 / 9,
      backgroundColor: colors.cardHover,
      overflow: "hidden",
    },
    image: {
      width: "100%",
      aspectRatio: 16 / 9,
    },
    fallback: {
      width: "100%",
      aspectRatio: 16 / 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.field,
    },
    fallbackText: {
      color: colors.emerald,
      fontWeight: "700",
    },
    fallbackLarge: {
      fontSize: 48,
      lineHeight: 52,
    },
    fallbackWord: {
      fontSize: 18,
      lineHeight: 22,
      paddingHorizontal: 12,
    },
    body: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 6,
    },
    domain: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.7,
    },
    headline: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 22,
    },
    cta: {
      color: colors.emerald,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 2,
    },
  });
}

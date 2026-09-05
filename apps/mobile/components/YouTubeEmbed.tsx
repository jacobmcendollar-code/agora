import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { openExternal } from "@/lib/media";
import { useThemeColors } from "@/lib/preferences";

const AGORA_ORIGIN = "https://www.agor4.com";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function embedHtml(videoId: string, title: string) {
  const id = encodeURIComponent(videoId);
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; background: #000; width: 100%; height: 100%; overflow: hidden; }
      iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
    </style>
  </head>
  <body>
    <iframe
      src="https://www.youtube.com/embed/${id}?playsinline=1&rel=0"
      title="${safeTitle}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
  </body>
</html>`;
}

export function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  const colors = useThemeColors();
  const html = useMemo(() => embedHtml(videoId, title), [videoId, title]);
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

  return (
    <View>
      <View style={[styles.frame, { backgroundColor: colors.field }]}>
        <WebView
          source={{
            html,
            baseUrl: AGORA_ORIGIN,
            headers: { Referer: AGORA_ORIGIN },
          }}
          style={styles.web}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          originWhitelist={["*"]}
          accessibilityLabel={title}
        />
      </View>
      <Pressable
        style={[styles.fallback, { borderColor: colors.border, backgroundColor: colors.field }]}
        onPress={() => openExternal(watchUrl, false)}
        accessibilityRole="link"
        accessibilityLabel="Watch on YouTube"
      >
        <Text style={[styles.fallbackText, { color: colors.emerald }]}>Watch on YouTube</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
  },
  web: {
    flex: 1,
    backgroundColor: "#000",
  },
  fallback: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

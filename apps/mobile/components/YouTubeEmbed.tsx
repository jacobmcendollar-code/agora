import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "@/lib/theme";

export function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  const src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?playsinline=1&rel=0`;
  return (
    <View style={styles.frame}>
      <WebView
        source={{ uri: src }}
        style={styles.web}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        accessibilityLabel={title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.field,
  },
  web: {
    flex: 1,
    backgroundColor: "#000",
  },
});

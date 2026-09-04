import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

export default function NotFoundScreen() {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  return (
    <>
      <Stack.Screen options={{ title: "Not found", headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn’t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go home</Text>
        </Link>
      </View>
    </>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
      padding: 20,
    },
    title: { fontSize: 18, fontWeight: "700", color: colors.text },
    link: { marginTop: 16 },
    linkText: { color: colors.emerald, fontWeight: "600" },
  });
}

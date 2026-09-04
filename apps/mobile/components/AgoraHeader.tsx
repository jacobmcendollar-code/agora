import { Image, Pressable, StyleSheet, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedView, useChrome } from "@/lib/chrome";
import { colors, logoHeight, logoWidth, space } from "@/lib/theme";
import { IconBack } from "./Icons";

const TAB_ROOTS = new Set(["/", "/communities", "/submit", "/account"]);

export function AgoraHeader() {
  const insets = useSafeAreaInsets();
  const { headerStyle } = useChrome();
  const pathname = usePathname();
  const router = useRouter();
  const showBack = !TAB_ROOTS.has(pathname);

  return (
    <AnimatedView
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingTop: insets.top, height: insets.top + space.headerBody },
        headerStyle,
      ]}
    >
      <View style={styles.bar}>
        <View style={styles.side}>
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityLabel="Back"
              style={styles.back}
            >
              <IconBack color={colors.text} />
            </Pressable>
          ) : null}
        </View>
        <Image
          source={require("../assets/agora-logo.png")}
          style={{ height: logoHeight, width: logoWidth }}
          resizeMode="contain"
          accessibilityLabel="Agora"
        />
        <View style={styles.side} />
      </View>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  bar: {
    height: space.headerBody,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  side: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  back: {
    padding: 4,
    marginLeft: -4,
  },
});

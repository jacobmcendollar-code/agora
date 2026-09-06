import type { ReactNode } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { useChrome, useChromeContentStyle } from "@/lib/chrome";
import { useThemeColors } from "@/lib/preferences";

export function ScreenScroll({
  children,
  onRefresh,
  refreshing,
  includeTabs = true,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  includeTabs?: boolean;
}) {
  const chrome = useChrome();
  const colors = useThemeColors();
  const pads = useChromeContentStyle({ includeTabs });
  return (
    <Animated.ScrollView
      onScroll={chrome.onScroll}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[{ paddingHorizontal: 16 }, pads]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={colors.emerald}
          />
        ) : undefined
      }
    >
      {children}
    </Animated.ScrollView>
  );
}

export function ScreenFill({ children }: { children: ReactNode }) {
  const chrome = useChrome();
  const colors = useThemeColors();
  return (
    <View style={[styles.fill, { paddingTop: chrome.headerHeight, backgroundColor: colors.bg }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

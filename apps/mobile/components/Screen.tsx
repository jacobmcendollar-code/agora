import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useChrome } from "@/lib/chrome";
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
  return (
    <ScrollView
      onScroll={chrome.onScroll}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: chrome.headerHeight + 12,
        paddingBottom: (includeTabs ? chrome.tabBarHeight : 24) + 28,
        paddingHorizontal: 16,
      }}
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
    </ScrollView>
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

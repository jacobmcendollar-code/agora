import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useChrome } from "@/lib/chrome";
import { colors } from "@/lib/theme";

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
  return (
    <View style={[styles.fill, { paddingTop: chrome.headerHeight }]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
});

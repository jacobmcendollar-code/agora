import type { ReactNode, Ref } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ChromePad, useChrome } from "@/lib/chrome";
import { useThemeColors } from "@/lib/preferences";

export function ScreenScroll({
  children,
  onRefresh,
  refreshing,
  includeTabs = true,
  scrollRef,
  onScrollOffset,
  avoidKeyboard = false,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  includeTabs?: boolean;
  scrollRef?: Ref<ScrollView>;
  onScrollOffset?: (y: number) => void;
  avoidKeyboard?: boolean;
}) {
  const chrome = useChrome();
  const colors = useThemeColors();
  const scroll = (
    <ScrollView
      ref={scrollRef}
      onScroll={(e) => {
        chrome.onScroll(e);
        onScrollOffset?.(e.nativeEvent.contentOffset.y);
      }}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={avoidKeyboard ? "interactive" : undefined}
      contentContainerStyle={{ paddingHorizontal: 16 }}
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
      <ChromePad edge="top" />
      {children}
      <ChromePad edge="bottom" includeTabs={includeTabs} />
    </ScrollView>
  );

  if (!avoidKeyboard) return scroll;

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {scroll}
    </KeyboardAvoidingView>
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

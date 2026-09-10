import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

export type SortKey = "my" | "trending" | "recent" | "top";

/** First-paint dock ceiling. chipsDock clips at this height, so onHeight cannot grow past it. */
export const SORT_CHIPS_HEIGHT = 48;

const HOME_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "my", label: "My Feed" },
  { key: "trending", label: "Trending" },
  { key: "recent", label: "Recent" },
  { key: "top", label: "Top" },
];

const COMMUNITY_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "trending", label: "Trending" },
  { key: "recent", label: "Recent" },
  { key: "top", label: "Top" },
];

export function SortChips({
  value,
  onChange,
  showMyFeed,
  onHeight,
}: {
  value: SortKey;
  onChange: (key: SortKey) => void;
  showMyFeed?: boolean;
  onHeight?: (height: number) => void;
}) {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const options = showMyFeed ? HOME_OPTIONS : COMMUNITY_OPTIONS;

  return (
    <View
      style={styles.wrap}
      onLayout={onHeight ? (e) => onHeight(e.nativeEvent.layout.height) : undefined}
    >
      <View style={styles.row}>
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.bg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    row: {
      flexDirection: "row",
    },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 4,
      paddingVertical: 10,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: colors.emerald,
    },
    label: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "600",
    },
    labelActive: {
      color: colors.emerald,
    },
  });
}

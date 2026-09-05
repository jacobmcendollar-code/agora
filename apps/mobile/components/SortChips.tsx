import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

export type SortKey = "my" | "trending" | "recent" | "top";

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
}: {
  value: SortKey;
  onChange: (key: SortKey) => void;
  showMyFeed?: boolean;
}) {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const options = showMyFeed ? HOME_OPTIONS : COMMUNITY_OPTIONS;

  return (
    <View style={styles.wrap}>
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
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    row: {
      flexDirection: "row",
      paddingHorizontal: 4,
    },
    tab: {
      paddingHorizontal: 12,
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

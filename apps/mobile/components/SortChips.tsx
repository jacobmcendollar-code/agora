import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

export type SortKey = "my" | "trending" | "recent" | "top";

export const SORT_CHIPS_FIRST_PAINT = 48;

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
            <Pressable key={opt.key} onPress={() => onChange(opt.key)} style={styles.tab}>
              <View style={styles.cluster}>
                <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
                <View style={[styles.underline, active && styles.underlineOn]} />
              </View>
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
      paddingTop: 10,
    },
    cluster: {
      alignItems: "center",
    },
    underline: {
      alignSelf: "stretch",
      height: 2,
      marginTop: 10,
      backgroundColor: "transparent",
    },
    underlineOn: {
      backgroundColor: colors.emerald,
    },
    label: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
      textAlign: "center",
    },
    labelActive: {
      color: colors.emerald,
    },
  });
}

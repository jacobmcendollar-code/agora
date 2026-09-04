import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
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
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.field,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.chipActive,
      borderColor: colors.emerald,
    },
    label: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600",
    },
    labelActive: {
      color: colors.emerald,
    },
  });
}

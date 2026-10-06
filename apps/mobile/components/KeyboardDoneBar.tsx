import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "@/lib/preferences";

/** iOS bar above the keyboard. Dismisses the keyboard and leaves the field text in place. */
export function KeyboardDoneBar({ nativeID }: { nativeID: string }) {
  const colors = useThemeColors();
  if (Platform.OS !== "ios") return null;
  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={[styles.bar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => Keyboard.dismiss()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Done"
        >
          <Text style={[styles.done, { color: colors.emerald }]}>Done</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  done: { fontSize: 16, fontWeight: "700" },
});

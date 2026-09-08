import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { ScreenScroll } from "@/components/Screen";
import { setShowNsfw } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  usePreferences,
  useResolvedTheme,
  useThemeColors,
  type ResolvedTheme,
} from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

function ToggleRow({
  title,
  value,
  onChange,
  disabled,
  colors,
  theme,
}: {
  title: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  colors: Palette;
  theme: ResolvedTheme;
}) {
  const styles = makeStyles(colors, theme);
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.switchOff, true: colors.emerald }}
        thumbColor={colors.switchThumb}
        ios_backgroundColor={colors.switchOff}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme, openSocialInNativeApp, setOpenSocialInNativeApp } = usePreferences();
  const resolvedTheme = useResolvedTheme();
  const colors = useThemeColors();
  const styles = makeStyles(colors, resolvedTheme);

  async function onNsfw(next: boolean) {
    if (!user) return;
    if (next) {
      Alert.alert("Show adult content?", "Confirm you are 18 or older.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "I’m 18+",
          onPress: async () => {
            try {
              await setShowNsfw(true);
              updateUser({ showNsfw: true });
            } catch {
              Alert.alert("Could not update NSFW setting");
            }
          },
        },
      ]);
      return;
    }
    try {
      await setShowNsfw(false);
      updateUser({ showNsfw: false });
    } catch {
      Alert.alert("Could not update NSFW setting");
    }
  }

  return (
    <ScreenScroll>
      <Text style={styles.heading}>Settings</Text>
      {user ? (
        <Text style={styles.lede}>Preferences for @{user.username}</Text>
      ) : (
        <Text style={styles.lede}>Some settings require an account.</Text>
      )}

      <View style={styles.card}>
        <View style={styles.themeRow}>
          <Text style={styles.title}>Theme</Text>
          <View style={styles.themePair}>
            {(["light", "dark", "system"] as const).map((key) => {
              const active = theme === key;
              const label = key === "light" ? "Light" : key === "dark" ? "Dark" : "System";
              return (
                <Pressable
                  key={key}
                  onPress={() => setTheme(key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${label} theme`}
                  accessibilityState={{ selected: active }}
                  style={[styles.themeChip, active && styles.themeChipActive]}
                >
                  <Text style={[styles.themeChipText, active && styles.themeChipTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <ToggleRow
          title="Show NSFW"
          value={Boolean(user?.showNsfw)}
          onChange={onNsfw}
          disabled={!user}
          colors={colors}
          theme={resolvedTheme}
        />
        <ToggleRow
          title="Open links in apps"
          value={openSocialInNativeApp}
          onChange={setOpenSocialInNativeApp}
          colors={colors}
          theme={resolvedTheme}
        />
      </View>
    </ScreenScroll>
  );
}

function makeStyles(colors: Palette, theme: ResolvedTheme) {
  const controlBorder = theme === "light" ? "#c4c0bb" : colors.border;
  const divider = theme === "light" ? "#d6d3d1" : colors.border;
  const sub = theme === "light" ? "#57534e" : colors.muted;
  return StyleSheet.create({
    heading: { color: colors.text, fontSize: 24, fontWeight: "700" },
    lede: { color: sub, marginTop: 6, marginBottom: 16 },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: controlBorder,
      borderRadius: 14,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: divider,
    },
    title: { color: colors.text, fontSize: 15, fontWeight: "600" },
    themeRow: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: divider,
      gap: 10,
    },
    themePair: {
      flexDirection: "row",
      alignItems: "stretch",
      width: "100%",
      gap: 6,
    },
    themeChip: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 40,
      paddingHorizontal: 8,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: controlBorder,
      backgroundColor: colors.field,
    },
    themeChipActive: {
      backgroundColor: colors.chipActive,
      borderColor: colors.emerald,
    },
    themeChipText: { color: sub, fontSize: 13, fontWeight: "600" },
    themeChipTextActive: { color: colors.emerald },
  });
}

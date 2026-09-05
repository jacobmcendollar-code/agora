import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { ScreenScroll } from "@/components/Screen";
import { setShowNsfw } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePreferences, useThemeColors, type ThemePref } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
  disabled,
  colors,
  theme,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  colors: Palette;
  theme: ThemePref;
}) {
  const styles = makeStyles(colors, theme);
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
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
  const colors = useThemeColors();
  const styles = makeStyles(colors, theme);

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
    <ScreenScroll includeTabs={false}>
      <Text style={styles.heading}>Settings</Text>
      {user ? (
        <Text style={styles.lede}>Preferences for @{user.username}</Text>
      ) : (
        <Text style={styles.lede}>Some settings require an account.</Text>
      )}

      <View style={styles.card}>
        <View style={styles.themeRow}>
          <View>
            <Text style={styles.title}>Theme</Text>
            <Text style={styles.sub}>Light or dark. Stored on this device.</Text>
          </View>
          <View style={styles.themePair}>
            {(["light", "dark"] as const).map((key) => {
              const active = theme === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setTheme(key)}
                  style={[styles.themeChip, active && styles.themeChipActive]}
                >
                  <Text style={[styles.themeChipText, active && styles.themeChipTextActive]}>
                    {key === "light" ? "Light" : "Dark"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <ToggleRow
          title="Show NSFW"
          subtitle="Show communities marked NSFW. Community-level only."
          value={Boolean(user?.showNsfw)}
          onChange={onNsfw}
          disabled={!user}
          colors={colors}
          theme={theme}
        />
        <ToggleRow
          title="Open TikTok & X in native apps"
          subtitle="Off: in-app browser (default). On: try the installed app. Stored on this device."
          value={openSocialInNativeApp}
          onChange={setOpenSocialInNativeApp}
          colors={colors}
          theme={theme}
        />
      </View>
    </ScreenScroll>
  );
}

function makeStyles(colors: Palette, theme: ThemePref) {
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
    sub: { color: sub, fontSize: 12, marginTop: 4, lineHeight: 17 },
    themeRow: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: divider,
      gap: 10,
    },
    themePair: { flexDirection: "row", gap: 6 },
    themeChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
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

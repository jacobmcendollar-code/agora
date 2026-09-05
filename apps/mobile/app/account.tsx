import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { IconChevron } from "@/components/Icons";
import { ScreenScroll } from "@/components/Screen";
import { useAuth } from "@/lib/auth";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

function Row({
  label,
  onPress,
  danger,
  colors,
  styles,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  colors: Palette;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={[styles.rowLabel, danger && { color: colors.rose }]}>{label}</Text>
      {!danger ? <IconChevron color={colors.faint} /> : null}
    </Pressable>
  );
}

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const initial = user?.username?.[0]?.toUpperCase() || "?";

  return (
    <ScreenScroll includeTabs={false}>
      <Text style={styles.heading}>Account</Text>

      {user ? (
        <Pressable
          onPress={() => router.push(`/u/${encodeURIComponent(user.username.toLowerCase())}`)}
          accessibilityRole="button"
          accessibilityLabel="View profile"
          style={styles.profile}
        >
          {user.image ? (
            <Image source={{ uri: user.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user.username}</Text>
          </View>
          <IconChevron color={colors.faint} />
        </Pressable>
      ) : (
        <View style={styles.profile}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>You’re not logged in</Text>
            <Text style={styles.hint}>Use your Agora username and password.</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        {user ? (
          <>
            <Row label="Edit profile" onPress={() => router.push("/edit-profile")} colors={colors} styles={styles} />
            <Row label="Settings" onPress={() => router.push("/settings")} colors={colors} styles={styles} />
            <Row label="About Agora" onPress={() => router.push("/about")} colors={colors} styles={styles} />
            <Row
              label="Log out"
              danger
              colors={colors}
              styles={styles}
              onPress={async () => {
                await signOut();
              }}
            />
          </>
        ) : (
          <>
            <Row label="Log in" onPress={() => router.push("/login")} colors={colors} styles={styles} />
            <Row label="Create an account" onPress={() => router.push("/register")} colors={colors} styles={styles} />
            <Row label="About Agora" onPress={() => router.push("/about")} colors={colors} styles={styles} />
          </>
        )}
      </View>
    </ScreenScroll>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
  heading: { color: colors.text, fontSize: 24, fontWeight: "700", marginBottom: 16 },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.emeraldDark,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: colors.white, fontSize: 22, fontWeight: "700" },
  name: { color: colors.text, fontSize: 18, fontWeight: "700" },
  hint: { color: colors.muted, marginTop: 4, fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.text, fontSize: 16, fontWeight: "500" },
  });
}

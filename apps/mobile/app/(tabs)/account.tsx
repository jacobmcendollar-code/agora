import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { IconChevron } from "@/components/Icons";
import { ScreenScroll } from "@/components/Screen";
import { Username } from "@/components/Username";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

function Row({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
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
  const initial = user?.username?.[0]?.toUpperCase() || "?";

  return (
    <ScreenScroll>
      <Text style={styles.heading}>Account</Text>

      {user ? (
        <View style={styles.profile}>
          {user.image ? (
            <Image source={{ uri: user.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Username username={user.username} style={styles.name} />
          </View>
        </View>
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
            <Row label="Settings" onPress={() => router.push("/settings")} />
            <Row label="About Agora" onPress={() => router.push("/about")} />
            <Row
              label="Log out"
              danger
              onPress={async () => {
                await signOut();
              }}
            />
          </>
        ) : (
          <>
            <Row label="Log in" onPress={() => router.push("/login")} />
            <Row label="Create an account" onPress={() => router.push("/register")} />
            <Row label="About Agora" onPress={() => router.push("/about")} />
          </>
        )}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
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

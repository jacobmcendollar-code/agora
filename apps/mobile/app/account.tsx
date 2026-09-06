import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { IconChevron, IconGear, IconInfo, IconPencil } from "@/components/Icons";
import { ScreenScroll } from "@/components/Screen";
import { useAuth } from "@/lib/auth";
import { openExternal } from "@/lib/media";
import { fetchPublicProfile } from "@/lib/profile";
import { useThemeColors } from "@/lib/preferences";
import { formatJoinedMonthYear } from "@/lib/time";
import type { Palette } from "@/lib/theme";

const PRIVACY_URL = "https://www.agor4.com/privacy";

type MenuIcon = "edit" | "settings" | "about";

type MenuRow = {
  key: string;
  label: string;
  onPress: () => void;
  icon?: MenuIcon;
  nested?: boolean;
  danger?: boolean;
};

type MenuGroup = {
  key: string;
  label?: string;
  rows: MenuRow[];
};

function MenuIconView({ name, color }: { name: MenuIcon; color: string }) {
  if (name === "edit") return <IconPencil color={color} />;
  if (name === "settings") return <IconGear color={color} />;
  return <IconInfo color={color} />;
}

function Row({
  row,
  last,
  colors,
  styles,
}: {
  row: MenuRow;
  last: boolean;
  colors: Palette;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable
      onPress={row.onPress}
      accessibilityRole="button"
      accessibilityLabel={row.label}
      style={[styles.row, row.nested && styles.rowNested, last && styles.rowLast]}
    >
      <View style={styles.rowLeft}>
        {row.icon ? <MenuIconView name={row.icon} color={colors.text} /> : null}
        <Text style={[styles.rowLabel, row.danger && { color: colors.rose }]}>{row.label}</Text>
      </View>
      {!row.danger ? <IconChevron color={colors.faint} /> : null}
    </Pressable>
  );
}

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [bio, setBio] = useState<string | null>(null);
  const [joinedLabel, setJoinedLabel] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(user?.image ?? null);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setBio(null);
        setJoinedLabel(null);
        setImage(null);
        return;
      }
      setImage(user.image ?? null);
      let cancelled = false;
      fetchPublicProfile(user.username)
        .then((profile) => {
          if (cancelled) return;
          setBio(profile.bio);
          setJoinedLabel(formatJoinedMonthYear(profile.joined));
          setImage(profile.image ?? user.image ?? null);
        })
        .catch(() => {
          if (cancelled) return;
          setBio(null);
          setJoinedLabel(null);
        });
      return () => {
        cancelled = true;
      };
    }, [user])
  );

  const initial = user?.username?.[0]?.toUpperCase() || "?";

  const groups: MenuGroup[] = user
    ? [
        {
          key: "account",
          label: "ACCOUNT",
          rows: [
            { key: "edit", label: "Edit profile", icon: "edit", onPress: () => router.push("/edit-profile") },
            { key: "settings", label: "Settings", icon: "settings", onPress: () => router.push("/settings") },
          ],
        },
        {
          key: "agora",
          label: "AGORA",
          rows: [
            { key: "about", label: "About Agora", icon: "about", onPress: () => router.push("/about") },
            { key: "privacy", label: "Privacy", nested: true, onPress: () => void openExternal(PRIVACY_URL, false) },
          ],
        },
        {
          key: "logout",
          rows: [
            {
              key: "logout",
              label: "Log out",
              danger: true,
              onPress: async () => {
                await signOut();
                router.replace("/");
              },
            },
          ],
        },
      ]
    : [
        {
          key: "auth",
          rows: [
            { key: "login", label: "Log in", onPress: () => router.push("/login") },
            { key: "register", label: "Create an account", onPress: () => router.push("/register") },
          ],
        },
        {
          key: "agora",
          label: "AGORA",
          rows: [
            { key: "about", label: "About Agora", icon: "about", onPress: () => router.push("/about") },
            { key: "privacy", label: "Privacy", nested: true, onPress: () => void openExternal(PRIVACY_URL, false) },
          ],
        },
      ];

  return (
    <ScreenScroll includeTabs={false}>
      {user ? (
        <View style={styles.hero}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
          )}
          <Text style={styles.name}>{user.username}</Text>
          {bio ? <Text style={styles.bio}>{bio}</Text> : null}
          {joinedLabel ? <Text style={styles.joined}>{joinedLabel}</Text> : null}
          <Pressable
            onPress={() => router.push(`/u/${encodeURIComponent(user.username.toLowerCase())}`)}
            accessibilityRole="button"
            accessibilityLabel="View profile"
            style={styles.cta}
          >
            <Text style={styles.ctaText}>View profile</Text>
          </Pressable>
        </View>
      ) : null}

      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          {group.label ? <Text style={styles.groupLabel}>{group.label}</Text> : null}
          <View style={styles.card}>
            {group.rows.map((row, index) => (
              <Row
                key={row.key}
                row={row}
                last={index === group.rows.length - 1}
                colors={colors}
                styles={styles}
              />
            ))}
          </View>
        </View>
      ))}
    </ScreenScroll>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    hero: {
      alignItems: "center",
      paddingTop: 8,
      marginBottom: 8,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 2,
      borderColor: colors.emerald,
    },
    avatarFallback: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 2,
      borderColor: colors.emerald,
      backgroundColor: colors.emeraldDark,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarLetter: { color: colors.white, fontSize: 36, fontWeight: "700" },
    name: { color: colors.text, fontSize: 22, fontWeight: "700", marginTop: 14 },
    bio: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
      marginTop: 8,
      paddingHorizontal: 12,
    },
    joined: { color: colors.faint, fontSize: 13, marginTop: 8 },
    cta: {
      marginTop: 18,
      marginBottom: 12,
      backgroundColor: colors.emerald,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 28,
    },
    ctaText: { color: colors.white, fontSize: 16, fontWeight: "700" },
    group: { marginTop: 16 },
    groupLabel: {
      color: colors.faint,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.6,
      marginBottom: 8,
      marginLeft: 4,
    },
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
    rowNested: { paddingLeft: 48 },
    rowLast: { borderBottomWidth: 0 },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, paddingRight: 12 },
    rowLabel: { color: colors.text, fontSize: 16, fontWeight: "500" },
  });
}

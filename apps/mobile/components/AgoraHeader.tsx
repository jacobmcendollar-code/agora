import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconBack, IconBell } from "./Icons";
import { fetchNotifications } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AnimatedView, useChrome } from "@/lib/chrome";
import { useThemeColors } from "@/lib/preferences";
import { logoHeight, logoWidth, space, type Palette } from "@/lib/theme";

const TAB_ROOTS = new Set(["/", "/communities", "/search", "/submit"]);
const AVATAR = 28;

export function AgoraHeader() {
  const insets = useSafeAreaInsets();
  const { headerStyle } = useChrome();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const showBack = !TAB_ROOTS.has(pathname);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    if (pathname === "/notifications") {
      setUnread(0);
      return;
    }
    let cancelled = false;
    fetchNotifications()
      .then((data) => {
        if (!cancelled) setUnread(data.unreadCount);
      })
      .catch(() => {
        if (!cancelled) setUnread(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user, pathname]);

  const initial = user?.username?.[0]?.toUpperCase() || "?";

  return (
    <AnimatedView
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingTop: insets.top, height: insets.top + space.headerBody },
        headerStyle,
      ]}
    >
      <View style={styles.bar}>
        <View style={styles.side}>
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityLabel="Back"
              style={styles.back}
            >
              <IconBack color={colors.text} />
            </Pressable>
          ) : null}
        </View>
        <Image
          source={require("../assets/agora-logo.png")}
          style={{ height: logoHeight, width: logoWidth }}
          resizeMode="contain"
          accessibilityLabel="Agora"
        />
        <View style={[styles.side, styles.sideRight]}>
          {user ? (
            <>
              <Pressable
                onPress={() => router.push("/notifications")}
                hitSlop={8}
                accessibilityLabel={
                  unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
                }
                style={styles.bellBtn}
              >
                <IconBell color={colors.text} size={22} />
                {unread > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => router.push("/account")}
                accessibilityLabel="Account"
                style={styles.avatarHit}
              >
                {user.image ? (
                  <Image source={{ uri: user.image }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarLetter}>{initial}</Text>
                  </View>
                )}
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => router.push("/login")}
              accessibilityLabel="Log in"
              style={styles.login}
            >
              <Text style={styles.loginText}>Log in</Text>
            </Pressable>
          )}
        </View>
      </View>
    </AnimatedView>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    wrap: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      backgroundColor: colors.bg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    bar: {
      height: space.headerBody,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
    },
    side: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    sideRight: {
      justifyContent: "flex-end",
      gap: 8,
    },
    back: {
      padding: 4,
      marginLeft: -4,
    },
    bellBtn: {
      padding: 4,
    },
    badge: {
      position: "absolute",
      top: 0,
      right: 0,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 4,
      borderRadius: 8,
      backgroundColor: colors.emerald,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: "700",
    },
    avatarHit: {
      padding: 2,
    },
    avatar: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
    },
    avatarFallback: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
      backgroundColor: colors.emeraldDark,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarLetter: {
      color: colors.white,
      fontSize: 13,
      fontWeight: "700",
    },
    login: {
      backgroundColor: colors.emeraldDark,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    loginText: {
      color: colors.white,
      fontSize: 13,
      fontWeight: "700",
    },
  });
}

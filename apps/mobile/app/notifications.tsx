import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { ScreenScroll } from "@/components/Screen";
import { fetchNotifications, markNotificationsRead } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useThemeColors } from "@/lib/preferences";
import { mapSitePath } from "@/lib/routes";
import type { Palette } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import type { SiteNotification } from "@/lib/types";

export default function NotificationsScreen() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [items, setItems] = useState<SiteNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchNotifications()
      .then((data) => {
        if (cancelled) return;
        setItems(data.notifications);
        setLoading(false);
        markNotificationsRead().catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  if (!ready || (loading && user)) {
    return (
      <ScreenScroll includeTabs={false}>
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 32 }} />
      </ScreenScroll>
    );
  }

  if (!user) {
    return (
      <ScreenScroll includeTabs={false}>
        <Text style={styles.heading}>Notifications</Text>
        <Text style={styles.lede}>You need to be logged in to see notifications.</Text>
        <Pressable onPress={() => router.push("/login")} style={styles.login}>
          <Text style={styles.loginText}>Log in</Text>
        </Pressable>
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll includeTabs={false}>
      <Text style={styles.heading}>Notifications</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>No notifications yet.</Text>
      ) : (
        <View style={styles.list}>
          {items.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => router.push(mapSitePath(n.link) as Href)}
              style={[styles.card, !n.read && styles.unread]}
            >
              <Text style={styles.message}>{n.message}</Text>
              <Text style={styles.meta}>{timeAgo(n.createdAt)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenScroll>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    heading: { color: colors.text, fontSize: 24, fontWeight: "700" },
    lede: { color: colors.muted, marginTop: 8, marginBottom: 16 },
    login: {
      alignSelf: "flex-start",
      backgroundColor: colors.emeraldDark,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    loginText: { color: colors.white, fontWeight: "700" },
    empty: { color: colors.muted, marginTop: 20 },
    list: { marginTop: 16, gap: 10 },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
    },
    unread: {
      backgroundColor: colors.cardHover,
      borderColor: colors.emerald,
    },
    message: { color: colors.text, fontSize: 15, lineHeight: 21 },
    meta: { color: colors.muted, fontSize: 12, marginTop: 6 },
  });
}

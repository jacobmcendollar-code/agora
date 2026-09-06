import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { IconComments, IconReply } from "@/components/Icons";
import { ScreenScroll } from "@/components/Screen";
import { fetchNotifications, markNotificationsRead } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notificationHref, parseNotification } from "@/lib/notification";
import { useThemeColors } from "@/lib/preferences";
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
      <ScreenScroll>
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 32 }} />
      </ScreenScroll>
    );
  }

  if (!user) {
    return (
      <ScreenScroll>
        <Text style={styles.heading}>Notifications</Text>
        <Text style={styles.lede}>You need to be logged in to see notifications.</Text>
        <Pressable onPress={() => router.push("/login")} style={styles.login}>
          <Text style={styles.loginText}>Log in</Text>
        </Pressable>
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll>
      <Text style={styles.heading}>Notifications</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>No notifications yet.</Text>
      ) : (
        <View style={styles.list}>
          {items.map((n) => (
            <NotificationRow
              key={n.id}
              item={n}
              colors={colors}
              styles={styles}
              onPress={() => router.push(notificationHref(n) as Href)}
            />
          ))}
        </View>
      )}
    </ScreenScroll>
  );
}

function NotificationRow({
  item,
  colors,
  styles,
  onPress,
}: {
  item: SiteNotification;
  colors: Palette;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
}) {
  const parsed = parseNotification(item);
  const username = parsed.username;
  const letter = (username || "?").slice(0, 1).toUpperCase();
  const kind = parsed.kind;
  const typeLabel =
    kind === "reply" ? "REPLY" : kind === "comment" ? "COMMENT" : kind === "mention" ? "MENTION" : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.card, !item.read && styles.unread]}
    >
      {!item.read ? <View style={styles.unreadBar} /> : null}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{letter}</Text>
        </View>
        {kind === "comment" || kind === "reply" ? (
          <View style={styles.badge}>
            {kind === "reply" ? (
              <IconReply color={colors.white} size={10} />
            ) : (
              <IconComments color={colors.white} size={10} />
            )}
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.line}>
          {username ? <Text style={styles.username}>{username}</Text> : null}
          {kind === "comment" ? (
            <>
              <Text style={styles.action}> commented on your post</Text>
              {parsed.title ? <Text style={styles.title}> {parsed.title}</Text> : null}
            </>
          ) : kind === "reply" ? (
            <Text style={styles.action}> replied to your comment</Text>
          ) : kind === "mention" ? (
            <Text style={styles.action}> mentioned you</Text>
          ) : (
            <Text style={styles.action}>{username ? ` ${parsed.text.slice(username.length).trimStart()}` : parsed.text}</Text>
          )}
        </Text>
        <View style={styles.metaRow}>
          {typeLabel ? (
            <Text style={[styles.typeLabel, kind === "reply" && styles.typeReply]}>{typeLabel}</Text>
          ) : null}
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
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
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      overflow: "hidden",
    },
    unread: {
      backgroundColor: colors.hero,
      borderColor: colors.emerald,
    },
    unreadBar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: colors.emerald,
    },
    avatarWrap: { width: 40, height: 40 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.field,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarLetter: { color: colors.emerald, fontSize: 16, fontWeight: "700" },
    badge: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.emerald,
      alignItems: "center",
      justifyContent: "center",
    },
    body: { flex: 1, minWidth: 0, paddingRight: 2 },
    line: { color: colors.text, fontSize: 15, lineHeight: 21 },
    username: { color: colors.text, fontWeight: "700" },
    action: { color: colors.text, fontWeight: "400" },
    title: { color: colors.muted, fontWeight: "400" },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
    typeLabel: { color: colors.faint, fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
    typeReply: { color: colors.emerald },
    time: { color: colors.muted, fontSize: 12 },
  });
}

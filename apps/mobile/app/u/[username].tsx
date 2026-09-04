import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenScroll } from "@/components/Screen";
import { Username } from "@/components/Username";
import { fetchMutes, muteUser, type MutedUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fetchPublicProfile, type PublicProfile } from "@/lib/profile";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [mutes, setMutes] = useState<MutedUser[]>([]);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    fetchPublicProfile(username)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setTargetId(data.id);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setProfile(null);
        setError(err instanceof Error ? err.message : "User not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    if (!user || !profile) return;
    let cancelled = false;
    fetchMutes()
      .then((list) => {
        if (cancelled) return;
        setMutes(list);
        const hit = list.find((m) => m.username.toLowerCase() === profile.username.toLowerCase());
        setMuted(Boolean(hit));
        if (hit) setTargetId(hit.userId);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, profile]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.emerald} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>{error || "User not found"}</Text>
      </View>
    );
  }

  const initial = profile.username.slice(0, 1).toUpperCase();
  const isOwn = Boolean(user && user.username.toLowerCase() === profile.username.toLowerCase());

  async function onMute() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!profile || !targetId || busy) return;
    const next = !muted;
    const name = profile.username;
    Alert.alert(
      next ? "Mute this user?" : "Unmute this user?",
      next
        ? `Hide posts and comments from ${name}.`
        : `Show posts and comments from ${name} again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: next ? "Mute" : "Unmute",
          style: next ? "destructive" : "default",
          onPress: async () => {
            setBusy(true);
            try {
              const data = await muteUser(targetId, next ? "mute" : "unmute");
              setMuted(data.muted);
            } catch (err) {
              Alert.alert("Could not update mute", err instanceof Error ? err.message : "Try again");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  async function onUnmute(entry: MutedUser) {
    if (busy) return;
    setBusy(true);
    try {
      await muteUser(entry.userId, "unmute");
      setMutes((prev) => prev.filter((m) => m.userId !== entry.userId));
    } catch (err) {
      Alert.alert("Could not unmute", err instanceof Error ? err.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenScroll includeTabs={false}>
      <View style={styles.hero}>
        {profile.image ? (
          <Image source={{ uri: profile.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name}>{profile.username}</Text>
          {profile.joined ? <Text style={styles.joined}>Joined {profile.joined}</Text> : null}
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          {user && !isOwn && targetId ? (
            <Pressable
              onPress={onMute}
              disabled={busy}
              style={[styles.muteBtn, muted && styles.unmuteBtn]}
            >
              <Text style={[styles.muteBtnText, muted && styles.unmuteBtnText]}>
                {busy ? "…" : muted ? "Unmute" : "Mute"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isOwn ? (
        <>
          <Text style={styles.section}>Muted</Text>
          {mutes.length === 0 ? (
            <Text style={styles.mutedText}>You haven’t muted anyone yet.</Text>
          ) : (
            mutes.map((entry) => (
              <View key={entry.userId} style={styles.muteRow}>
                {entry.image ? (
                  <Image source={{ uri: entry.image }} style={styles.muteAvatar} />
                ) : (
                  <View style={styles.muteAvatarFallback}>
                    <Text style={styles.muteAvatarLetter}>
                      {entry.username.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Username username={entry.username} style={styles.muteName} />
                <Pressable onPress={() => onUnmute(entry)} disabled={busy} style={styles.unmuteChip}>
                  <Text style={styles.unmuteChipText}>Unmute</Text>
                </Pressable>
              </View>
            ))
          )}
        </>
      ) : null}

      <Text style={styles.section}>Recent posts</Text>
      {profile.posts.length === 0 ? (
        <Text style={styles.mutedText}>No posts yet.</Text>
      ) : (
        profile.posts.map((post) => (
          <Pressable
            key={post.id}
            style={styles.post}
            onPress={() => router.push(`/post/${post.id}`)}
          >
            <Text style={styles.postTitle}>{post.title}</Text>
            {post.communityTitle ? (
              <Text style={styles.postMeta}>{post.communityTitle}</Text>
            ) : null}
          </Pressable>
        ))
      )}
    </ScreenScroll>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: colors.hero,
    borderWidth: 1,
    borderColor: colors.heroBorder,
    borderRadius: 14,
    padding: 14,
  },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.emeraldDark,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: colors.white, fontSize: 24, fontWeight: "700" },
  name: { color: colors.text, fontSize: 22, fontWeight: "800" },
  joined: { color: colors.muted, marginTop: 4, fontSize: 13 },
  bio: { color: colors.text, marginTop: 10, fontSize: 15, lineHeight: 21 },
  muteBtn: {
    alignSelf: "flex-start",
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  unmuteBtn: { borderColor: "#881337" },
  muteBtnText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  unmuteBtnText: { color: colors.rose },
  section: { color: colors.text, fontSize: 17, fontWeight: "700", marginTop: 22, marginBottom: 10 },
  mutedText: { color: colors.muted, fontSize: 14 },
  muteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  muteAvatar: { width: 36, height: 36, borderRadius: 18 },
  muteAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.field,
    alignItems: "center",
    justifyContent: "center",
  },
  muteAvatarLetter: { color: colors.muted, fontWeight: "700" },
  muteName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "600" },
  unmuteChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  unmuteChipText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  post: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  postTitle: { color: colors.text, fontSize: 16, fontWeight: "600", lineHeight: 22 },
  postMeta: { color: colors.muted, marginTop: 6, fontSize: 13, fontWeight: "600" },
  });
}

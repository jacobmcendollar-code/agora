import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { IconChevron } from "@/components/Icons";
import { ScreenScroll } from "@/components/Screen";
import { Username } from "@/components/Username";
import { fetchMutes, muteUser, type MutedUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fetchPublicProfile, type ProfileComment, type PublicProfile } from "@/lib/profile";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

type ProfileTab = "posts" | "comments" | "muted";

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
  const [tab, setTab] = useState<ProfileTab>("posts");

  useEffect(() => {
    setTab("posts");
  }, [username]);

  useFocusEffect(
    useCallback(() => {
      if (!username) return;
      let cancelled = false;
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
    }, [username])
  );

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
  const activeTab: ProfileTab = !isOwn && tab === "muted" ? "posts" : tab;

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
    <ScreenScroll>
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
          {isOwn ? (
            <Pressable
              onPress={() => router.push("/edit-profile")}
              accessibilityRole="link"
              accessibilityLabel="Edit profile"
              style={styles.editLink}
            >
              <Text style={styles.editLinkText}>Edit profile</Text>
              <IconChevron color={colors.emerald} size={14} />
            </Pressable>
          ) : user && targetId ? (
            <Pressable
              onPress={onMute}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={muted ? "Unmute" : "Mute"}
              style={[styles.muteBtn, muted && styles.unmuteBtn]}
            >
              <Text style={[styles.muteBtnText, muted && styles.unmuteBtnText]}>
                {busy ? "…" : muted ? "Unmute" : "Mute"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.tabs}>
        {(isOwn ? (["posts", "comments", "muted"] as const) : (["posts", "comments"] as const)).map(
          (key) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTab === key }}
              style={[styles.tabBtn, activeTab === key && styles.tabBtnActive]}
            >
              <Text style={[styles.tabLabel, activeTab === key && styles.tabActive]}>
                {key === "posts" ? "Posts" : key === "comments" ? "Comments" : "Muted"}
              </Text>
            </Pressable>
          )
        )}
      </View>

      {activeTab === "posts" ? (
        profile.posts.length === 0 ? (
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
        )
      ) : null}

      {activeTab === "comments" ? (
        profile.comments.length === 0 ? (
          <Text style={styles.mutedText}>No comments yet.</Text>
        ) : (
          profile.comments.map((comment: ProfileComment) => (
            <Pressable
              key={comment.id}
              style={styles.post}
              onPress={() => router.push(`/post/${comment.postId}`)}
            >
              <Text style={styles.commentBody} numberOfLines={4}>
                {comment.body}
              </Text>
              <Text style={styles.postMeta}>
                {comment.postTitle || "Post"}
                {comment.communityTitle ? ` · ${comment.communityTitle}` : ""}
              </Text>
            </Pressable>
          ))
        )
      ) : null}

      {activeTab === "muted" && isOwn ? (
        mutes.length === 0 ? (
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
        )
      ) : null}
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
  editLink: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    minHeight: 44,
    paddingVertical: 12,
  },
  editLinkText: { color: colors.emerald, fontSize: 15, fontWeight: "600" },
  muteBtn: {
    alignSelf: "flex-start",
    marginTop: 12,
    minHeight: 40,
    justifyContent: "center",
    backgroundColor: colors.emerald,
    borderWidth: 1,
    borderColor: colors.emerald,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  unmuteBtn: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.rose,
  },
  muteBtnText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  unmuteBtnText: { color: colors.rose },
  tabs: {
    flexDirection: "row",
    marginHorizontal: -16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginTop: 18,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: colors.emerald },
  tabLabel: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  tabActive: { color: colors.emerald },
  mutedText: { color: colors.muted, fontSize: 14 },
  commentBody: { color: colors.text, fontSize: 15, lineHeight: 21 },
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

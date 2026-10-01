import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ContentActions } from "@/components/ContentActions";
import { IconChevron } from "@/components/Icons";
import { ScreenScroll } from "@/components/Screen";
import { blockUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fetchPublicProfile, type ProfileComment, type PublicProfile } from "@/lib/profile";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

type ProfileTab = "posts" | "comments";

const BLOCK_BODY =
  "You won't see their posts or comments, and they can't reply to or mention you.";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<ProfileTab>("posts");

  useEffect(() => {
    setTab("posts");
  }, [username]);

  useFocusEffect(
    useCallback(() => {
      if (!username) return;
      let cancelled = false;
      setLoading(true);
      fetchPublicProfile(username)
        .then((data) => {
          if (cancelled) return;
          setProfile(data);
          setBlocked(Boolean(data.blockedByYou));
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

  const viewed = profile;
  const initial = viewed.username.slice(0, 1).toUpperCase();
  const isOwn = Boolean(user && user.username.toLowerCase() === viewed.username.toLowerCase());
  const targetId = viewed.id;

  function onBlock() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!targetId || busy) return;
    const next = !blocked;
    const profileName = viewed.username;
    Alert.alert(next ? "Block this user?" : "Unblock this user?", next ? BLOCK_BODY : "You'll see their posts and comments again, and they can reply to you.", [
      { text: "Cancel", style: "cancel" },
      {
        text: next ? "Block" : "Unblock",
        style: next ? "destructive" : "default",
        onPress: async () => {
          setBusy(true);
          try {
            const data = await blockUser(targetId, next ? "block" : "unblock");
            setBlocked(data.blocked);
            const refreshed = await fetchPublicProfile(profileName);
            setProfile(refreshed);
            setBlocked(Boolean(refreshed.blockedByYou));
          } catch (err) {
            Alert.alert("Could not update block", err instanceof Error ? err.message : "Try again");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <ScreenScroll>
      <View style={styles.hero}>
        {viewed.image ? (
          <Image source={{ uri: viewed.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name}>{viewed.username}</Text>
          {viewed.joined ? <Text style={styles.joined}>Joined {viewed.joined}</Text> : null}
          {viewed.bio && !viewed.contentHidden ? <Text style={styles.bio}>{viewed.bio}</Text> : null}
          {viewed.contentHidden ? (
            <Text style={styles.bio}>
              {blocked
                ? "You blocked this user. Their posts and comments are hidden."
                : "This content is unavailable."}
            </Text>
          ) : null}
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
          ) : (
            <View style={styles.actions}>
              {user && targetId ? (
                <Pressable
                  onPress={onBlock}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={blocked ? "Unblock" : "Block"}
                  style={[styles.muteBtn, blocked && styles.unmuteBtn]}
                >
                  <Text style={[styles.muteBtnText, blocked && styles.unmuteBtnText]}>
                    {busy ? "…" : blocked ? "Unblock" : "Block"}
                  </Text>
                </Pressable>
              ) : null}
              {targetId ? (
                <ContentActions
                  targetType="user"
                  targetId={targetId}
                  authorId={targetId}
                  authorUsername={viewed.username}
                  initialBlocked={blocked}
                />
              ) : null}
            </View>
          )}
        </View>
      </View>

      {viewed.contentHidden ? null : (
        <>
          <View style={styles.tabs}>
            {(["posts", "comments"] as const).map((key) => (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: tab === key }}
                style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
              >
                <Text style={[styles.tabLabel, tab === key && styles.tabActive]}>
                  {key === "posts" ? "Posts" : "Comments"}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === "posts" ? (
            viewed.posts.length === 0 ? (
              <Text style={styles.mutedText}>No posts yet.</Text>
            ) : (
              viewed.posts.map((post) => (
                <Pressable
                  key={post.id}
                  style={styles.post}
                  onPress={() => router.push(`/post/${post.id}`)}
                >
                  <Text style={styles.postTitle}>{post.title}</Text>
                  {post.communityTitle ? <Text style={styles.postMeta}>{post.communityTitle}</Text> : null}
                </Pressable>
              ))
            )
          ) : null}

          {tab === "comments" ? (
            viewed.comments.length === 0 ? (
              <Text style={styles.mutedText}>No comments yet.</Text>
            ) : (
              viewed.comments.map((comment: ProfileComment) => (
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
        </>
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
    actions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
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

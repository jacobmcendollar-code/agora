import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FeedList } from "@/components/FeedList";
import { IconTarget } from "@/components/Icons";
import { fetchCommunities, resolveCommunityId, subscribe } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";
import type { Community } from "@/lib/types";

export default function CommunityScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [community, setCommunity] = useState<Community | null>(null);
  const [busy, setBusy] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    setAboutOpen(false);
    if (!name) return;
    fetchCommunities()
      .then((list) => setCommunity(list.find((c) => c.name === name) || null))
      .catch(() => setCommunity(null));
  }, [name]);

  async function onJoin() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!community) return;
    setBusy(true);
    try {
      const id = await resolveCommunityId(community);
      if (!id) return;
      const data = await subscribe(id, community.joined ? "leave" : "join");
      setCommunity({ ...community, id, joined: data.joined });
    } finally {
      setBusy(false);
    }
  }

  const description = community?.description?.trim() || "";
  const title = community?.title || name;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FeedList
        community={name}
        hideCommunity
        emptyTitle="No posts yet"
        emptyBody={
          community
            ? `Be the first to start a conversation in ${community.title}.`
            : "This community has no posts yet."
        }
        header={
          <View style={styles.hero}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              {description ? (
                <Pressable
                  onPress={() => setAboutOpen((open) => !open)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: aboutOpen }}
                  accessibilityLabel={aboutOpen ? "Hide about" : "About this community"}
                  style={[styles.aboutChip, aboutOpen && styles.aboutChipOpen]}
                >
                  <IconTarget color={colors.text} size={11} />
                  <Text style={styles.aboutChipText}>About</Text>
                </Pressable>
              ) : null}
              {community?.postFormat === "discussion" ? (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Discussion</Text>
                </View>
              ) : null}
            </View>
            {aboutOpen && description ? <Text style={styles.desc}>{description}</Text> : null}
            <View style={styles.actions}>
              <Pressable onPress={onJoin} disabled={busy} style={styles.join}>
                <Text style={styles.joinText}>
                  {busy ? "…" : community?.joined ? "Joined" : "Join"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.postBtn}
                onPress={() => router.push(`/submit?community=${name}`)}
              >
                <Text style={styles.postBtnText}>New Post</Text>
              </Pressable>
            </View>
          </View>
        }
      />
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    hero: {
      backgroundColor: colors.hero,
      borderWidth: 1,
      borderColor: colors.heroBorder,
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
    },
    titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
    title: { color: colors.text, fontSize: 22, fontWeight: "800", flexShrink: 1 },
    aboutChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.text,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    aboutChipOpen: {
      backgroundColor: colors.chipActive,
    },
    aboutChipText: { color: colors.text, fontSize: 12, fontWeight: "600" },
    pill: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    pillText: { color: colors.muted, fontSize: 11, fontWeight: "600" },
    desc: { color: colors.muted, marginTop: 10, lineHeight: 20 },
    actions: { flexDirection: "row", gap: 8, marginTop: 12 },
    join: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.text,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    joinText: { color: colors.text, fontWeight: "700" },
    postBtn: {
      backgroundColor: colors.emeraldDark,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    postBtnText: { color: colors.white, fontWeight: "700" },
  });
}

import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FeedList } from "@/components/FeedList";
import { fetchCommunities, resolveCommunityId, subscribe } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";
import type { Community } from "@/lib/types";

export default function CommunityScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [community, setCommunity] = useState<Community | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
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
              <Text style={styles.title}>{community?.title || name}</Text>
              {community?.postFormat === "discussion" ? (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Discussion</Text>
                </View>
              ) : null}
            </View>
            {community?.description ? (
              <Text style={styles.desc}>{community.description}</Text>
            ) : null}
            <View style={styles.actions}>
              <Pressable
                onPress={onJoin}
                disabled={busy}
                style={[styles.join, community?.joined && styles.joined]}
              >
                <Text style={[styles.joinText, community?.joined && styles.joinedText]}>
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

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "#052e24",
    borderWidth: 1,
    borderColor: "#064e3b",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  desc: { color: colors.muted, marginTop: 8, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
  join: {
    backgroundColor: colors.emeraldDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  joined: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  joinText: { color: colors.white, fontWeight: "700" },
  joinedText: { color: colors.muted },
  postBtn: {
    backgroundColor: colors.emeraldDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  postBtnText: { color: colors.white, fontWeight: "700" },
});

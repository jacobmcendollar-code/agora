import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Animated from "react-native-reanimated";
import { CreateCommunityModal } from "@/components/CreateCommunityModal";
import { fetchCommunities, resolveCommunityId, subscribe } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useChrome } from "@/lib/chrome";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";
import type { Community } from "@/lib/types";

export default function CommunitiesScreen() {
  const { user } = useAuth();
  const chrome = useChrome();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"discover" | "joined">("discover");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const showNsfw = Boolean(user?.showNsfw);

  const load = useCallback(async () => {
    const data = await fetchCommunities();
    setCommunities(data.filter((c) => showNsfw || !c.nsfw));
  }, [showNsfw]);

  useFocusEffect(
    useCallback(() => {
      load()
        .catch(() => setCommunities([]))
        .finally(() => setLoading(false));
    }, [load])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? communities.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
        )
      : communities;
    return [...list].sort((a, b) => (b.postCount || 0) - (a.postCount || 0));
  }, [communities, query]);

  const joined = filtered.filter((c) => c.joined);
  const discover = user ? filtered.filter((c) => !c.joined) : filtered;
  const shown = tab === "joined" && user ? joined : discover;

  async function toggleJoin(community: Community) {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusyId(community.name);
    try {
      const id = await resolveCommunityId(community);
      if (!id) throw new Error("Could not join this community yet.");
      const data = await subscribe(id, community.joined ? "leave" : "join");
      setCommunities((prev) =>
        prev.map((c) => (c.name === community.name ? { ...c, id, joined: data.joined } : c))
      );
    } catch {
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.FlatList
        data={shown}
        keyExtractor={(item) => item.name}
        onScroll={chrome.onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: chrome.headerHeight + 12,
          paddingBottom: chrome.tabBarHeight + 24,
          paddingHorizontal: 12,
          gap: 10,
        }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <Text style={styles.heading}>Communities</Text>
            <Text style={styles.sub}>
              Topic-based rooms. Light moderation. Free speech by default.
            </Text>
            <Pressable
              onPress={() => (user ? setCreating(true) : router.push("/login"))}
              style={styles.createBtn}
            >
              <Text style={styles.createBtnText}>Create Community</Text>
            </Pressable>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search communities..."
              placeholderTextColor={colors.faint}
              style={styles.search}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {user ? (
              <View style={styles.tabs}>
                <Pressable onPress={() => setTab("discover")} style={styles.tabBtn}>
                  <Text style={[styles.tabLabel, tab === "discover" && styles.tabActive]}>
                    Discover
                  </Text>
                </Pressable>
                <Pressable onPress={() => setTab("joined")} style={styles.tabBtn}>
                  <Text style={[styles.tabLabel, tab === "joined" && styles.tabActive]}>
                    Joined {joined.length ? `(${joined.length})` : ""}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable
              style={{ flex: 1, minWidth: 0 }}
              onPress={() => router.push(`/community/${item.name}`)}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.meta}>
                {item.postCount ?? 0} post{(item.postCount ?? 0) !== 1 ? "s" : ""}
                {item.postFormat === "discussion" ? " · Discussion" : ""}
                {item.nsfw ? " · NSFW" : ""}
              </Text>
            </Pressable>
            {user ? (
              <Pressable
                onPress={() => toggleJoin(item)}
                disabled={busyId === item.name}
                style={[styles.join, item.joined && styles.joined]}
              >
                <Text style={[styles.joinText, item.joined && styles.joinedText]}>
                  {busyId === item.name ? "…" : item.joined ? "Joined" : "Join"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.emerald} style={{ marginTop: 32 }} />
          ) : (
            <Text style={styles.empty}>
              {tab === "joined" ? "You haven’t joined any communities yet." : "No communities to show."}
            </Text>
          )
        }
      />
      <CreateCommunityModal
        visible={creating}
        onClose={() => setCreating(false)}
        onCreated={(name) => {
          setCreating(false);
          setTab("joined");
          load().catch(() => {});
          router.push(`/community/${name}`);
        }}
      />
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
  heading: { color: colors.text, fontSize: 24, fontWeight: "700" },
  sub: { color: colors.muted, fontSize: 13, marginTop: -4 },
  createBtn: {
    backgroundColor: colors.emeraldDark,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  createBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  search: {
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabLabel: { color: colors.faint, fontWeight: "600", fontSize: 14 },
  tabActive: { color: colors.emerald },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  desc: { color: colors.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  meta: { color: colors.faint, fontSize: 12, marginTop: 8 },
  join: {
    backgroundColor: colors.emeraldDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  joined: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  joinText: { color: colors.white, fontSize: 13, fontWeight: "600" },
  joinedText: { color: colors.muted },
  empty: { color: colors.muted, textAlign: "center", marginTop: 24 },
  });
}

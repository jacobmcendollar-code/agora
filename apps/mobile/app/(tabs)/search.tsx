import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Animated from "react-native-reanimated";
import { fetchCommunities, fetchFeed, fetchSearchSuggest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useChrome } from "@/lib/chrome";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";
import type {
  Community,
  FeedPost,
  SearchSuggest,
  SearchSuggestCommunity,
  SearchSuggestPost,
} from "@/lib/types";

type Row =
  | { kind: "heading"; key: string; label: string }
  | { kind: "community"; key: string; community: SearchSuggestCommunity }
  | { kind: "post"; key: string; post: SearchSuggestPost };

function mapDiscoverCommunities(
  list: Community[],
  showNsfw: boolean
): SearchSuggestCommunity[] {
  return list
    .filter((c) => showNsfw || !c.nsfw)
    .sort((a, b) => (b.postCount ?? 0) - (a.postCount ?? 0))
    .slice(0, 10)
    .map((c) => ({ name: c.name, title: c.title, nsfw: c.nsfw }));
}

function mapDiscoverPosts(list: FeedPost[], showNsfw: boolean): SearchSuggestPost[] {
  return list
    .filter((p) => showNsfw || !p.nsfw)
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      title: p.title,
      community: { name: p.community.name, title: p.community.title },
    }));
}

export default function SearchScreen() {
  const { user } = useAuth();
  const chrome = useChrome();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const showNsfw = Boolean(user?.showNsfw);
  const [query, setQuery] = useState("");
  const [discover, setDiscover] = useState<SearchSuggest>({ communities: [], posts: [] });
  const [discoverReady, setDiscoverReady] = useState(false);
  const [suggest, setSuggest] = useState<SearchSuggest>({ communities: [], posts: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCommunities(), fetchFeed({ sort: "trending", page: 1 })])
      .then(([communities, feed]) => {
        if (cancelled) return;
        setDiscover({
          communities: mapDiscoverCommunities(communities, showNsfw),
          posts: mapDiscoverPosts(feed.posts, showNsfw),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setDiscover({ communities: [], posts: [] });
      })
      .finally(() => {
        if (!cancelled) setDiscoverReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [showNsfw]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      fetchSearchSuggest(q)
        .then((data) => {
          if (cancelled) return;
          setSuggest({
            communities: data.communities.filter((c) => showNsfw || !c.nsfw),
            posts: data.posts,
          });
        })
        .catch(() => {
          if (cancelled) return;
          setSuggest({ communities: [], posts: [] });
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, showNsfw]);

  const trimmed = query.trim();
  const results = trimmed.length >= 1 ? suggest : discover;
  const rows: Row[] = [];
  if (results.communities.length) {
    rows.push({ kind: "heading", key: "h-communities", label: "Communities" });
    results.communities.forEach((community) => {
      rows.push({ kind: "community", key: `c-${community.name}`, community });
    });
  }
  if (results.posts.length) {
    rows.push({ kind: "heading", key: "h-posts", label: "Posts" });
    results.posts.forEach((post) => {
      rows.push({ kind: "post", key: `p-${post.id}`, post });
    });
  }

  const empty = !loading && trimmed.length >= 1 && rows.length === 0 ? "No matches" : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        onScroll={chrome.onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: chrome.headerHeight + 12,
          paddingBottom: chrome.tabBarHeight + 24,
          paddingHorizontal: 12,
        }}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={styles.heading}>Search</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search..."
              placeholderTextColor={colors.faint}
              style={styles.field}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="search"
            />
          </View>
        }
        renderItem={({ item }) => {
          if (item.kind === "heading") {
            return <Text style={styles.section}>{item.label}</Text>;
          }
          if (item.kind === "community") {
            const c = item.community;
            return (
              <Pressable
                onPress={() => router.push(`/community/${c.name}`)}
                style={styles.row}
              >
                <Text style={styles.rowTitle}>{c.title}</Text>
                {c.nsfw ? <Text style={styles.nsfw}>NSFW</Text> : null}
              </Pressable>
            );
          }
          const p = item.post;
          return (
            <Pressable onPress={() => router.push(`/post/${p.id}`)} style={styles.row}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {p.title}
              </Text>
              <Text style={styles.rowMeta}>{p.community.title}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          (trimmed.length >= 1 ? loading : !discoverReady) ? (
            <ActivityIndicator color={colors.emerald} style={{ marginTop: 32 }} />
          ) : empty ? (
            <Text style={styles.empty}>{empty}</Text>
          ) : null
        }
      />
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    headerBlock: { gap: 12, marginBottom: 8 },
    heading: { color: colors.text, fontSize: 24, fontWeight: "700" },
    field: {
      backgroundColor: colors.field,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
    },
    section: {
      color: colors.faint,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginTop: 16,
      marginBottom: 6,
      paddingHorizontal: 4,
    },
    row: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
    },
    rowTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
    rowMeta: { color: colors.muted, fontSize: 13, marginTop: 4 },
    nsfw: { color: colors.rose, fontSize: 11, fontWeight: "600", marginTop: 6 },
    empty: { color: colors.muted, textAlign: "center", marginTop: 24 },
  });
}

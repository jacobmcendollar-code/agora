import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { fetchCommunities, fetchFeed } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useChrome } from "@/lib/chrome";
import { colors } from "@/lib/theme";
import type { Community, FeedPost } from "@/lib/types";
import { FeedCard } from "./FeedCard";
import { SortChips, type SortKey } from "./SortChips";

type Props = {
  community?: string;
  hideCommunity?: boolean;
  header?: ReactNode;
  emptyTitle?: string;
  emptyBody?: string;
};

export function FeedList({
  community,
  hideCommunity,
  header,
  emptyTitle = "No posts yet",
  emptyBody = "Join some communities or start the first conversation.",
}: Props) {
  const { user } = useAuth();
  const chrome = useChrome();
  const [sort, setSort] = useState<SortKey>("trending");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(2);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [formats, setFormats] = useState<Record<string, Community["postFormat"]>>({});

  const showNsfw = Boolean(user?.showNsfw);

  const load = useCallback(
    async (next: number, replace: boolean) => {
      const data = await fetchFeed({
        sort,
        page: next,
        scope: "all",
        community,
      });
      setPosts((prev) => {
        const incoming = data.posts.filter((p) => showNsfw || !p.nsfw);
        if (replace) return incoming;
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...incoming.filter((p) => !seen.has(p.id))];
      });
      setPage(next);
      setNextPage(data.nextPage);
    },
    [community, showNsfw, sort]
  );

  useEffect(() => {
    fetchCommunities()
      .then((list) => {
        const next: Record<string, Community["postFormat"]> = {};
        list.forEach((c) => {
          next[c.name] = c.postFormat;
        });
        setFormats(next);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load(1, true)
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load(1, true);
    } finally {
      setRefreshing(false);
    }
  }

  async function onEnd() {
    if (loading || loadingMore || !nextPage) return;
    setLoadingMore(true);
    try {
      await load(page + 1, false);
    } finally {
      setLoadingMore(false);
    }
  }

  const visible = posts
    .filter((p) => showNsfw || !p.nsfw)
    .map((p) =>
      p.community.postFormat
        ? p
        : {
            ...p,
            community: { ...p.community, postFormat: formats[p.community.name] },
          }
    );

  return (
    <Animated.FlatList
      data={visible}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <FeedCard post={item} hideCommunity={hideCommunity} />}
      onScroll={chrome.onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{
        paddingTop: chrome.headerHeight + 8,
        paddingBottom: chrome.tabBarHeight + 24,
        paddingHorizontal: 12,
        gap: 10,
        flexGrow: 1,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.emerald}
        />
      }
      onEndReached={onEnd}
      onEndReachedThreshold={0.6}
      ListHeaderComponent={
        <View>
          {header}
          <SortChips value={sort} onChange={setSort} />
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.emerald} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyBody}>{emptyBody}</Text>
          </View>
        )
      }
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator color={colors.emerald} style={{ marginVertical: 16 }} />
        ) : !nextPage && visible.length > 0 ? (
          <Text style={styles.end}>You’ve reached the end</Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    marginTop: 32,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 12,
    padding: 28,
    alignItems: "center",
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "600" },
  emptyBody: { color: colors.muted, marginTop: 8, textAlign: "center", lineHeight: 20 },
  end: { color: colors.faint, textAlign: "center", paddingVertical: 16, fontSize: 13 },
});

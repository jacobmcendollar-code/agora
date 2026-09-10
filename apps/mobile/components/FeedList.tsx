import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type FlatList,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchCommunities, fetchFeed } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ChromePad, HOME_TAB_REPRESS, useChrome } from "@/lib/chrome";
import { useThemeColors } from "@/lib/preferences";
import { space, type Palette } from "@/lib/theme";
import type { Community, FeedPost } from "@/lib/types";
import { FeedCard } from "./FeedCard";
import { SORT_CHIPS_FIRST_PAINT, SortChips, type SortKey } from "./SortChips";

type Props = {
  community?: string;
  hideCommunity?: boolean;
  header?: ReactNode;
  emptyTitle?: string;
  emptyBody?: string;
  homeRetap?: boolean;
};

function landHomeListAtTop(list: FlatList<FeedPost> | null, then: () => void) {
  list?.scrollToOffset({ offset: 0, animated: false });
  requestAnimationFrame(() => {
    list?.scrollToOffset({ offset: 0, animated: false });
    then();
  });
}

export function FeedList({
  community,
  hideCommunity,
  header,
  emptyTitle = "No posts yet",
  emptyBody = "Join some communities or start the first conversation.",
  homeRetap,
}: Props) {
  const { user } = useAuth();
  const chrome = useChrome();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [chipsH, setChipsH] = useState(SORT_CHIPS_FIRST_PAINT);
  const chipsDockStyle = useAnimatedStyle(() => {
    const shown = 1 - chrome.hidden.value;
    return {
      top: insets.top + space.headerBody * shown,
      height: chipsH * shown,
      overflow: shown === 1 ? "visible" : "hidden",
    };
  });
  const chipsPadStyle = useAnimatedStyle(() => ({
    height: chipsH * (1 - chrome.hidden.value),
  }));
  const listRef = useRef<FlatList<FeedPost>>(null);
  const showMyFeed = Boolean(user) && !community;
  const [sort, setSort] = useState<SortKey>(() => (user && !community ? "my" : "trending"));
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(2);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [formats, setFormats] = useState<Record<string, Community["postFormat"]>>({});

  const showNsfw = Boolean(user?.showNsfw);
  const sortRef = useRef(sort);
  const showMyFeedRef = useRef(showMyFeed);
  sortRef.current = sort;
  showMyFeedRef.current = showMyFeed;

  const load = useCallback(
    async (next: number, replace: boolean) => {
      const data = await fetchFeed({
        sort,
        page: next,
        scope: sort === "my" ? "joined" : "all",
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
    if (sort === "my" && !showMyFeed) setSort("trending");
  }, [showMyFeed, sort]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(1, true);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    if (!homeRetap) return;
    const sub = DeviceEventEmitter.addListener(HOME_TAB_REPRESS, () => {
      chrome.reveal();
      // Home tab lands on My Feed. Do not refresh Recent/Top in place.
      if (showMyFeedRef.current && sortRef.current !== "my") {
        setSort("my");
        landHomeListAtTop(listRef.current, () => {});
        return;
      }
      landHomeListAtTop(listRef.current, onRefresh);
    });
    return () => sub.remove();
  }, [chrome, homeRetap, onRefresh]);

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
    <View style={styles.fill}>
      <Animated.FlatList
        ref={listRef}
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedCard post={item} hideCommunity={hideCommunity} />}
        onScroll={chrome.onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 10, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.emerald}
            colors={[colors.emerald]}
            progressBackgroundColor={colors.card}
            progressViewOffset={chrome.headerHeight + chipsH}
          />
        }
        onEndReached={onEnd}
        onEndReachedThreshold={0.6}
        ListHeaderComponent={
          <View>
            <ChromePad edge="top" extra={0} />
            <Animated.View style={[{ height: chipsH }, chipsPadStyle]} />
            <View style={{ height: 8 }} />
            {refreshing ? (
              <ActivityIndicator color={colors.emerald} style={styles.refreshSpinner} />
            ) : null}
            {header}
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
          <View>
            {loadingMore ? (
              <ActivityIndicator color={colors.emerald} style={{ marginVertical: 16 }} />
            ) : !nextPage && visible.length > 0 ? (
              <Text style={styles.end}>You’ve reached the end</Text>
            ) : null}
            <ChromePad edge="bottom" extra={24} />
          </View>
        }
      />
      <Animated.View pointerEvents="box-none" style={[styles.chipsDock, chipsDockStyle]}>
        <SortChips
          value={sort}
          onChange={setSort}
          showMyFeed={showMyFeed}
          onHeight={(h) => {
            if (h >= 36) setChipsH((prev) => (h > prev ? h : prev));
          }}
        />
      </Animated.View>
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    fill: { flex: 1 },
    chipsDock: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: 15,
      backgroundColor: colors.bg,
    },
    refreshSpinner: { marginBottom: 10 },
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
}

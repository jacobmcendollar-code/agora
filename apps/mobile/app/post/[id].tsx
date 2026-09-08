import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  findNodeHandle,
  Image,
  InteractionManager,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardEvent,
} from "react-native";
import { useFocusEffect, useGlobalSearchParams, useLocalSearchParams, useRouter } from "expo-router";
import { CommentComposer, type ComposerDraft } from "@/components/CommentComposer";
import { EdgeSwipeBack } from "@/components/EdgeSwipeBack";
import { CommentThread } from "@/components/CommentThread";
import { LinkPreviewCard } from "@/components/LinkPreviewCard";
import { PostMetaRow } from "@/components/PostMetaRow";
import { ScreenScroll } from "@/components/Screen";
import { VoteSpears } from "@/components/VoteSpears";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import {
  buildCommentTree,
  createComment,
  fetchCommunities,
  fetchPostDetail,
  peekCachedPost,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useChrome } from "@/lib/chrome";
import { getYouTubeId, isGenericBody } from "@/lib/media";
import { findNotificationComment } from "@/lib/notification";
import { usePreferences, useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";
import type { CommentNode, Community, FeedPost } from "@/lib/types";

type PostSearch = {
  id: string;
  comment?: string | string[];
  commentUser?: string | string[];
  at?: string | string[];
};

function param(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function pickParam(local: PostSearch, global: PostSearch, key: keyof PostSearch): string | undefined {
  return param(local[key]) || param(global[key]);
}

export default function PostDetailScreen() {
  const local = useLocalSearchParams<PostSearch>();
  const global = useGlobalSearchParams<PostSearch>();
  const id = pickParam(local, global, "id");
  const commentId = pickParam(local, global, "comment");
  const commentUser = pickParam(local, global, "commentUser");
  const commentAt = pickParam(local, global, "at");
  const { user } = useAuth();
  const { openSocialInNativeApp } = usePreferences();
  const chrome = useChrome();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const didScroll = useRef(false);
  const pendingNode = useRef<View | null>(null);
  const pendingKind = useRef<"comment" | "list" | null>(null);
  const scrollOffset = useRef(0);
  const commentsAnchor = useRef<View>(null);
  const replyBoxNode = useRef<View | null>(null);
  const replyInputRef = useRef<TextInput>(null);
  const keyboardHeight = useRef(0);
  const scrollGen = useRef(0);
  const [kbPad, setKbPad] = useState(0);
  const cached = id ? peekCachedPost(id) : undefined;
  const [post, setPost] = useState<FeedPost | undefined>(cached);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [sort, setSort] = useState<"best" | "newest">("best");
  const [loading, setLoading] = useState(!cached);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const commentBoxRef = useRef<View>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunities()
      .then(setCommunities)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setCommentsLoaded(false);
    fetchPostDetail(id)
      .then((data) => {
        if (cancelled) return;
        setPost(data.post);
        setComments(data.comments);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (!cached) setError(err instanceof Error ? err.message : "Post not found");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setCommentsLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const format =
    post?.community?.postFormat ||
    communities.find((c) => c.name === post?.community?.name)?.postFormat;
  const tree = useMemo(() => buildCommentTree(comments, sort), [comments, sort]);
  const targetComment = useMemo(
    () => findNotificationComment(tree, { commentId, commentUser, at: commentAt }),
    [tree, commentId, commentUser, commentAt]
  );
  const wantComment = Boolean(commentId || commentUser);

  useEffect(() => {
    didScroll.current = false;
    pendingNode.current = null;
    pendingKind.current = null;
  }, [id, commentId, commentUser, commentAt]);

  const tryScroll = useCallback(
    (node: View, kind: "comment" | "list", attempt = 0) => {
      if (kind === "list" && pendingKind.current === "comment") return;
      if (didScroll.current && pendingKind.current === "comment") return;
      if (didScroll.current && kind === "list") return;

      const scroll = scrollRef.current;
      const relative = contentRef.current;
      if (!scroll) {
        if (attempt < 30) setTimeout(() => tryScroll(node, kind, attempt + 1), 50);
        return;
      }

      const apply = (contentY: number) => {
        if (kind === "list" && pendingKind.current === "comment") return;
        pendingKind.current = kind;
        didScroll.current = true;
        scroll.scrollTo({ y: Math.max(0, contentY), animated: true });
      };

      const viaLayout = () => {
        const handle = relative ? findNodeHandle(relative) : null;
        if (!handle) {
          if (attempt < 30) setTimeout(() => tryScroll(node, kind, attempt + 1), 50);
          return;
        }
        node.measureLayout(
          handle,
          (_x, y) => {
            if (kind === "comment" && y < 24 && attempt < 24) {
              setTimeout(() => tryScroll(node, kind, attempt + 1), 50);
              return;
            }
            apply(y - 16);
          },
          () => {
            if (attempt < 30) setTimeout(() => tryScroll(node, kind, attempt + 1), 50);
          }
        );
      };

      node.measureInWindow((_x: number, nodeY: number, _w: number, nodeH: number) => {
        if (kind === "list" && pendingKind.current === "comment") return;
        const missing = nodeH < 8;
        if (missing && attempt < 30) {
          setTimeout(() => tryScroll(node, kind, attempt + 1), 50);
          return;
        }
        const targetWindowY = chrome.headerHeight + 16;
        const nextY = scrollOffset.current + (nodeY - targetWindowY);
        // Off-screen / pre-layout comments can report ~0; fall back to measureLayout.
        if (kind === "comment" && nodeY < 8 && attempt < 20) {
          viaLayout();
          return;
        }
        apply(nextY);
      });
    },
    [chrome.headerHeight]
  );

  const scrollToNode = useCallback(
    (node: View, kind: "comment" | "list" = "comment") => {
      pendingNode.current = node;
      if (kind === "comment" && pendingKind.current !== "comment") {
        didScroll.current = false;
      }
      tryScroll(node, kind, 0);
    },
    [tryScroll]
  );

  useEffect(() => {
    if (!commentsLoaded || !wantComment || targetComment || didScroll.current) return;
    const node = commentsAnchor.current;
    if (node) scrollToNode(node, "list");
  }, [commentsLoaded, wantComment, targetComment, comments.length, scrollToNode]);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        if (didScroll.current && pendingKind.current === "comment") return;
        if (pendingNode.current) {
          tryScroll(pendingNode.current, pendingKind.current || "comment", 0);
          return;
        }
        if (commentsLoaded && wantComment && !targetComment && commentsAnchor.current) {
          scrollToNode(commentsAnchor.current, "list");
        }
      });
      return () => task.cancel();
    }, [commentsLoaded, wantComment, targetComment, tryScroll, scrollToNode])
  );

  const youtubeId = getYouTubeId(post?.url);
  const showBody = !!(post?.body && !isGenericBody(post.body) && !post.url);
  const showLinkCard = !!(post?.url && !youtubeId);

  const scrollNodeIntoView = useCallback(
    (node: View, attempt = 0) => {
      const gen = scrollGen.current;
      const again = (next: number, wait: number) => {
        setTimeout(() => {
          if (scrollGen.current === gen) scrollNodeIntoView(node, next);
        }, wait);
      };
      const scroll = scrollRef.current;
      if (!scroll) {
        if (attempt < 24) again(attempt + 1, 50);
        return;
      }

      node.measureInWindow((_x, y, _w, h) => {
        if (scrollGen.current !== gen) return;
        if (h < 8 && attempt < 24) {
          again(attempt + 1, 50);
          return;
        }

        const windowH = Dimensions.get("window").height;
        const kb = keyboardHeight.current;
        const visibleTop = chrome.headerHeight + 12;
        // Tab bar overlays the screen (includes home indicator). Keyboard covers it when up.
        const reservedBottom = Math.max(kb, chrome.tabBarHeight) + 16;
        const visibleBottom = windowH - reservedBottom;
        const boxTop = y;
        const boxBottom = y + Math.max(h, 8);
        const visibleH = Math.max(80, visibleBottom - visibleTop);

        let delta = 0;
        if (h >= visibleH) {
          delta = boxTop - visibleTop;
        } else if (boxBottom > visibleBottom) {
          delta = boxBottom - visibleBottom;
        } else if (boxTop < visibleTop) {
          delta = boxTop - visibleTop;
        }

        if (Math.abs(delta) < 6) return;
        scroll.scrollTo({ y: Math.max(0, scrollOffset.current + delta), animated: true });
        if (attempt < 6) again(attempt + 1, 180);
      });
    },
    [chrome.headerHeight, chrome.tabBarHeight]
  );

  const scheduleComposerScroll = useCallback(
    (node: View, focusReply = false) => {
      scrollGen.current += 1;
      const run = () => {
        scrollNodeIntoView(node, 0);
        if (focusReply) replyInputRef.current?.focus();
      };
      run();
      requestAnimationFrame(run);
      InteractionManager.runAfterInteractions(run);
      setTimeout(run, 80);
      setTimeout(run, 280);
    },
    [scrollNodeIntoView]
  );

  const onReplyBoxReady = useCallback(
    (node: View) => {
      replyBoxNode.current = node;
      replyInputRef.current?.focus();
      // Clear the tab / home-indicator overlay now; the keyboard listener forces the real scroll.
      if (keyboardHeight.current === 0) scrollNodeIntoView(node, 0);
    },
    [scrollNodeIntoView]
  );

  const forceReplyScroll = useCallback(() => {
    const node = replyBoxNode.current;
    if (!node) return;
    scrollGen.current += 1;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollNodeIntoView(node, 0);
        replyInputRef.current?.focus();
      });
    });
  }, [scrollNodeIntoView]);

  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      keyboardHeight.current = e.endCoordinates.height;
      setKbPad(e.endCoordinates.height);
      if (!replyTo) return;
      forceReplyScroll();
    };
    const onHide = () => {
      keyboardHeight.current = 0;
      setKbPad(0);
    };
    const will = Keyboard.addListener("keyboardWillShow", onShow);
    const did = Keyboard.addListener("keyboardDidShow", onShow);
    const hide = Keyboard.addListener("keyboardDidHide", onHide);
    return () => {
      will.remove();
      did.remove();
      hide.remove();
    };
  }, [replyTo, forceReplyScroll]);

  useEffect(() => {
    if (!replyTo) {
      replyBoxNode.current = null;
      chrome.unpin();
      return;
    }
    chrome.pin();
    return () => chrome.unpin();
  }, [replyTo, chrome]);

  function onReply(id: string) {
    if (!user) {
      router.push("/login");
      return;
    }
    if (replyTo === id) {
      replyBoxNode.current = null;
      Keyboard.dismiss();
      chrome.unpin();
      setReplyTo(null);
    } else {
      chrome.pin();
      setReplyTo(id);
    }
  }

  async function submitComment(parentId: string | null, draft: ComposerDraft): Promise<boolean> {
    if (!user) {
      router.push("/login");
      return false;
    }
    if (!id || (!draft.body.trim() && !draft.imageUrl)) return false;
    setPosting(true);
    try {
      await createComment({
        postId: id,
        body: draft.body.trim(),
        parentId,
        imageUrl: draft.imageUrl,
      });
      if (parentId) setReplyTo(null);
      const data = await fetchPostDetail(id);
      setPost(data.post);
      setComments(data.comments);
      return true;
    } catch (err) {
      Alert.alert("Could not comment", err instanceof Error ? err.message : "Try again");
      return false;
    } finally {
      setPosting(false);
    }
  }

  if (loading && !post) {
    return (
      <EdgeSwipeBack>
        <View style={styles.center}>
          <ActivityIndicator color={colors.emerald} />
        </View>
      </EdgeSwipeBack>
    );
  }

  if (!post) {
    return (
      <EdgeSwipeBack>
        <View style={styles.center}>
          <Text style={{ color: colors.muted }}>{error || "Post not found"}</Text>
        </View>
      </EdgeSwipeBack>
    );
  }

  const linkUrl = post.url;

  return (
    <EdgeSwipeBack>
    <ScreenScroll
      scrollRef={scrollRef}
      avoidKeyboard
      keyboardInsets
      endSpacer={replyTo ? chrome.tabBarHeight + 80 + (Platform.OS === "android" ? kbPad : 0) : 0}
      onScrollOffset={(y) => {
        scrollOffset.current = y;
      }}
    >
      <View ref={contentRef} collapsable={false}>
      <View style={styles.card}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <VoteSpears targetType="post" targetId={post.id} initialScore={post.score} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{post.title}</Text>
            {format === "discussion" ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>Discussion</Text>
              </View>
            ) : null}

            {youtubeId ? (
              <View style={{ marginTop: 12 }}>
                <YouTubeEmbed videoId={youtubeId} title={post.title} />
              </View>
            ) : null}

            {showLinkCard && linkUrl ? (
              <LinkPreviewCard
                url={linkUrl}
                title={post.title}
                thumbnail={post.thumbnail}
                communityTitle={post.community.title}
                openSocialInNativeApp={openSocialInNativeApp}
              />
            ) : null}

            {!post.url && post.thumbnail ? (
              <Image source={{ uri: post.thumbnail }} style={styles.image} />
            ) : null}

            {showBody ? <Text style={styles.body}>{post.body}</Text> : null}

            <PostMetaRow post={post} style={styles.metaRow} />
          </View>
        </View>
      </View>

      <View
        ref={commentBoxRef}
        collapsable={false}
        style={styles.commentBox}
      >
        {user ? (
          <CommentComposer
            placeholder="Add a comment"
            submitLabel="Comment"
            posting={posting}
            onSubmit={(draft) => submitComment(null, draft)}
            onFocus={() => {
              if (replyTo) return;
              if (commentBoxRef.current) scheduleComposerScroll(commentBoxRef.current);
            }}
          />
        ) : (
          <Pressable onPress={() => router.push("/login")}>
            <Text style={styles.loginHint}>Log in to comment</Text>
          </Pressable>
        )}
      </View>

      <View ref={commentsAnchor} collapsable={false} style={styles.sortRow}>
        {(["best", "newest"] as const).map((key) => (
          <Pressable key={key} onPress={() => setSort(key)}>
            <Text style={[styles.sort, sort === key && styles.sortActive]}>
              {key === "best" ? "Best" : "Newest"}
            </Text>
          </Pressable>
        ))}
        <Text style={styles.count}>{comments.length} comments</Text>
      </View>

      {comments.length === 0 ? (
        <Text style={styles.empty}>
          {error
            ? "Comments load from GET /api/posts/[id] after this PR is deployed."
            : "No comments yet"}
        </Text>
      ) : (
        <View style={styles.threadList} collapsable={false}>
          {tree.map((c) => (
            <CommentThread
              key={c.id}
              comment={c}
              onReply={onReply}
              replyTo={replyTo}
              onReplyBoxReady={onReplyBoxReady}
              replyBox={
                <CommentComposer
                  placeholder="Write a reply"
                  submitLabel="Reply"
                  posting={posting}
                  inputRef={replyInputRef}
                  autoFocus
                  onSubmit={(draft) => submitComment(replyTo, draft)}
                  onFocus={() => {
                    if (keyboardHeight.current > 0) forceReplyScroll();
                  }}
                />
              }
              highlightId={targetComment?.id}
              onHighlightReady={(node) => scrollToNode(node, "comment")}
            />
          ))}
        </View>
      )}
      </View>
    </ScreenScroll>
    </EdgeSwipeBack>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "700", lineHeight: 26 },
  pill: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  body: { color: colors.text, marginTop: 12, fontSize: 16, lineHeight: 23 },
  image: { width: "100%", height: 220, borderRadius: 12, marginTop: 12, backgroundColor: colors.field },
  metaRow: { marginTop: 14 },
  commentBox: {
    marginTop: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
  },
  loginHint: { color: colors.emerald, fontWeight: "600", textAlign: "center", paddingVertical: 8 },
  sortRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 20, marginBottom: 8 },
  sort: { color: colors.faint, fontWeight: "600" },
  sortActive: { color: colors.text },
  count: { marginLeft: "auto", color: colors.faint, fontSize: 12 },
  empty: { color: colors.muted, marginTop: 12 },
  threadList: { marginTop: 8, gap: 10 },
  });
}

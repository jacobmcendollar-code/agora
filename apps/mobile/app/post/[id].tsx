import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  findNodeHandle,
  Image,
  InteractionManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useGlobalSearchParams, useLocalSearchParams, useRouter } from "expo-router";
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
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const didScroll = useRef(false);
  const pendingNode = useRef<View | null>(null);
  const commentsAnchor = useRef<View>(null);
  const cached = id ? peekCachedPost(id) : undefined;
  const [post, setPost] = useState<FeedPost | undefined>(cached);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [sort, setSort] = useState<"best" | "newest">("best");
  const [loading, setLoading] = useState(!cached);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
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
  }, [id, commentId, commentUser, commentAt]);

  const tryScroll = useCallback((node: View, attempt = 0) => {
    if (didScroll.current) return;
    const scroll = scrollRef.current;
    const relative = contentRef.current;
    const handle = relative ? findNodeHandle(relative) : null;
    if (!scroll || !handle) {
      if (attempt < 15) setTimeout(() => tryScroll(node, attempt + 1), 40);
      return;
    }
    node.measureLayout(
      handle,
      (_x, y) => {
        if (didScroll.current) return;
        didScroll.current = true;
        scroll.scrollTo({ y: Math.max(0, y - 16), animated: true });
      },
      () => {
        if (attempt < 15) setTimeout(() => tryScroll(node, attempt + 1), 40);
      }
    );
  }, []);

  const scrollToNode = useCallback(
    (node: View) => {
      pendingNode.current = node;
      tryScroll(node, 0);
    },
    [tryScroll]
  );

  useEffect(() => {
    if (!commentsLoaded || !wantComment || targetComment || didScroll.current) return;
    const node = commentsAnchor.current;
    if (node) scrollToNode(node);
  }, [commentsLoaded, wantComment, targetComment, comments.length, scrollToNode]);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        if (didScroll.current) return;
        if (pendingNode.current) {
          tryScroll(pendingNode.current, 0);
          return;
        }
        if (commentsLoaded && wantComment && !targetComment && commentsAnchor.current) {
          scrollToNode(commentsAnchor.current);
        }
      });
      return () => task.cancel();
    }, [commentsLoaded, wantComment, targetComment, tryScroll, scrollToNode])
  );

  const youtubeId = getYouTubeId(post?.url);
  const showBody = !!(post?.body && !isGenericBody(post.body) && !post.url);
  const showLinkCard = !!(post?.url && !youtubeId);

  async function onComment() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!id || !commentBody.trim()) return;
    setPosting(true);
    try {
      await createComment({ postId: id, body: commentBody.trim(), parentId: replyTo });
      setCommentBody("");
      setReplyTo(null);
      const data = await fetchPostDetail(id);
      setPost(data.post);
      setComments(data.comments);
    } catch (err) {
      Alert.alert("Could not comment", err instanceof Error ? err.message : "Try again");
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
    <ScreenScroll scrollRef={scrollRef}>
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

      <View style={styles.commentBox}>
        {user ? (
          <>
            {replyTo ? (
              <Pressable onPress={() => setReplyTo(null)}>
                <Text style={styles.replying}>Replying · tap to cancel</Text>
              </Pressable>
            ) : null}
            <TextInput
              value={commentBody}
              onChangeText={setCommentBody}
              placeholder="Add a comment"
              placeholderTextColor={colors.faint}
              multiline
              style={styles.input}
            />
            <Pressable
              style={[styles.primary, (!commentBody.trim() || posting) && { opacity: 0.5 }]}
              onPress={onComment}
              disabled={!commentBody.trim() || posting}
            >
              <Text style={styles.primaryText}>{posting ? "Posting…" : "Comment"}</Text>
            </Pressable>
          </>
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
        <View style={styles.threadList}>
          {tree.map((c) => (
            <CommentThread
              key={c.id}
              comment={c}
              onReply={setReplyTo}
              highlightId={targetComment?.id}
              onHighlightReady={scrollToNode}
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
  input: {
    minHeight: 80,
    color: colors.text,
    fontSize: 16,
    textAlignVertical: "top",
  },
  primary: {
    marginTop: 8,
    backgroundColor: colors.emeraldDark,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryText: { color: colors.white, fontWeight: "700" },
  loginHint: { color: colors.emerald, fontWeight: "600", textAlign: "center", paddingVertical: 8 },
  replying: { color: colors.emerald, fontSize: 12, marginBottom: 6 },
  sortRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 20, marginBottom: 8 },
  sort: { color: colors.faint, fontWeight: "600" },
  sortActive: { color: colors.text },
  count: { marginLeft: "auto", color: colors.faint, fontSize: 12 },
  empty: { color: colors.muted, marginTop: 12 },
  threadList: { marginTop: 8, gap: 10 },
  });
}

import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenScroll } from "@/components/Screen";
import { Username } from "@/components/Username";
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
import {
  getYouTubeId,
  isGenericBody,
  isTikTokLink,
  isXLink,
  openExternal,
} from "@/lib/media";
import { usePreferences } from "@/lib/preferences";
import { colors } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import type { CommentNode, Community, FeedPost } from "@/lib/types";

function CommentBlock({
  comment,
  postId,
  onReply,
}: {
  comment: CommentNode;
  postId: string;
  onReply: (id: string) => void;
}) {
  return (
    <View style={styles.comment}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <VoteSpears
          targetType="comment"
          targetId={comment.id}
          initialScore={comment.score}
          size="sm"
        />
        <View style={{ flex: 1 }}>
          <View style={styles.commentMetaRow}>
            <Username username={comment.author.username} style={styles.commentMeta} />
            <Text style={styles.commentMeta}> · {timeAgo(comment.createdAt)}</Text>
          </View>
          <Text style={styles.commentBody}>{comment.body}</Text>
          {comment.imageUrl ? (
            <Image source={{ uri: comment.imageUrl }} style={styles.commentImg} />
          ) : null}
          <Pressable onPress={() => onReply(comment.id)} hitSlop={6}>
            <Text style={styles.reply}>Reply</Text>
          </Pressable>
        </View>
      </View>
      {comment.replies?.map((reply) => (
        <View key={reply.id} style={styles.replyBlock}>
          <CommentBlock comment={reply} postId={postId} onReply={onReply} />
        </View>
      ))}
    </View>
  );
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { openSocialInNativeApp } = usePreferences();
  const router = useRouter();
  const cached = id ? peekCachedPost(id) : undefined;
  const [post, setPost] = useState<FeedPost | undefined>(cached);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [sort, setSort] = useState<"best" | "newest">("best");
  const [loading, setLoading] = useState(!cached);
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
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const format =
    post?.community?.postFormat ||
    communities.find((c) => c.name === post?.community?.name)?.postFormat;
  const tree = useMemo(() => buildCommentTree(comments, sort), [comments, sort]);
  const youtubeId = getYouTubeId(post?.url);
  const showBody = !!(post?.body && !isGenericBody(post.body) && !post.url);

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
      <View style={styles.center}>
        <ActivityIndicator color={colors.emerald} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.muted }}>{error || "Post not found"}</Text>
      </View>
    );
  }

  return (
    <ScreenScroll includeTabs={false}>
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

            {!youtubeId && post.url && (isXLink(post.url) || isTikTokLink(post.url)) ? (
              <Pressable
                style={styles.linkBtn}
                onPress={() => openExternal(post.url!, openSocialInNativeApp)}
              >
                <Text style={styles.linkBtnText}>
                  Open {isTikTokLink(post.url) ? "TikTok" : "X"}
                </Text>
              </Pressable>
            ) : null}

            {!youtubeId && post.url && !isXLink(post.url) && !isTikTokLink(post.url) ? (
              <Pressable style={styles.linkBtn} onPress={() => openExternal(post.url!, false)}>
                <Text style={styles.linkBtnText} numberOfLines={2}>
                  {post.url}
                </Text>
              </Pressable>
            ) : null}

            {!post.url && post.thumbnail ? (
              <Image source={{ uri: post.thumbnail }} style={styles.image} />
            ) : null}

            {showBody ? <Text style={styles.body}>{post.body}</Text> : null}

            <View style={styles.metaRow}>
              <Pressable onPress={() => router.push(`/community/${post.community.name}`)}>
                <Text style={styles.community}>{post.community.title}</Text>
              </Pressable>
              <Username username={post.author.username} style={styles.meta} />
              <Text style={styles.meta}>{timeAgo(post.createdAt)}</Text>
            </View>
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

      <View style={styles.sortRow}>
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
        tree.map((c) => (
          <CommentBlock key={c.id} comment={c} postId={post.id} onReply={setReplyTo} />
        ))
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
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
  linkBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    borderRadius: 10,
    padding: 10,
  },
  linkBtnText: { color: colors.emerald, fontSize: 13 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14, alignItems: "center" },
  community: { color: colors.text, fontWeight: "700", fontSize: 13 },
  meta: { color: colors.muted, fontSize: 13 },
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
  comment: { marginTop: 14 },
  commentMetaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginBottom: 4 },
  commentMeta: { color: colors.faint, fontSize: 12 },
  commentBody: { color: colors.text, fontSize: 15, lineHeight: 21 },
  commentImg: { width: "100%", height: 160, borderRadius: 10, marginTop: 8 },
  reply: { color: colors.muted, marginTop: 6, fontSize: 12, fontWeight: "600" },
  replyBlock: { marginLeft: 22, marginTop: 4 },
});

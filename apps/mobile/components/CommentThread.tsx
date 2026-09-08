import { useEffect, useRef, useState, type ReactNode } from "react";
import { Image, InteractionManager, Pressable, StyleSheet, Text, View } from "react-native";
import { Username } from "@/components/Username";
import { VoteSpears } from "@/components/VoteSpears";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import type { CommentNode } from "@/lib/types";

function countReplies(comment: CommentNode): number {
  const replies = comment.replies || [];
  return replies.reduce((total, reply) => total + 1 + countReplies(reply), 0);
}

export function CommentThread({
  comment,
  onReply,
  replyTo,
  replyBox,
  onReplyBoxReady,
  depth = 0,
  highlightId,
  onHighlightReady,
}: {
  comment: CommentNode;
  onReply: (id: string) => void;
  replyTo?: string | null;
  replyBox?: ReactNode;
  onReplyBoxReady?: (node: View) => void;
  depth?: number;
  highlightId?: string | null;
  onHighlightReady?: (node: View) => void;
}) {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [collapsed, setCollapsed] = useState(false);
  const replies = comment.replies || [];
  const replyCount = countReplies(comment);
  const deleted = comment.moderationStatus === "author_deleted";
  const nested = depth > 0;
  const highlighted = highlightId === comment.id;
  const replying = replyTo === comment.id;
  const cardRef = useRef<View>(null);
  const replyBoxRef = useRef<View>(null);

  useEffect(() => {
    if (highlighted && cardRef.current) onHighlightReady?.(cardRef.current);
  }, [highlighted, comment.id, onHighlightReady]);

  useEffect(() => {
    if (!replying) return;
    let cancelled = false;
    const announce = () => {
      if (!cancelled && replyBoxRef.current) onReplyBoxReady?.(replyBoxRef.current);
    };
    announce();
    const raf = requestAnimationFrame(announce);
    const task = InteractionManager.runAfterInteractions(announce);
    const t1 = setTimeout(announce, 80);
    const t2 = setTimeout(announce, 280);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      task.cancel();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [replying, onReplyBoxReady]);

  if (collapsed && !highlighted) {
    return (
      <View style={nested ? styles.nested : undefined}>
        <Pressable
          onPress={() => setCollapsed(false)}
          style={[styles.card, styles.collapsed]}
          accessibilityLabel="Expand comment"
        >
          <Text style={styles.collapsedText} numberOfLines={1}>
            <Text style={styles.collapsedName}>
              {deleted ? "[deleted]" : comment.author.username}
            </Text>
            {replyCount > 0
              ? ` · ${replyCount} ${replyCount === 1 ? "reply" : "replies"} hidden`
              : " · comment hidden"}
          </Text>
          <Text style={styles.collapseAction}>Expand</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={nested ? styles.nested : undefined}>
      <View
        ref={cardRef}
        collapsable={false}
        onLayout={() => {
          if (highlighted && cardRef.current) onHighlightReady?.(cardRef.current);
        }}
        style={[styles.card, highlighted && styles.highlight]}
      >
        <View style={styles.row}>
          <VoteSpears
            targetType="comment"
            targetId={comment.id}
            initialScore={comment.score}
            size="sm"
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.metaRow}>
              <View style={styles.metaLeft}>
                {deleted ? (
                  <Text style={styles.deletedMeta}>[deleted]</Text>
                ) : (
                  <Username username={comment.author.username} style={styles.author} />
                )}
                <Text style={styles.meta}> · {timeAgo(comment.createdAt)}</Text>
              </View>
              <Pressable onPress={() => setCollapsed(true)} hitSlop={8}>
                <Text style={styles.collapseAction}>Collapse</Text>
              </Pressable>
            </View>
            <Text style={deleted ? styles.deletedBody : styles.body}>
              {deleted ? "[deleted]" : comment.body}
            </Text>
            {!deleted && comment.imageUrl ? (
              <Image source={{ uri: comment.imageUrl }} style={styles.image} />
            ) : null}
            {!deleted ? (
              <Pressable onPress={() => onReply(comment.id)} hitSlop={6}>
                <Text style={styles.reply}>{replying ? "Cancel" : "Reply"}</Text>
              </Pressable>
            ) : null}
            {replying ? (
              <View
                ref={replyBoxRef}
                collapsable={false}
                onLayout={() => {
                  if (replyBoxRef.current) onReplyBoxReady?.(replyBoxRef.current);
                }}
                style={styles.replyBox}
              >
                {replyBox}
              </View>
            ) : null}
          </View>
        </View>
      </View>
      {replies.length > 0 ? (
        <View style={styles.replies}>
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              onReply={onReply}
              replyTo={replyTo}
              replyBox={replyBox}
              onReplyBoxReady={onReplyBoxReady}
              depth={depth + 1}
              highlightId={highlightId}
              onHighlightReady={onHighlightReady}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    nested: {
      marginLeft: 10,
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
    },
    highlight: {
      borderColor: colors.emerald,
      backgroundColor: colors.hero,
    },
    collapsed: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      paddingVertical: 10,
    },
    collapsedText: { flex: 1, color: colors.muted, fontSize: 12 },
    collapsedName: { color: colors.emerald, fontWeight: "600" },
    collapseAction: { color: colors.faint, fontSize: 12, fontWeight: "600" },
    row: { flexDirection: "row", gap: 10 },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 4,
    },
    metaLeft: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", flex: 1, minWidth: 0 },
    author: { color: colors.emerald, fontSize: 12, fontWeight: "600" },
    meta: { color: colors.faint, fontSize: 12 },
    deletedMeta: { color: colors.faint, fontSize: 12, fontWeight: "600" },
    body: { color: colors.text, fontSize: 15, lineHeight: 21 },
    deletedBody: { color: colors.faint, fontSize: 15, fontStyle: "italic" },
    image: { width: "100%", height: 160, borderRadius: 10, marginTop: 8, backgroundColor: colors.field },
    reply: { color: colors.muted, marginTop: 8, fontSize: 12, fontWeight: "600" },
    replyBox: { marginTop: 10 },
    replies: { marginTop: 8, gap: 8 },
  });
}

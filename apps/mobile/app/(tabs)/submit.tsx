import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createPost, fetchCommunities, fetchLinkPreview, uploadImage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";
import type { Community, PostFormat } from "@/lib/types";
import { ScreenScroll } from "@/components/Screen";

type PostType = "text" | "link" | "image";

function allowedTypes(format: PostFormat | undefined): PostType[] {
  if (format === "discussion") return ["text"];
  if (format === "media") return ["link", "image"];
  return ["link", "image", "text"];
}

export default function SubmitScreen() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ community?: string }>();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(params.community || "");
  const [postType, setPostType] = useState<PostType>("link");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingPostId, setExistingPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const titleFilledFor = useRef<string | null>(null);

  const showNsfw = Boolean(user?.showNsfw);
  const visible = communities.filter((c) => showNsfw || !c.nsfw);
  const selectedCommunity = communities.find((c) => c.name === selected);
  const format = selectedCommunity?.postFormat || "any";
  const typesAllowed = allowedTypes(selected ? format : "any");

  useEffect(() => {
    fetchCommunities()
      .then(setCommunities)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (params.community) setSelected(params.community);
  }, [params.community]);

  useEffect(() => {
    if (!typesAllowed.includes(postType)) setPostType(typesAllowed[0]);
  }, [postType, typesAllowed]);

  useEffect(() => {
    if (postType !== "link" || !url.trim()) {
      setPreviewThumb(null);
      return;
    }
    const trimmed = url.trim();
    const timer = setTimeout(async () => {
      try {
        const data = await fetchLinkPreview(trimmed);
        setPreviewThumb(data.thumbnail || null);
        if (data.title && titleFilledFor.current !== trimmed && !title.trim()) {
          setTitle(data.title);
          titleFilledFor.current = trimmed;
        }
      } catch {
        setPreviewThumb(null);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [url, postType, title]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return visible
      .filter((c) => c.title.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, visible]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      setError("Could not read that image");
      return;
    }
    if ((asset.fileSize || 0) > 4 * 1024 * 1024) {
      setError("Image must be under 4MB");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const data = await uploadImage({
        fileName: asset.fileName || "image.jpg",
        fileType: asset.mimeType || "image/jpeg",
        fileData: asset.base64,
      });
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit() {
    setError(null);
    setExistingPostId(null);
    if (!selected) {
      setError("Please select a community");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    if (postType === "link" && !url.trim()) {
      setError("Please enter a link");
      return;
    }
    if (postType === "image" && !imageUrl) {
      setError("Please upload an image");
      return;
    }
    setLoading(true);
    try {
      const data = await createPost({
        communityName: selected,
        title: title.trim(),
        body: postType === "link" ? null : body.trim() || null,
        url: postType === "link" ? url.trim() || null : null,
        imageUrl: postType === "image" ? imageUrl : null,
      });
      router.push(`/post/${data.id}`);
    } catch (err) {
      const extra = err as Error & { data?: { existingPostId?: string; error?: string } };
      setError(extra.data?.error || extra.message || "Failed to create post");
      if (extra.data?.existingPostId) setExistingPostId(extra.data.existingPostId);
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.emerald} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.need}>You need an account to post.</Text>
        <Pressable style={styles.primary} onPress={() => router.push("/login")}>
          <Text style={styles.primaryText}>Log in</Text>
        </Pressable>
      </View>
    );
  }

  const typeLabels: { key: PostType; label: string }[] = [
    { key: "link", label: "Link" },
    { key: "image", label: "Image" },
    { key: "text", label: "Text" },
  ];
  const types = typeLabels.filter((t) => typesAllowed.includes(t.key));

  return (
    <ScreenScroll>
      <Text style={styles.heading}>Create a post</Text>
      <Text style={styles.sub}>Posts are lightly checked for spam and off-topic content.</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          {existingPostId ? (
            <Pressable onPress={() => router.push(`/post/${existingPostId}`)}>
              <Text style={styles.link}>Open the existing post</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.label}>Community</Text>
      {selectedCommunity ? (
        <View style={styles.selectedRow}>
          <View style={styles.selectedChip}>
            <Text style={styles.selectedText}>{selectedCommunity.title}</Text>
            <Pressable onPress={() => setSelected("")} hitSlop={8}>
              <Text style={styles.clear}>×</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search communities..."
            placeholderTextColor={colors.faint}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {matches.map((c) => (
            <Pressable
              key={c.name}
              onPress={() => {
                setSelected(c.name);
                setQuery("");
              }}
              style={styles.match}
            >
              <Text style={styles.matchTitle}>{c.title}</Text>
              {c.nsfw ? <Text style={styles.nsfw}>Adult</Text> : null}
            </Pressable>
          ))}
        </>
      )}

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {types.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setPostType(t.key)}
            style={[styles.typeBtn, postType === t.key && styles.typeBtnActive]}
          >
            <Text style={[styles.typeLabel, postType === t.key && styles.typeLabelActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.label}>Title</Text>
        <Text style={styles.counter}>{title.length}/300</Text>
      </View>
      <TextInput
        value={title}
        onChangeText={setTitle}
        maxLength={300}
        placeholder="A clear, descriptive title"
        placeholderTextColor={colors.faint}
        style={styles.input}
      />

      {postType === "link" ? (
        <>
          <Text style={styles.label}>Link</Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
          />
          <Text style={styles.hint}>Add discussion in the comments after posting.</Text>
          {previewThumb ? (
            <Image source={{ uri: previewThumb }} style={styles.preview} />
          ) : null}
        </>
      ) : null}

      {postType === "image" ? (
        <>
          <Text style={styles.label}>Image</Text>
          {imageUrl ? (
            <>
              <Image source={{ uri: imageUrl }} style={styles.preview} />
              <Pressable onPress={() => setImageUrl(null)}>
                <Text style={styles.remove}>Remove image</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.upload} onPress={pickImage} disabled={uploading}>
              <Text style={styles.uploadText}>{uploading ? "Uploading…" : "Choose an image"}</Text>
            </Pressable>
          )}
        </>
      ) : null}

      {postType === "text" || postType === "image" ? (
        <>
          <Text style={styles.label}>Text (optional)</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={postType === "text" ? "Add more detail if you want..." : "Add a caption if you want..."}
            placeholderTextColor={colors.faint}
            multiline
            style={[styles.input, styles.textarea]}
          />
        </>
      ) : null}

      <Pressable
        style={[styles.primary, (loading || uploading || !selected || !title.trim()) && styles.disabled]}
        onPress={onSubmit}
        disabled={loading || uploading || !selected || !title.trim()}
      >
        <Text style={styles.primaryText}>{loading ? "Posting…" : "Post"}</Text>
      </Pressable>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, gap: 12 },
  need: { color: colors.muted, fontSize: 15 },
  heading: { color: colors.text, fontSize: 24, fontWeight: "700" },
  sub: { color: colors.muted, fontSize: 13, marginTop: 6, marginBottom: 16 },
  label: { color: colors.text, fontSize: 13, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textarea: { minHeight: 120, textAlignVertical: "top" },
  selectedRow: { flexDirection: "row" },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedText: { color: colors.text, fontSize: 14 },
  clear: { color: colors.muted, fontSize: 18, lineHeight: 18 },
  match: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  matchTitle: { color: colors.text, fontSize: 14 },
  nsfw: { color: colors.rose, fontSize: 12, fontWeight: "600" },
  typeRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  typeBtnActive: { backgroundColor: colors.emeraldDark },
  typeLabel: { color: colors.muted, fontWeight: "600" },
  typeLabelActive: { color: colors.white },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  counter: { color: colors.faint, fontSize: 12, marginBottom: 8 },
  hint: { color: colors.faint, fontSize: 12, marginTop: 6 },
  preview: { width: "100%", height: 180, borderRadius: 12, marginTop: 12, backgroundColor: colors.field },
  upload: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: "center",
  },
  uploadText: { color: colors.emerald, fontWeight: "600" },
  remove: { color: colors.rose, marginTop: 8, fontSize: 13 },
  primary: {
    marginTop: 22,
    backgroundColor: colors.emeraldDark,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.5 },
  errorBox: {
    backgroundColor: "#3f1d1d",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: { color: "#fecaca", fontSize: 13 },
  link: { color: colors.emerald, marginTop: 8, fontWeight: "600" },
});

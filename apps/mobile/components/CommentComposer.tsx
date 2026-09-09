import { useEffect, useRef, useState, type Ref } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { searchGifs, uploadImage, type GifResult } from "@/lib/api";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

export type ComposerDraft = {
  body: string;
  imageUrl: string | null;
};

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function stripDataUrl(data: string): { fileType: string; fileData: string } {
  const match = data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (match) return { fileType: match[1], fileData: match[2] };
  return { fileType: "image/jpeg", fileData: data };
}

function byteSize(base64: string) {
  return Math.ceil((base64.length * 3) / 4);
}

function ImageIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth={1.8} />
      <Circle cx="9" cy="10" r="1.5" stroke={color} strokeWidth={1.8} />
      <Path d="M21 16l-5-5-9 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CommentComposer({
  placeholder,
  submitLabel,
  posting,
  onSubmit,
  inputRef,
  autoFocus,
  onFocus,
}: {
  placeholder: string;
  submitLabel: string;
  posting: boolean;
  onSubmit: (draft: ComposerDraft) => Promise<boolean>;
  inputRef?: Ref<TextInput>;
  autoFocus?: boolean;
  onFocus?: () => void;
}) {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(Boolean(autoFocus));
  const [gifOpen, setGifOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<GifResult[]>([]);
  const [gifLoading, setGifLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (blurTimer.current) clearTimeout(blurTimer.current);
    };
  }, []);

  const canPost = Boolean(body.trim() || imageUrl) && !posting && !uploading;

  async function uploadFile(fileName: string, fileType: string, fileData: string, fileSize?: number) {
    if ((fileSize ?? byteSize(fileData)) > MAX_IMAGE_BYTES) {
      setError("Image must be under 4MB");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const data = await uploadImage({ fileName, fileType, fileData });
      setImageUrl(data.url);
      setGifOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

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
    await uploadFile(asset.fileName || "image.jpg", asset.mimeType || "image/jpeg", asset.base64, asset.fileSize);
  }

  async function ingestClipboardImage() {
    try {
      if (!(await Clipboard.hasImageAsync())) return;
      const img = await Clipboard.getImageAsync({ format: "jpeg", jpegQuality: 0.85 });
      if (!img?.data) return;
      const parsed = stripDataUrl(img.data);
      await uploadFile("screenshot.jpg", parsed.fileType, parsed.fileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not paste image");
    }
  }

  function handleFocus() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setFocused(true);
    onFocus?.();
  }

  function handleBlur() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => setFocused(false), 180);
  }

  function clearImage() {
    setImageUrl(null);
  }

  function closeGif() {
    setGifOpen(false);
    setGifQuery("");
    setGifResults([]);
    setGifLoading(false);
  }

  function onGifQuery(q: string) {
    setGifQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) {
      setGifResults([]);
      setGifLoading(false);
      return;
    }
    setGifLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        setGifResults(await searchGifs(q));
      } catch (err) {
        setError(err instanceof Error ? err.message : "GIF search failed");
        setGifResults([]);
      } finally {
        setGifLoading(false);
      }
    }, 300);
  }

  function pickGif(gif: GifResult) {
    setImageUrl(gif.url);
    closeGif();
    setError(null);
  }

  async function handleSubmit() {
    if (!canPost) return;
    const ok = await onSubmit({ body, imageUrl });
    if (!ok) return;
    setBody("");
    setImageUrl(null);
    closeGif();
    setError(null);
  }

  return (
    <View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View>
        <TextInput
          ref={inputRef}
          value={body}
          onChangeText={setBody}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          multiline
          maxLength={10000}
          style={styles.input}
          autoFocus={autoFocus}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPaste={() => {
            void ingestClipboardImage();
          }}
        />
        {focused || gifOpen ? (
          <View style={styles.tools}>
            <Pressable
              onPress={pickImage}
              disabled={uploading}
              hitSlop={6}
              accessibilityLabel={uploading ? "Uploading…" : "Add image"}
              style={styles.tool}
            >
              {uploading ? <ActivityIndicator size="small" color={colors.muted} /> : <ImageIcon color={colors.muted} />}
            </Pressable>
            <Pressable
              onPress={() => {
                if (gifOpen) closeGif();
                else setGifOpen(true);
              }}
              hitSlop={6}
              accessibilityLabel="Add GIF"
              style={styles.tool}
            >
              <Text style={styles.toolLabel}>GIF</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      {imageUrl ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: imageUrl }} style={styles.preview} />
          <Pressable
            onPress={clearImage}
            style={styles.remove}
            hitSlop={8}
            accessibilityLabel="Remove image"
          >
            <Text style={styles.removeText}>×</Text>
          </Pressable>
        </View>
      ) : null}
      {gifOpen ? (
        <View style={styles.gifBox}>
          <TextInput
            value={gifQuery}
            onChangeText={onGifQuery}
            placeholder="Search GIFs..."
            placeholderTextColor={colors.faint}
            autoFocus
            style={styles.gifSearch}
          />
          <ScrollView style={styles.gifScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {gifLoading ? <Text style={styles.gifHint}>Searching…</Text> : null}
            {!gifLoading && gifQuery.trim() && gifResults.length === 0 ? (
              <Text style={styles.gifHint}>No GIFs found</Text>
            ) : null}
            {!gifLoading && !gifQuery.trim() ? <Text style={styles.gifHint}>Type to search Giphy</Text> : null}
            {gifResults.length > 0 ? (
              <View style={styles.gifGrid}>
                {gifResults.map((gif) => (
                  <Pressable
                    key={gif.id}
                    onPress={() => pickGif(gif)}
                    style={styles.gifCell}
                    accessibilityLabel={gif.title || "GIF"}
                  >
                    <Image source={{ uri: gif.preview }} style={styles.gifThumb} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>
          <Text style={styles.giphy}>Powered by Giphy</Text>
        </View>
      ) : null}
      <Pressable style={[styles.primary, !canPost && { opacity: 0.5 }]} onPress={handleSubmit} disabled={!canPost}>
        <Text style={styles.primaryText}>{posting ? "Posting…" : submitLabel}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    error: { color: colors.dangerText, fontSize: 13, marginBottom: 8 },
    input: {
      minHeight: 80,
      color: colors.text,
      fontSize: 16,
      textAlignVertical: "top",
    },
    previewWrap: {
      alignSelf: "flex-start",
      marginTop: 8,
      maxWidth: "100%",
    },
    preview: {
      width: 180,
      height: 140,
      borderRadius: 10,
      backgroundColor: colors.field,
    },
    remove: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "rgba(0,0,0,0.75)",
      alignItems: "center",
      justifyContent: "center",
    },
    removeText: { color: colors.white, fontSize: 14, lineHeight: 16, fontWeight: "700" },
    tools: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 6 },
    tool: {
      minHeight: 32,
      minWidth: 32,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    },
    toolLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
    gifBox: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 8,
      backgroundColor: colors.field,
    },
    gifSearch: {
      color: colors.text,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.card,
    },
    gifScroll: { maxHeight: 220, marginTop: 8 },
    gifHint: { color: colors.faint, fontSize: 12, textAlign: "center", paddingVertical: 20 },
    gifGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    gifCell: { width: "31%", aspectRatio: 1, borderRadius: 8, overflow: "hidden" },
    gifThumb: { width: "100%", height: "100%", backgroundColor: colors.card },
    giphy: { color: colors.faint, fontSize: 10, marginTop: 8 },
    primary: {
      marginTop: 8,
      backgroundColor: colors.emeraldDark,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
    },
    primaryText: { color: colors.white, fontWeight: "700" },
  });
}

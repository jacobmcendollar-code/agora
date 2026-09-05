import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { createCommunity } from "@/lib/api";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";
import type { PostFormat } from "@/lib/types";

const FORMATS: { value: PostFormat; label: string; hint: string }[] = [
  { value: "any", label: "Any", hint: "Links, photos, and discussion" },
  { value: "media", label: "Media", hint: "Links and images only" },
  { value: "discussion", label: "Discussion", hint: "Text posts only" },
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function CreateCommunityModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
}) {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nsfw, setNsfw] = useState(false);
  const [postFormat, setPostFormat] = useState<PostFormat>("any");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const slug = useMemo(() => slugify(title), [title]);

  function reset() {
    setTitle("");
    setDescription("");
    setNsfw(false);
    setPostFormat("any");
    setError(null);
    setBusy(false);
  }

  function close() {
    if (busy) return;
    reset();
    onClose();
  }

  async function onSubmit() {
    setError(null);
    if (slug.length < 2) {
      setError("Name must include letters or numbers.");
      return;
    }
    if (!description.trim()) {
      setError("Add a short description.");
      return;
    }
    setBusy(true);
    try {
      const data = await createCommunity({
        title: title.trim(),
        description: description.trim(),
        nsfw,
        postFormat,
      });
      reset();
      onCreated(data.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create community");
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <KeyboardAvoidingView
        style={[styles.wrap, { backgroundColor: colors.bg }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.top}>
          <Pressable onPress={close} hitSlop={8} disabled={busy} style={styles.sideAction}>
            <Text style={styles.cancel} numberOfLines={1}>
              Cancel
            </Text>
          </Pressable>
          <Text style={styles.heading} numberOfLines={1} pointerEvents="none">
            Create Community
          </Text>
          <View style={styles.sideAction} />
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <Text style={styles.label}>Community name</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Technology"
            placeholderTextColor={colors.faint}
            style={styles.input}
            maxLength={100}
            autoCapitalize="words"
          />
          <Text style={styles.hint}>
            {slug ? `URL will be /c/${slug}` : "URL appears as you type"}
          </Text>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What this community is about"
            placeholderTextColor={colors.faint}
            style={[styles.input, styles.textarea]}
            maxLength={500}
            multiline
          />
          <Text style={styles.label}>Posts</Text>
          <View style={styles.formats}>
            {FORMATS.map((fmt) => (
              <Pressable
                key={fmt.value}
                onPress={() => setPostFormat(fmt.value)}
                style={[styles.format, postFormat === fmt.value && styles.formatOn]}
              >
                <Text style={[styles.formatLabel, postFormat === fmt.value && styles.formatLabelOn]}>
                  {fmt.label}
                </Text>
                <Text style={styles.formatHint}>{fmt.hint}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.nsfwRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nsfwTitle}>Adults only</Text>
              <Text style={styles.hint}>Hidden from people who have not opted in.</Text>
            </View>
            <Switch
              value={nsfw}
              onValueChange={setNsfw}
              trackColor={{ false: colors.switchOff, true: colors.emerald }}
              thumbColor={colors.white}
            />
          </View>
          <Pressable
            onPress={onSubmit}
            disabled={busy || !slug}
            style={[styles.submit, (busy || !slug) && { opacity: 0.5 }]}
          >
            <Text style={styles.submitText}>{busy ? "Creating…" : "Create community"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    wrap: { flex: 1 },
    top: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    sideAction: {
      minWidth: 88,
      flexGrow: 0,
      flexShrink: 0,
      zIndex: 1,
    },
    cancel: {
      color: colors.muted,
      fontSize: 16,
      fontWeight: "600",
      flexShrink: 0,
    },
    heading: {
      position: "absolute",
      left: 16,
      right: 16,
      textAlign: "center",
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
    },
    body: { padding: 16, gap: 10, paddingBottom: 40 },
    label: { color: colors.text, fontSize: 14, fontWeight: "600", marginTop: 6 },
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
    textarea: { minHeight: 96, textAlignVertical: "top" },
    hint: { color: colors.faint, fontSize: 12, marginTop: -4 },
    formats: { gap: 8 },
    format: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      backgroundColor: colors.card,
    },
    formatOn: { borderColor: colors.emerald, backgroundColor: colors.chipActive },
    formatLabel: { color: colors.text, fontWeight: "700", fontSize: 15 },
    formatLabelOn: { color: colors.emerald },
    formatHint: { color: colors.muted, fontSize: 12, marginTop: 4 },
    nsfwRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
    nsfwTitle: { color: colors.text, fontWeight: "600", fontSize: 14 },
    submit: {
      backgroundColor: colors.emeraldDark,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 10,
    },
    submitText: { color: colors.white, fontSize: 16, fontWeight: "700" },
    errorBox: {
      backgroundColor: colors.dangerBg,
      borderRadius: 10,
      padding: 12,
    },
    errorText: { color: colors.dangerText, fontSize: 14 },
  });
}

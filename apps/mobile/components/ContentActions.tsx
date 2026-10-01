import { useEffect, useId, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardDoneBar } from "@/components/KeyboardDoneBar";
import {
  REPORT_REASONS,
  blockUser,
  submitReport,
  type ReportReason,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useKeyboardInset } from "@/lib/keyboard";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

const BLOCK_BODY =
  "You won't see their posts or comments, and they can't reply to or mention you.";

type Props = {
  targetType: "post" | "comment" | "user";
  targetId: string;
  authorId: string;
  authorUsername: string;
  initialBlocked?: boolean;
  canBlock?: boolean;
};

export function ContentActions({
  targetType,
  targetId,
  authorId,
  authorUsername,
  initialBlocked = false,
  canBlock = true,
}: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [headerHeight, setHeaderHeight] = useState(44);
  const [footerHeight, setFooterHeight] = useState(64);
  const keyboardHeight = useKeyboardInset();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const noteAccessoryId = `report-note-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    setBlocked(initialBlocked);
  }, [initialBlocked]);

  const isSelf = Boolean(user && user.id === authorId);
  const showBlock = canBlock && !isSelf && authorUsername !== "[deleted]";
  if (isSelf) return null;

  function requireUser() {
    if (!user) {
      setMenu(false);
      router.push("/login");
      return false;
    }
    return true;
  }

  function confirmBlock(next: boolean) {
    if (!requireUser()) return;
    Alert.alert(next ? "Block this user?" : "Unblock this user?", next ? BLOCK_BODY : "You'll see their posts and comments again, and they can reply to you.", [
      { text: "Cancel", style: "cancel" },
      {
        text: next ? "Block" : "Unblock",
        style: next ? "destructive" : "default",
        onPress: () => void runBlock(next),
      },
    ]);
  }

  async function runBlock(next: boolean) {
    try {
      const data = await blockUser(authorId, next ? "block" : "unblock");
      setBlocked(data.blocked);
      setMenu(false);
      setThanks(false);
      setReporting(false);
    } catch (err) {
      Alert.alert("Could not update block", err instanceof Error ? err.message : "Try again");
    }
  }

  async function onSubmit() {
    if (!requireUser() || sending) return;
    Keyboard.dismiss();
    setSending(true);
    try {
      await submitReport({
        targetType,
        targetId,
        reason,
        note,
      });
      setThanks(true);
    } catch (err) {
      Alert.alert("Could not send report", err instanceof Error ? err.message : "Try again");
    } finally {
      setSending(false);
    }
  }

  function closeReport() {
    setReporting(false);
    setThanks(false);
    setNote("");
    setReason(REPORT_REASONS[0]);
  }

  return (
    <>
      <Pressable
        onPress={() => setMenu(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="More actions"
        style={styles.moreBtn}
      >
        <Text style={styles.moreText}>···</Text>
      </Pressable>

      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenu(false)}>
          <View style={styles.sheet}>
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                if (!requireUser()) return;
                setMenu(false);
                setReporting(true);
              }}
            >
              <Text style={styles.sheetText}>Report</Text>
            </Pressable>
            {showBlock ? (
              <Pressable style={styles.sheetRow} onPress={() => confirmBlock(!blocked)}>
                <Text style={styles.sheetText}>{blocked ? "Unblock" : "Block"}</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.sheetRow} onPress={() => setMenu(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={reporting} transparent animationType="fade" onRequestClose={closeReport}>
        <View style={[styles.sheetRoot, { paddingBottom: keyboardHeight }]}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={Keyboard.dismiss}
            accessible={false}
            importantForAccessibility="no"
          />
          <View
            style={[
              styles.dialog,
              {
                maxHeight: Math.max(220, windowHeight - keyboardHeight - insets.top - 12),
                paddingBottom: keyboardHeight > 0 ? 12 : Math.max(insets.bottom, 12),
              },
            ]}
          >
            {thanks ? (
              <>
                <Text style={styles.dialogTitle}>Thanks, we&apos;ll take a look</Text>
                <Text style={styles.dialogBody}>
                  Reporting does not hide the content. You can block this user if you don&apos;t want to see them.
                </Text>
                {showBlock && !blocked ? (
                  <Pressable style={styles.secondary} onPress={() => confirmBlock(true)}>
                    <Text style={styles.secondaryText}>Block this user</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.primary} onPress={closeReport}>
                  <Text style={styles.primaryText}>Done</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text
                  style={styles.dialogTitle}
                  onLayout={(event) => {
                    const next = event.nativeEvent.layout.height;
                    setHeaderHeight((prev) => (prev === next ? prev : next));
                  }}
                >
                  Report
                </Text>
                <ScrollView
                  style={{
                    maxHeight: Math.max(
                      140,
                      windowHeight - keyboardHeight - insets.top - headerHeight - footerHeight - 64
                    ),
                  }}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                  bounces={false}
                >
                  {REPORT_REASONS.map((item) => {
                    const selected = reason === item;
                    return (
                      <Pressable key={item} onPress={() => setReason(item)} style={styles.reasonRow}>
                        <View style={[styles.radio, selected && styles.radioOn]} />
                        <Text style={styles.reasonText}>{item}</Text>
                      </Pressable>
                    );
                  })}
                  <Text style={styles.noteLabel}>Note (optional)</Text>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    multiline
                    blurOnSubmit
                    returnKeyType="done"
                    inputAccessoryViewID={Platform.OS === "ios" ? noteAccessoryId : undefined}
                    maxLength={2000}
                    style={styles.note}
                    placeholder="Add details"
                    placeholderTextColor={colors.faint}
                  />
                </ScrollView>
                <View
                  style={styles.dialogActions}
                  onLayout={(event) => {
                    const next = event.nativeEvent.layout.height;
                    setFooterHeight((prev) => (prev === next ? prev : next));
                  }}
                >
                  <Pressable onPress={closeReport} style={styles.secondary}>
                    <Text style={styles.secondaryText}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={() => void onSubmit()} disabled={sending} style={styles.primary}>
                    <Text style={styles.primaryText}>{sending ? "Sending…" : "Submit report"}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
          {reporting && !thanks ? <KeyboardDoneBar nativeID={noteAccessoryId} /> : null}
        </View>
      </Modal>
    </>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    moreBtn: { paddingHorizontal: 6, paddingVertical: 2 },
    moreText: { color: colors.muted, fontSize: 16, fontWeight: "700", letterSpacing: 1 },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheetRoot: {
      flex: 1,
      justifyContent: "flex-end",
    },
    sheetBackdrop: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 24,
      paddingTop: 8,
    },
    sheetRow: { paddingHorizontal: 20, paddingVertical: 16 },
    sheetText: { color: colors.text, fontSize: 17, fontWeight: "600" },
    cancelText: { color: colors.muted, fontSize: 17, fontWeight: "600" },
    dialog: {
      zIndex: 1,
      backgroundColor: colors.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingTop: 16,
      paddingHorizontal: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dialogTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 10 },
    dialogBody: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 14 },
    reasonRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 },
    radio: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
    },
    radioOn: { borderColor: colors.emerald, backgroundColor: colors.emerald },
    reasonText: { color: colors.text, fontSize: 15 },
    noteLabel: { color: colors.muted, fontSize: 13, fontWeight: "600", marginTop: 10, marginBottom: 6 },
    note: {
      minHeight: 72,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 10,
      color: colors.text,
      backgroundColor: colors.field,
      textAlignVertical: "top",
    },
    dialogActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 14 },
    primary: {
      backgroundColor: colors.emeraldDark,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: "center",
      marginTop: 8,
    },
    primaryText: { color: colors.white, fontWeight: "700" },
    secondary: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: "center",
      marginTop: 8,
    },
    secondaryText: { color: colors.text, fontWeight: "600" },
  });
}

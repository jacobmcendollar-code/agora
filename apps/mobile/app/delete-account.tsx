import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenScroll } from "@/components/Screen";
import { deleteAccount } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

export default function DeleteAccountScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!user || loading) return;
    setLoading(true);
    try {
      await deleteAccount();
      await signOut();
      router.replace("/");
    } catch (err) {
      Alert.alert("Could not delete account", err instanceof Error ? err.message : "Try again");
      setLoading(false);
    }
  }

  return (
    <ScreenScroll>
      <Text style={styles.heading}>Delete your account</Text>
      <Text style={styles.body}>
        This permanently removes your profile, email, sessions, push token, saves, votes, and blocks.
        Your posts and comments stay in their threads as [deleted], with the text removed. This cannot be undone.
      </Text>
      <Pressable
        onPress={() => void onDelete()}
        disabled={loading || !user}
        style={[styles.deleteBtn, (loading || !user) && { opacity: 0.6 }]}
      >
        <Text style={styles.deleteText}>{loading ? "Deleting…" : "Delete my account"}</Text>
      </Pressable>
      <Pressable onPress={() => router.back()} style={styles.cancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
      {!user ? (
        <View style={styles.need}>
          <Text style={styles.needText}>Log in to delete an account.</Text>
        </View>
      ) : null}
    </ScreenScroll>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    heading: { color: colors.text, fontSize: 24, fontWeight: "700" },
    body: { color: colors.muted, marginTop: 10, lineHeight: 21, fontSize: 15 },
    deleteBtn: {
      marginTop: 22,
      backgroundColor: colors.rose,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: "center",
    },
    deleteText: { color: colors.white, fontWeight: "700" },
    cancel: { marginTop: 12, alignItems: "center", paddingVertical: 12 },
    cancelText: { color: colors.muted, fontWeight: "600" },
    need: { marginTop: 8 },
    needText: { color: colors.muted, textAlign: "center" },
  });
}

import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenScroll } from "@/components/Screen";
import { forgotPassword } from "@/lib/api";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const styles = makeStyles(useThemeColors());
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setMessage(data.message || "If that email exists, we sent a reset link.");
    } catch (err) {
      const extra = err as { data?: { error?: string }; message?: string };
      const apiError = extra.data?.error?.trim();
      setError(apiError || "Could not send a reset link. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenScroll>
      <Text style={styles.heading}>Forgot password</Text>
      <Text style={styles.sub}>Enter your account email and we’ll send a reset link.</Text>

      <View style={styles.card}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {message ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{message}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          style={styles.input}
        />

        <Pressable
          style={[styles.primary, (loading || !email.trim()) && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={loading || !email.trim()}
        >
          <Text style={styles.primaryText}>{loading ? "Sending…" : "Send reset link"}</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.footer}>
          <Text style={styles.link}>Back to log in</Text>
        </Text>
      </Pressable>
    </ScreenScroll>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    heading: { color: colors.text, fontSize: 24, fontWeight: "700" },
    sub: { color: colors.muted, marginTop: 6, marginBottom: 18 },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 16,
    },
    label: { color: colors.text, fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 10 },
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
    primary: {
      marginTop: 18,
      backgroundColor: colors.emeraldDark,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: "center",
    },
    primaryText: { color: colors.white, fontWeight: "700" },
    errorBox: { backgroundColor: colors.dangerBg, borderRadius: 10, padding: 10, marginBottom: 8 },
    errorText: { color: colors.dangerText, fontSize: 13 },
    successBox: { backgroundColor: colors.hero, borderRadius: 10, padding: 10, marginBottom: 8 },
    successText: { color: colors.emerald, fontSize: 13 },
    footer: { color: colors.muted, textAlign: "center", marginTop: 18 },
    link: { color: colors.text, fontWeight: "700", textDecorationLine: "underline" },
  });
}

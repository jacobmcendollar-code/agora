import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenScroll } from "@/components/Screen";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(username, password);
      router.replace("/(tabs)/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid username or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenScroll includeTabs={false}>
      <Text style={styles.heading}>Log in</Text>
      <Text style={styles.sub}>Same username and password as the site.</Text>

      <View style={styles.card}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          style={styles.input}
        />

        <Pressable
          style={[styles.primary, loading && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={loading}
        >
          <Text style={styles.primaryText}>{loading ? "Logging in…" : "Log in"}</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => router.push("/register")}>
        <Text style={styles.footer}>
          No account? <Text style={styles.link}>Create one</Text>
        </Text>
      </Pressable>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
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
  errorBox: { backgroundColor: "#3f1d1d", borderRadius: 10, padding: 10, marginBottom: 8 },
  errorText: { color: "#fecaca", fontSize: 13 },
  footer: { color: colors.muted, textAlign: "center", marginTop: 18 },
  link: { color: colors.text, fontWeight: "700", textDecorationLine: "underline" },
});

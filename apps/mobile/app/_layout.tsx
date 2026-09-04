import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import { AgoraHeader } from "@/components/AgoraHeader";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ChromeProvider } from "@/lib/chrome";
import { PreferencesProvider, usePreferences } from "@/lib/preferences";
import { colors } from "@/lib/theme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

function Gate() {
  const { ready: authReady } = useAuth();
  const { ready: prefsReady, theme } = usePreferences();

  useEffect(() => {
    if (authReady && prefsReady) SplashScreen.hideAsync();
  }, [authReady, prefsReady]);

  if (!authReady || !prefsReady) return null;

  const bg = theme === "light" ? "#f7f6f3" : colors.bg;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar style={theme === "light" ? "dark" : "light"} />
      <ChromeProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="post/[id]" />
            <Stack.Screen name="u/[username]" />
            <Stack.Screen name="community/[name]" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="about" />
          </Stack>
          <AgoraHeader />
        </View>
      </ChromeProvider>
    </View>
  );
}

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </PreferencesProvider>
  );
}

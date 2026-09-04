import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import { AgoraHeader } from "@/components/AgoraHeader";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ChromeProvider } from "@/lib/chrome";
import { PreferencesProvider, usePreferences, useThemeColors } from "@/lib/preferences";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

function Gate() {
  const { ready: authReady } = useAuth();
  const { ready: prefsReady, theme } = usePreferences();
  const colors = useThemeColors();

  useEffect(() => {
    if (authReady && prefsReady) SplashScreen.hideAsync();
  }, [authReady, prefsReady]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg);
  }, [colors.bg]);

  if (!authReady || !prefsReady) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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

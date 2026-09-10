import { Stack, useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import "react-native-reanimated";
import { AgoraHeader } from "@/components/AgoraHeader";
import { AgoraTabBar } from "@/components/AgoraTabBar";
import { EdgeSwipeBack } from "@/components/EdgeSwipeBack";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ChromeProvider } from "@/lib/chrome";
import { hrefFromPushData } from "@/lib/notification";
import {
  PreferencesProvider,
  usePreferences,
  useResolvedTheme,
  useThemeColors,
} from "@/lib/preferences";
import { initPushHandler } from "@/lib/push";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();
initPushHandler();

let lastOpenedPushId: string | null = null;

function PushTapListener() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === "web") return;

    function open(response: Notifications.NotificationResponse | null) {
      if (!response) return;
      const id = response.notification.request.identifier;
      if (lastOpenedPushId === id) return;
      lastOpenedPushId = id;
      const data = response.notification.request.content.data as Record<string, unknown>;
      const href = hrefFromPushData(data);
      if (href) router.push(href as Href);
    }

    const sub = Notifications.addNotificationResponseReceivedListener(open);
    void Notifications.getLastNotificationResponseAsync().then(open);

    return () => sub.remove();
  }, [router]);

  return null;
}

function Gate() {
  const { ready: authReady } = useAuth();
  const { ready: prefsReady } = usePreferences();
  const resolvedTheme = useResolvedTheme();
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
      <StatusBar style={resolvedTheme === "light" ? "dark" : "light"} />
      <ChromeProvider>
        <EdgeSwipeBack>
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <PushTapListener />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
                animation: "slide_from_right",
                gestureEnabled: true,
                gestureDirection: "horizontal",
                animationMatchesGesture: true,
              }}
            >
              <Stack.Screen name="(tabs)" />
              {/* Post is a root stack screen (not a tab) so back pops to the
                  opener — Home, community, search, profile, or Notifications —
                  instead of leaving Notifications under a nested (tabs) push. */}
              <Stack.Screen
                name="post/[id]"
                options={{
                  animation: "slide_from_right",
                  gestureDirection: "horizontal",
                  gestureEnabled: true,
                  animationMatchesGesture: true,
                }}
              />
              <Stack.Screen name="u/[username]" />
              <Stack.Screen
                name="account"
                options={{
                  animation: "slide_from_left",
                  gestureEnabled: true,
                  animationMatchesGesture: true,
                }}
              />
              <Stack.Screen
                name="notifications"
                options={{
                  animation: "slide_from_right",
                  gestureDirection: "horizontal",
                  gestureEnabled: true,
                  animationMatchesGesture: true,
                  animationTypeForReplace: "pop",
                }}
              />
              <Stack.Screen name="login" />
              <Stack.Screen name="forgot-password" />
              <Stack.Screen name="register" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="edit-profile" />
              <Stack.Screen name="about" />
            </Stack>
            <AgoraHeader />
            <AgoraTabBar />
          </View>
        </EdgeSwipeBack>
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

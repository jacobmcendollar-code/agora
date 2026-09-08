import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiJson } from "./api";

let handlerReady = false;

export function initPushHandler() {
  if (handlerReady || Platform.OS === "web") return;
  handlerReady = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export async function registerPushToken() {
  if (Platform.OS === "web") return;
  try {
    initPushHandler();
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") return;

    const id = projectId();
    const token = await Notifications.getExpoPushTokenAsync(id ? { projectId: id } : undefined);
    if (!token?.data) return;
    await apiJson("/api/mobile/push-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.data }),
    });
  } catch {
    // Permission denied, missing EAS projectId, or simulator. Fail soft.
  }
}

export async function clearPushToken() {
  if (Platform.OS === "web") return;
  try {
    await apiJson("/api/mobile/push-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: null }),
    });
  } catch {
    // Session may already be gone.
  }
}

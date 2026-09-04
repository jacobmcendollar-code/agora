import { Tabs } from "expo-router";
import { DeviceEventEmitter, Image, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconAccount,
  IconCommunities,
  IconHome,
  IconSubmit,
} from "@/components/Icons";
import { useAuth } from "@/lib/auth";
import { AnimatedView, HOME_TAB_REPRESS, useChrome } from "@/lib/chrome";
import { useThemeColors } from "@/lib/preferences";
import { space, type Palette } from "@/lib/theme";

type TabDef = {
  name: "index" | "communities" | "submit" | "account";
  label: string;
  Icon: typeof IconHome;
};

const TABS: TabDef[] = [
  { name: "index", label: "Home", Icon: IconHome },
  { name: "communities", label: "Communities", Icon: IconCommunities },
  { name: "submit", label: "Submit", Icon: IconSubmit },
  { name: "account", label: "Account", Icon: IconAccount },
];

const ICON = 27;

function HiddenTabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: { key: string; name: string }[] };
  // Expo Router's tab helpers are stricter than our usage.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
}) {
  const insets = useSafeAreaInsets();
  const { tabBarStyle } = useChrome();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const current = state.routes[state.index]?.name;

  return (
    <AnimatedView
      style={[
        styles.bar,
        { height: space.tabBarBody + insets.bottom, paddingBottom: insets.bottom },
        tabBarStyle,
      ]}
    >
      {TABS.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.name);
        const active = current === tab.name;
        const color = active ? colors.emerald : colors.faint;
        return (
          <Pressable
            key={tab.name}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route?.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) navigation.navigate(tab.name);
            }}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            {tab.name === "account" && user?.image ? (
              <Image
                source={{ uri: user.image }}
                style={[styles.avatar, active && { borderColor: colors.emerald }]}
              />
            ) : (
              <tab.Icon color={color} size={ICON} />
            )}
          </Pressable>
        );
      })}
    </AnimatedView>
  );
}

export default function TabLayout() {
  const colors = useThemeColors();
  return (
    <Tabs
      tabBar={(props) => (
        <HiddenTabBar state={props.state} navigation={props.navigation as never} />
      )}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: "absolute" },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home" }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) DeviceEventEmitter.emit(HOME_TAB_REPRESS);
          },
        })}
      />
      <Tabs.Screen name="communities" options={{ title: "Communities" }} />
      <Tabs.Screen name="submit" options={{ title: "Submit" }} />
      <Tabs.Screen name="account" options={{ title: "Account" }} />
      <Tabs.Screen name="community/[name]" options={{ href: null, title: "Community" }} />
    </Tabs>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    bar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      backgroundColor: colors.bg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    item: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      height: space.tabBarBody,
    },
    avatar: {
      width: ICON,
      height: ICON,
      borderRadius: ICON / 2,
      borderWidth: 1.5,
      borderColor: "transparent",
    },
  });
}

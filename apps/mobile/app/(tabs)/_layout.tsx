import { Tabs } from "expo-router";
import { DeviceEventEmitter, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconCommunities,
  IconHome,
  IconSearch,
  IconSubmit,
} from "@/components/Icons";
import { AnimatedView, HOME_TAB_REPRESS, useChrome } from "@/lib/chrome";
import { useThemeColors } from "@/lib/preferences";
import { space, type Palette } from "@/lib/theme";

type TabDef = {
  name: "index" | "communities" | "search" | "submit";
  label: string;
  Icon: typeof IconHome;
};

const TABS: TabDef[] = [
  { name: "index", label: "Home", Icon: IconHome },
  { name: "communities", label: "Communities", Icon: IconCommunities },
  { name: "search", label: "Search", Icon: IconSearch },
  { name: "submit", label: "New Post", Icon: IconSubmit },
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
            <tab.Icon color={color} size={ICON} />
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
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="submit" options={{ title: "New Post" }} />
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
  });
}

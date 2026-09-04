import { Tabs } from "expo-router";
import { DeviceEventEmitter, Image, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconAccount,
  IconCommunities,
  IconHome,
  IconSubmit,
} from "@/components/Icons";
import { useAuth } from "@/lib/auth";
import { AnimatedView, HOME_TAB_REPRESS, useChrome } from "@/lib/chrome";
import { colors, space } from "@/lib/theme";

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

  return (
    <AnimatedView
      style={[
        styles.bar,
        { height: space.tabBarBody + insets.bottom, paddingBottom: insets.bottom },
        tabBarStyle,
      ]}
    >
      {TABS.map((tab, index) => {
        const active = state.index === index;
        const color = active ? colors.emerald : colors.faint;
        return (
          <Pressable
            key={tab.name}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: state.routes[index]?.key,
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
              <Image source={{ uri: user.image }} style={styles.avatar} />
            ) : (
              <tab.Icon color={color} size={22} />
            )}
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </AnimatedView>
  );
}

export default function TabLayout() {
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
    gap: 3,
    height: space.tabBarBody,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
});

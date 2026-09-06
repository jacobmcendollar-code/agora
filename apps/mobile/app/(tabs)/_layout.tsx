import { Tabs } from "expo-router";
import { useThemeColors } from "@/lib/preferences";

export default function TabLayout() {
  const colors = useThemeColors();
  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="communities" options={{ title: "Communities" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="submit" options={{ title: "New Post" }} />
      <Tabs.Screen name="community/[name]" options={{ href: null, title: "Community" }} />
      <Tabs.Screen name="post/[id]" options={{ href: null, title: "Post" }} />
    </Tabs>
  );
}

import { Pressable, StyleSheet } from "react-native";
import { usePathname, useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconCommunities,
  IconHome,
  IconSearch,
  IconSubmit,
} from "@/components/Icons";
import { AnimatedView, isTabSurface, pressHomeTab, useChrome } from "@/lib/chrome";
import { useThemeColors } from "@/lib/preferences";
import { space, type Palette } from "@/lib/theme";

type TabDef = {
  href: Href;
  path: string;
  label: string;
  Icon: typeof IconHome;
};

const TABS: TabDef[] = [
  { href: "/", path: "/", label: "Home", Icon: IconHome },
  { href: "/communities", path: "/communities", label: "Communities", Icon: IconCommunities },
  { href: "/search", path: "/search", label: "Search", Icon: IconSearch },
  { href: "/submit", path: "/submit", label: "New Post", Icon: IconSubmit },
];

const ICON = 27;

export function AgoraTabBar() {
  const insets = useSafeAreaInsets();
  const { tabBarStyle } = useChrome();
  const pathname = usePathname();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);

  return (
    <AnimatedView
      style={[
        styles.bar,
        { height: space.tabBarBody + insets.bottom, paddingBottom: insets.bottom },
        tabBarStyle,
      ]}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.path;
        const color = active ? colors.emerald : colors.faint;
        return (
          <Pressable
            key={tab.path}
            onPress={() => {
              if (tab.path === "/") {
                pressHomeTab(pathname, router);
                return;
              }
              if (pathname === tab.path) return;
              if (!isTabSurface(pathname)) {
                router.dismissTo(tab.href);
                return;
              }
              router.navigate(tab.href);
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

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    bar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      overflow: "hidden",
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

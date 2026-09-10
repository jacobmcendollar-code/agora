import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { DeviceEventEmitter, type NativeScrollEvent, type NativeSyntheticEvent, type ViewStyle } from "react-native";
import type { Href } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space } from "./theme";

export const HOME_TAB_REPRESS = "agora.homeTabRepress";

const TAB_ROOTS = new Set(["/", "/communities", "/search", "/submit"]);

export function normalizePath(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

/** Tab roots — no Back button, no edge-swipe pop. */
export function isTabRoot(pathname: string) {
  return TAB_ROOTS.has(normalizePath(pathname));
}

/** Tab navigator routes. Stack screens (post, notifications, profile, …) are not. */
export function isTabSurface(pathname: string) {
  const path = normalizePath(pathname);
  return TAB_ROOTS.has(path) || path.startsWith("/community/");
}

/** Same path as tapping the Home tab icon. */
export function pressHomeTab(
  pathname: string,
  router: { dismissTo: (href: Href) => void; navigate: (href: Href) => void }
) {
  DeviceEventEmitter.emit(HOME_TAB_REPRESS);
  if (normalizePath(pathname) === "/") return;
  if (!isTabSurface(pathname)) {
    router.dismissTo("/");
    return;
  }
  router.navigate("/");
}

type ChromeContextValue = {
  headerHeight: number;
  tabBarHeight: number;
  hidden: SharedValue<number>;
  headerStyle: object;
  tabBarStyle: object;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  reveal: () => void;
  pin: () => void;
  unpin: () => void;
};

const ChromeContext = createContext<ChromeContextValue | null>(null);

export function ChromeProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + space.headerBody;
  const tabBarHeight = insets.bottom + space.tabBarBody;
  const hidden = useSharedValue(0);
  const lastY = useRef(0);
  const isHidden = useRef(false);
  const pinned = useRef(false);

  const reveal = useCallback(() => {
    isHidden.current = false;
    hidden.value = withTiming(0, { duration: 220 });
  }, [hidden]);

  const pin = useCallback(() => {
    pinned.current = true;
    reveal();
  }, [reveal]);

  const unpin = useCallback(() => {
    pinned.current = false;
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const dy = y - lastY.current;
      lastY.current = y;
      if (pinned.current) {
        if (isHidden.current) reveal();
        return;
      }
      if (y < 24) {
        if (isHidden.current) reveal();
        return;
      }
      if (dy > 8 && !isHidden.current) {
        isHidden.current = true;
        hidden.value = withTiming(1, { duration: 220 });
      } else if (dy < -8 && isHidden.current) {
        reveal();
      }
    },
    [hidden, reveal]
  );

  const headerStyle = useAnimatedStyle<ViewStyle>(() => ({
    height: insets.top + space.headerBody * (1 - hidden.value),
  }));

  const tabBarStyle = useAnimatedStyle<ViewStyle>(() => ({
    height: tabBarHeight * (1 - hidden.value),
    paddingBottom: insets.bottom * (1 - hidden.value),
  }));

  const value = useMemo(
    () => ({
      headerHeight,
      tabBarHeight,
      hidden,
      headerStyle,
      tabBarStyle,
      onScroll,
      reveal,
      pin,
      unpin,
    }),
    [headerHeight, tabBarHeight, hidden, headerStyle, tabBarStyle, onScroll, reveal, pin, unpin]
  );

  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
}

export function useChrome() {
  const ctx = useContext(ChromeContext);
  if (!ctx) throw new Error("useChrome must be used within ChromeProvider");
  return ctx;
}

export function ChromePad({
  edge,
  extra,
  includeTabs = true,
}: {
  edge: "top" | "bottom";
  extra?: number;
  includeTabs?: boolean;
}) {
  const { hidden, headerHeight, tabBarHeight } = useChrome();
  const insets = useSafeAreaInsets();
  const topExtra = extra ?? 12;
  const bottomExtra = extra ?? 28;
  const shown =
    edge === "top"
      ? headerHeight + topExtra
      : bottomExtra + (includeTabs ? tabBarHeight : 24);
  const style = useAnimatedStyle(() => {
    if (edge === "top") {
      return { height: shown - hidden.value * space.headerBody };
    }
    const hideBy = includeTabs ? tabBarHeight : 24;
    return { height: Math.max(insets.bottom, shown - hidden.value * hideBy) };
  });
  return <Animated.View pointerEvents="none" style={[{ height: shown }, style]} />;
}

export const AnimatedView = Animated.View;

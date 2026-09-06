import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { NativeScrollEvent, NativeSyntheticEvent, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space } from "./theme";

type ChromeContextValue = {
  headerHeight: number;
  tabBarHeight: number;
  hidden: SharedValue<number>;
  headerStyle: object;
  tabBarStyle: object;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  reveal: () => void;
};

const ChromeContext = createContext<ChromeContextValue | null>(null);

export function ChromeProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + space.headerBody;
  const tabBarHeight = insets.bottom + space.tabBarBody;
  const hidden = useSharedValue(0);
  const lastY = useRef(0);
  const isHidden = useRef(false);

  const reveal = useCallback(() => {
    isHidden.current = false;
    hidden.value = withTiming(0, { duration: 220 });
  }, [hidden]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const dy = y - lastY.current;
      lastY.current = y;
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
    }),
    [headerHeight, tabBarHeight, hidden, headerStyle, tabBarStyle, onScroll, reveal]
  );

  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
}

export function useChrome() {
  const ctx = useContext(ChromeContext);
  if (!ctx) throw new Error("useChrome must be used within ChromeProvider");
  return ctx;
}

export function useChromeContentStyle({
  includeTabs = true,
  topExtra = 12,
  bottomExtra = 28,
}: {
  includeTabs?: boolean;
  topExtra?: number;
  bottomExtra?: number;
} = {}) {
  const { hidden, headerHeight, tabBarHeight } = useChrome();
  return useAnimatedStyle(() => ({
    paddingTop: headerHeight + topExtra - hidden.value * space.headerBody,
    paddingBottom: bottomExtra + (includeTabs ? tabBarHeight : 24) * (1 - hidden.value),
  }));
}

export const AnimatedView = Animated.View;

export const HOME_TAB_REPRESS = "agora.homeTabRepress";

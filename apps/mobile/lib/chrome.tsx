import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space } from "./theme";

type ChromeContextValue = {
  headerHeight: number;
  tabBarHeight: number;
  headerStyle: ReturnType<typeof useAnimatedStyle>;
  tabBarStyle: ReturnType<typeof useAnimatedStyle>;
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

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -hidden.value * headerHeight }],
  }));

  const tabBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hidden.value * tabBarHeight }],
  }));

  const value = useMemo(
    () => ({
      headerHeight,
      tabBarHeight,
      headerStyle,
      tabBarStyle,
      onScroll,
      reveal,
    }),
    [headerHeight, tabBarHeight, headerStyle, tabBarStyle, onScroll, reveal]
  );

  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
}

export function useChrome() {
  const ctx = useContext(ChromeContext);
  if (!ctx) throw new Error("useChrome must be used within ChromeProvider");
  return ctx;
}

export const AnimatedView = Animated.View;

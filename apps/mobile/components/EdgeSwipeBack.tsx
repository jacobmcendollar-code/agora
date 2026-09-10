import { useMemo, useRef, type ReactNode } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { isTabRoot } from "@/lib/chrome";

const EDGE = 28;
const MIN_DX = 56;

export function EdgeSwipeBack({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const enabled = !isTabRoot(pathname);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          enabledRef.current &&
          gesture.x0 <= EDGE &&
          gesture.dx > 8 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (!enabledRef.current) return;
          if (gesture.dx > MIN_DX || gesture.vx > 0.4) router.back();
        },
      }),
    [router]
  );

  return (
    <View style={styles.fill} {...pan.panHandlers}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

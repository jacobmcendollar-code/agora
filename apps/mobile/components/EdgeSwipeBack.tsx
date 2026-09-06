import { useMemo, type ReactNode } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

const EDGE = 28;
const MIN_DX = 56;

export function EdgeSwipeBack({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          gesture.x0 <= EDGE && gesture.dx > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
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

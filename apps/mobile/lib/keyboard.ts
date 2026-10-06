import { useSyncExternalStore } from "react";
import { Keyboard, Platform, type KeyboardEvent } from "react-native";

let height = 0;
const listeners = new Set<() => void>();
let attached = false;

function emit(next: number) {
  if (height === next) return;
  height = next;
  listeners.forEach((listener) => listener());
}

function attach() {
  if (attached) return;
  attached = true;
  const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
  const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
  Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
    emit(event.endCoordinates?.height ?? 0);
  });
  Keyboard.addListener(hideEvent, () => emit(0));
}

/** Height of the software keyboard, shared by every caller. 0 when it is hidden. */
export function useKeyboardInset() {
  return useSyncExternalStore(
    (onStoreChange) => {
      attach();
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    () => height,
    () => 0
  );
}

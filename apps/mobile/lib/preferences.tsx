import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { paletteFor, type Palette } from "./theme";

const KEY = "agora.prefs.v1";

export type ThemePref = "dark" | "light";

type Prefs = {
  theme: ThemePref;
  openSocialInNativeApp: boolean;
};

const defaults: Prefs = {
  theme: "dark",
  openSocialInNativeApp: false,
};

type PrefsContextValue = Prefs & {
  ready: boolean;
  setTheme: (theme: ThemePref) => void;
  setOpenSocialInNativeApp: (value: boolean) => void;
};

const PrefsContext = createContext<PrefsContextValue>({
  ...defaults,
  ready: false,
  setTheme: () => {},
  setOpenSocialInNativeApp: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<Prefs>;
        setPrefs({
          theme: parsed.theme === "light" ? "light" : "dark",
          openSocialInNativeApp: Boolean(parsed.openSocialInNativeApp),
        });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const write = useCallback((next: Prefs) => {
    setPrefs(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setTheme = useCallback(
    (theme: ThemePref) => write({ ...prefs, theme }),
    [prefs, write]
  );
  const setOpenSocialInNativeApp = useCallback(
    (openSocialInNativeApp: boolean) => write({ ...prefs, openSocialInNativeApp }),
    [prefs, write]
  );

  const value = useMemo(
    () => ({ ...prefs, ready, setTheme, setOpenSocialInNativeApp }),
    [prefs, ready, setTheme, setOpenSocialInNativeApp]
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePreferences() {
  return useContext(PrefsContext);
}

export function useThemeColors(): Palette {
  const { theme } = usePreferences();
  return paletteFor(theme);
}

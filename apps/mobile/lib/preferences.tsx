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
import { useColorScheme } from "react-native";
import { paletteFor, type Palette } from "./theme";

const KEY = "agora.prefs.v1";

export type ThemePref = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

type Prefs = {
  theme: ThemePref;
  openSocialInNativeApp: boolean;
};

const defaults: Prefs = {
  theme: "system",
  openSocialInNativeApp: false,
};

function readTheme(value: unknown): ThemePref {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

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
          theme: readTheme(parsed.theme),
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

export function useResolvedTheme(): ResolvedTheme {
  const { theme } = usePreferences();
  const scheme = useColorScheme();
  if (theme === "light" || theme === "dark") return theme;
  return scheme === "light" ? "light" : "dark";
}

export function useThemeColors(): Palette {
  return paletteFor(useResolvedTheme());
}

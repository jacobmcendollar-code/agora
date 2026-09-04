export type Palette = {
  bg: string;
  card: string;
  cardHover: string;
  field: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  emerald: string;
  emeraldDark: string;
  rose: string;
  white: string;
  chipActive: string;
  hero: string;
  heroBorder: string;
  dangerBg: string;
  dangerText: string;
};

export const darkColors: Palette = {
  bg: "#0c0c0e",
  card: "#161618",
  cardHover: "#1c1c1f",
  field: "#1a1a1d",
  border: "#27272a",
  text: "#fafafa",
  muted: "#a1a1aa",
  faint: "#71717a",
  emerald: "#10b981",
  emeraldDark: "#059669",
  rose: "#f43f5e",
  white: "#ffffff",
  chipActive: "#064e3b",
  hero: "#052e24",
  heroBorder: "#064e3b",
  dangerBg: "#3f1d1d",
  dangerText: "#fecaca",
};

export const lightColors: Palette = {
  bg: "#f7f6f3",
  card: "#ffffff",
  cardHover: "#f5f5f4",
  field: "#eeede8",
  border: "#e7e5e4",
  text: "#1c1917",
  muted: "#78716c",
  faint: "#a8a29e",
  emerald: "#059669",
  emeraldDark: "#047857",
  rose: "#e11d48",
  white: "#ffffff",
  chipActive: "#d1fae5",
  hero: "#ecfdf5",
  heroBorder: "#6ee7b7",
  dangerBg: "#fef2f2",
  dangerText: "#b91c1c",
};

export function paletteFor(theme: "light" | "dark"): Palette {
  return theme === "light" ? lightColors : darkColors;
}

export const colors = darkColors;

export const space = {
  headerBody: 56,
  tabBarBody: 52,
  thumb: 80,
};

export const logoAspect = 637 / 236;
export const logoHeight = 28;
export const logoWidth = Math.round(logoHeight * logoAspect);

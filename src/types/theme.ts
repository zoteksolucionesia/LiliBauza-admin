export type ThemeColor = {
  name: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
};

export const themeColors: Record<string, ThemeColor> = {
  lila: {
    name: "Lila Suave",
    primary: "#A78BFA",
    primaryLight: "#C4B5FD",
    primaryDark: "#7C3AED",
    secondary: "#6366F1",
    secondaryLight: "#818CF8",
    accent: "#F472B6",
    background: "#FAFAFF",
    surface: "#FFFFFF",
    text: "#1E1B4B",
    textMuted: "#6B7280",
  },
  azul: {
    name: "Azul Calma",
    primary: "#60A5FA",
    primaryLight: "#93C5FD",
    primaryDark: "#2563EB",
    secondary: "#06B6D4",
    secondaryLight: "#67E8F9",
    accent: "#F59E0B",
    background: "#F0F9FF",
    surface: "#FFFFFF",
    text: "#0C4A6E",
    textMuted: "#64748B",
  },
  morado: {
    name: "Morado Premium",
    primary: "#8B5CF6",
    primaryLight: "#A78BFA",
    primaryDark: "#6D28D9",
    secondary: "#EC4899",
    secondaryLight: "#F472B6",
    accent: "#10B981",
    background: "#FDF4FF",
    surface: "#FFFFFF",
    text: "#2E1065",
    textMuted: "#6B7280",
  },
  tierra: {
    name: "Tierra Natural",
    primary: "#84A98C",
    primaryLight: "#A8D5BA",
    primaryDark: "#52796F",
    secondary: "#D4A373",
    secondaryLight: "#E9C49A",
    accent: "#E76F51",
    background: "#FDFCF8",
    surface: "#FFFFFF",
    text: "#2F3E46",
    textMuted: "#6B7280",
  },
  rosa: {
    name: "Palo de Rosa",
    primary: "#D4A5A5",
    primaryLight: "#E8C4C4",
    primaryDark: "#B88B8B",
    secondary: "#C9B1B1",
    secondaryLight: "#DDD1D1",
    accent: "#E5989B",
    background: "#FDF8F8",
    surface: "#FFFFFF",
    text: "#3D2929",
    textMuted: "#7D6B6B",
  },
};

export type ThemeName = keyof typeof themeColors;

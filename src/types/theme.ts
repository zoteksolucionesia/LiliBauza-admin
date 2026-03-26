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
  border: string;
};

// Utilidad para convertir HEX a HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Generar una paleta a partir de un color primario (vía HSL para consistencia)
export function generateTheme(basePrimary: string, isDark: boolean): ThemeColor {
  const { h, s } = hexToHSL(basePrimary);

  if (isDark) {
    return {
      name: "Custom Dark",
      primary: basePrimary,
      primaryLight: hslToHex(h, Math.max(s - 10, 10), 35),
      primaryDark: hslToHex(h, Math.max(s - 5, 10), 55),
      secondary: hslToHex(h, 15, 30),
      secondaryLight: hslToHex(h, 12, 40),
      accent: hslToHex(h, 60, 65),
      background: hslToHex(h, 15, 10),
      surface: hslToHex(h, 12, 15),
      text: "#F1F5F9",
      textMuted: "#94A3B8",
      border: hslToHex(h, 12, 22),
    };
  }

  return {
    name: "Custom Light",
    primary: basePrimary,
    primaryLight: hslToHex(h, Math.min(s + 10, 100), 85),
    primaryDark: hslToHex(h, Math.max(s - 10, 10), 45),
    secondary: hslToHex(h, 20, 55),
    secondaryLight: hslToHex(h, 15, 70),
    accent: hslToHex(h, 50, 65),
    background: hslToHex(h, 30, 97),
    surface: "#FFFFFF",
    text: hslToHex(h, 25, 18),
    textMuted: hslToHex(h, 12, 45),
    border: hslToHex(h, 20, 90),
  };
}

// Función simple para oscurecer/aclarar colores HEX
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
}

export const themeColors: Record<string, ThemeColor> = {
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
    border: "#F1E4E4",
  },
};

export type ThemeName = keyof typeof themeColors;

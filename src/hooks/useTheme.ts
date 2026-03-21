"use client";

import { useCallback, useEffect, useState } from "react";
import { themeColors, type ThemeName } from "@/types/theme";

export function useTheme() {
  const [themeName, setThemeName] = useState<ThemeName>("rosa");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lilibauza-theme") as ThemeName;
    if (saved && themeColors[saved]) {
      setThemeName(saved);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const theme = themeColors[themeName];
      const root = document.documentElement;

      // Apply CSS custom properties for dynamic theming
      root.style.setProperty("--color-primary", theme.primary);
      root.style.setProperty("--color-primary-light", theme.primaryLight);
      root.style.setProperty("--color-primary-dark", theme.primaryDark);
      root.style.setProperty("--color-secondary", theme.secondary);
      root.style.setProperty("--color-secondary-light", theme.secondaryLight);
      root.style.setProperty("--color-accent", theme.accent);
      root.style.setProperty("--color-background", theme.background);
      root.style.setProperty("--color-surface", theme.surface);
      root.style.setProperty("--color-surface-transparent", `${theme.surface}E6`);
      root.style.setProperty("--color-text", theme.text);
      root.style.setProperty("--color-text-muted", theme.textMuted);

      // Apply background to body
      document.body.style.backgroundColor = theme.background;
      document.body.style.color = theme.text;
    }
  }, [themeName, isLoaded]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
    localStorage.setItem("lilibauza-theme", name);
  }, []);

  const theme = themeColors[themeName];

  return {
    theme,
    themeName,
    setTheme,
    isLoaded,
    themes: Object.keys(themeColors) as ThemeName[],
  };
}

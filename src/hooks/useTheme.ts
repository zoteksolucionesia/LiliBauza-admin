"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { generateTheme, type ThemeColor } from "@/types/theme";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_PRIMARY = "#D4A5A5";

// useLayoutEffect seguro para SSR (evita warnings en el servidor)
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useTheme() {
  // Inicializar con defaults seguros para SSR (coincide con el servidor)
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [membretadaUrl, setMembretadaUrl] = useState<string | null>(null);
  const [nombreClinica, setNombreClinica] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [theme, setTheme] = useState<ThemeColor>(generateTheme(DEFAULT_PRIMARY, false));

  // Paso 1: Leer localStorage SÍNCRONAMENTE antes del primer paint
  // useLayoutEffect se ejecuta después de React renderiza al DOM pero ANTES
  // de que el navegador pinte, eliminando cualquier parpadeo visual.
  useIsomorphicLayoutEffect(() => {
    try {
      const cachedPrimary = localStorage.getItem("zotek-primary") || DEFAULT_PRIMARY;
      const cachedDark = localStorage.getItem("zotek-dark") === "true";
      const cachedLogo = localStorage.getItem("zotek-logo-url");
      const cachedMembretada = localStorage.getItem("zotek-membretada-url");
      const cachedClinica = localStorage.getItem("zotek-nombre-clinica");

      setPrimaryColor(cachedPrimary);
      setIsDarkMode(cachedDark);
      if (cachedLogo) setLogoUrl(cachedLogo);
      if (cachedMembretada) setMembretadaUrl(cachedMembretada);
      if (cachedClinica) setNombreClinica(cachedClinica);

      // Aplicar tema al DOM inmediatamente
      const newTheme = generateTheme(cachedPrimary, cachedDark);
      setTheme(newTheme);
      applyThemeToDOM(newTheme, cachedDark);
    } catch (e) {
      // SSR o localStorage no disponible — usar defaults
    }
  }, []);

  // Paso 2: Cargar configuración desde Supabase (async, en background)
  useEffect(() => {
    async function fetchBranding() {
      const { data: { session } } = await supabase.auth.getSession();
      
      let savedPrimary = localStorage.getItem("zotek-primary") || DEFAULT_PRIMARY;
      let savedDark = localStorage.getItem("zotek-dark") === "true";

      if (session) {
        const { data: branding } = await supabase
          .from("configuracion_branding")
          .select("*")
          .eq("terapeuta_id", session.user.id)
          .single();

        if (branding) {
          savedPrimary = branding.color_primario || savedPrimary;
          savedDark = branding.modo_oscuro ?? savedDark;
          setLogoUrl(branding.logo_url);
          setMembretadaUrl(branding.membretada_url);
          setNombreClinica(branding.nombre_clinica || "");

          // Cachear en localStorage para evitar parpadeos en navegación
          if (branding.logo_url) localStorage.setItem("zotek-logo-url", branding.logo_url);
          if (branding.membretada_url) localStorage.setItem("zotek-membretada-url", branding.membretada_url);
          if (branding.nombre_clinica) localStorage.setItem("zotek-nombre-clinica", branding.nombre_clinica);
        }
      }

      setPrimaryColor(savedPrimary);
      setIsDarkMode(savedDark);
      setIsLoaded(true);
    }

    fetchBranding();
  }, []);

  // Paso 3: Re-aplicar tema cuando cambian las preferencias (toggle, etc.)
  useEffect(() => {
    const newTheme = generateTheme(primaryColor, isDarkMode);
    setTheme(newTheme);
    applyThemeToDOM(newTheme, isDarkMode);

    // Persistir localmente
    localStorage.setItem("zotek-primary", primaryColor);
    localStorage.setItem("zotek-dark", String(isDarkMode));
  }, [primaryColor, isDarkMode]);

  const toggleDarkMode = useCallback(async () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase
        .from("configuracion_branding")
        .update({ modo_oscuro: nextDark })
        .eq("terapeuta_id", session.user.id);
    }
  }, [isDarkMode]);

  const updateBranding = useCallback(async (hex: string) => {
    setPrimaryColor(hex);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { error } = await supabase
        .from("configuracion_branding")
        .update({ color_primario: hex })
        .eq("terapeuta_id", session.user.id);
      
      if (error) throw error;
    }
  }, []);

  const setPrimary = useCallback((hex: string) => {
    setPrimaryColor(hex);
  }, []);

  return {
    theme,
    isDarkMode,
    toggleDarkMode,
    setPrimary: setPrimaryColor,
    updateBranding,
    primaryColor,
    logoUrl,
    membretadaUrl,
    nombreClinica,
    setLogoUrl,
    setMembretadaUrl,
    setNombreClinica,
    isLoaded
  };
}

// Función auxiliar: aplicar tema al DOM
function applyThemeToDOM(theme: ThemeColor, isDark: boolean) {
  const root = document.documentElement;

  root.style.setProperty("--color-primary", theme.primary);
  root.style.setProperty("--color-primary-light", theme.primaryLight);
  root.style.setProperty("--color-primary-dark", theme.primaryDark);
  root.style.setProperty("--color-secondary", theme.secondary);
  root.style.setProperty("--color-accent", theme.accent);
  root.style.setProperty("--color-background", theme.background);
  root.style.setProperty("--color-surface", theme.surface);
  root.style.setProperty("--color-text", theme.text);
  root.style.setProperty("--color-text-muted", theme.textMuted);
  root.style.setProperty("--color-border", theme.border);

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  document.body.style.backgroundColor = theme.background;
  document.body.style.color = theme.text;
}

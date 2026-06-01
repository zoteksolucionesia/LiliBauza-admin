"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Header } from "@/components/admin";
import { colors } from "@/lib/theme";
import { useAuth } from "@/hooks/useAuth";

// La gestión de citas vive 100% en el portal SaaS de Zotek (zotek-ia.web.app/portal).
// El CRM solo lo embebe. El terapeuta, ya autenticado en el CRM, entra al portal
// sin volver a loguearse: pedimos un token SSO firmado a /api/portal-token y lo
// pasamos al portal vía ?sso=<token>.
const PORTAL_BASE_URL = "https://zotek-ia.web.app/portal/";

export default function CitasPage() {
  useAuth();
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // El portal hereda la identidad visual del CRM: el color de branding del
    // terapeuta (acento) y el modo claro/oscuro. El fondo violeta-cian es del SaaS.
    const brandingParams = () => {
      const accent = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary").trim();
      const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const parts: string[] = [`theme=${theme}`];
      if (/^#[0-9a-fA-F]{6}$/.test(accent)) parts.push(`accent=${encodeURIComponent(accent)}`);
      return parts.join("&");
    };

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("Sesión no encontrada. Vuelve a iniciar sesión.");
          return;
        }
        const resp = await fetch("/api/portal-token", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        const data = await resp.json();
        if (cancelled) return;
        const branding = brandingParams();
        if (!resp.ok || !data.token) {
          // Sin SSO disponible, abrimos el portal igual (pedirá su propio login).
          setIframeSrc(`${PORTAL_BASE_URL}?${branding}`);
          return;
        }
        setIframeSrc(`${PORTAL_BASE_URL}?sso=${encodeURIComponent(data.token)}&${branding}`);
      } catch {
        if (!cancelled) setIframeSrc(`${PORTAL_BASE_URL}?${brandingParams()}`);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: colors.background }}>
      <Header title="Citas" subtitle="Gestión de agenda, leads y horarios (portal Zotek)" />

      <div className="flex-1 px-4 pb-4 min-h-0">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm" style={{ color: colors.textMuted }}>{error}</p>
          </div>
        ) : !iframeSrc ? (
          <div className="flex items-center justify-center h-full">
            <div
              className="w-10 h-10 rounded-full animate-spin"
              style={{ border: `3px solid ${colors.primary}`, borderTopColor: "transparent" }}
            />
          </div>
        ) : (
          <iframe
            src={iframeSrc}
            title="Portal de Citas Zotek"
            className="w-full h-full rounded-xl border"
            style={{ borderColor: `${colors.primary}33`, minHeight: "calc(100vh - 140px)" }}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>
    </div>
  );
}

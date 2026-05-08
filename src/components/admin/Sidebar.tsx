"use client";

import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { colors } from "@/lib/theme";
import { useTheme } from "@/hooks/useTheme";

const navItems = [
  { id: "configuracion", label: "Configuración", icon: "⚙️", href: "/admin/configuracion" },
  { id: "dashboard", label: "Dashboard", icon: "🏠", href: "/admin/dashboard" },
  { id: "pacientes", label: "Pacientes", icon: "👥", href: "/admin/pacientes" },
  { id: "documentos", label: "Documentos", icon: "📄", href: "/admin/documentos" },
  { id: "tests", label: "Tests", icon: "📊", href: "/admin/tests" },
  { id: "citas", label: "Citas", icon: "📅", href: "/admin/citas" },
];

interface SidebarProps {
  onLogout?: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleDarkMode, isDarkMode, logoUrl } = useTheme();

  async function handleLogout() {
    if (onLogout) {
      onLogout();
      return;
    }
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <aside
      className="w-20 md:w-56 min-h-screen flex flex-col py-6 px-2 md:px-4 shadow-lg flex-shrink-0 transition-colors duration-300"
      style={{ backgroundColor: colors.surface }}
    >
      {/* Logo principal del terapeuta */}
      <div className="flex justify-center mb-6 px-4">
        <img 
          src={logoUrl || "/logo.png"} 
          alt="Clinic Logo" 
          className="w-full h-auto max-h-28 object-contain" 
        />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <a
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm group"
              style={{
                backgroundColor: isActive ? colors.primaryLight : "transparent",
                color: isActive ? colors.text : colors.textMuted,
                borderLeft: isActive ? `3px solid ${colors.primary}` : "3px solid transparent",
              }}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <span className="hidden md:block">{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Tema - Dark Mode Toggle */}
      <div className="mt-2 mb-2 px-2">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm"
          style={{ 
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.textMuted,
            border: `1px solid ${colors.border}`,
          }}
        >
          <span className="text-xl flex-shrink-0">{isDarkMode ? "☀️" : "🌙"}</span>
          <span className="hidden md:block">{isDarkMode ? "Modo Claro" : "Modo Oscuro"}</span>
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm group"
        style={{ color: colors.textMuted }}
      >
        <span className="text-xl flex-shrink-0 transition-transform group-hover:scale-110">🚪</span>
        <span className="hidden md:block">Cerrar Sesión</span>
      </button>

      {/* Zotek Signature */}
      <div className="mt-4 flex justify-center opacity-60 hover:opacity-100 transition-opacity">
        <a href="https://zotek.com.mx" target="_blank" rel="noopener noreferrer">
          <img src="/images/logo_zotek_principal.svg" alt="Powered by Zotek" className="h-5 object-contain filter grayscale invert brightness-0" />
        </a>
      </div>
    </aside>
  );
}

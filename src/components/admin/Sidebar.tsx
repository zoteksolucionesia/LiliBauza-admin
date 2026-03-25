"use client";

import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { colors } from "@/lib/theme";

const navItems = [
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
      className="w-20 md:w-56 min-h-screen flex flex-col py-6 px-2 md:px-4 shadow-lg flex-shrink-0"
      style={{ backgroundColor: colors.surface }}
    >
      {/* Logo principal — plano, sin círculo ni sombra */}
      <div className="flex justify-center mb-6">
        <img src="/logo.png" alt="Logo" className="w-28 h-28 object-contain" />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <a
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm"
              style={{
                backgroundColor: isActive ? `${colors.primary}22` : "transparent",
                color: isActive ? colors.primaryDark : colors.textMuted,
                borderLeft: isActive ? `3px solid ${colors.primary}` : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = `${colors.primary}11`;
                  e.currentTarget.style.color = colors.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = colors.textMuted;
                }
              }}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <span className="hidden md:block">{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Logo Terhfam — arriba de Cerrar Sesión */}
      <div className="flex justify-center mb-2 mt-4">
        <img src="/logo_terhfam.png" alt="Logo Terhfam" className="w-28 h-28 object-contain" />
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm"
        style={{ color: colors.textMuted }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${colors.accent}22`;
          e.currentTarget.style.color = colors.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = colors.textMuted;
        }}
      >
        <span className="text-xl flex-shrink-0">🚪</span>
        <span className="hidden md:block">Cerrar Sesión</span>
      </button>
      {/* Zotek Signature */}
      <div className="mt-4 flex justify-center opacity-70 hover:opacity-100 transition-opacity">
        <a href="https://zotek.com.mx" target="_blank" rel="noopener noreferrer">
          <img src="/images/logo_zotek_principal.svg" alt="Powered by Zotek" className="h-6 object-contain filter drop-shadow-sm" />
        </a>
      </div>
    </aside>
  );
}

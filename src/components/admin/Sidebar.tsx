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
  active: string;
  onLogout?: () => void;
}

export function Sidebar({ active, onLogout }: SidebarProps) {
  const router = useRouter();

  async function handleLogout() {
    if (onLogout) {
      onLogout();
      return;
    }
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <aside
      className="w-20 md:w-56 min-h-screen flex flex-col py-6 px-2 md:px-4 shadow-lg flex-shrink-0"
      style={{ backgroundColor: colors.surface }}
    >
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div
          className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center p-1"
          style={{ boxShadow: `0 4px 12px -2px rgba(212,165,165,0.5)`, backgroundColor: colors.surface }}
        >
          <img src="/api/logo?v=6" alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = active === item.id;
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

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm mt-4"
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
      <div className="mt-8 flex justify-center opacity-70 hover:opacity-100 transition-opacity">
        <a href="https://zotek.com.mx" target="_blank" rel="noopener noreferrer">
          <img src="/images/logo_zotek_principal.svg" alt="Powered by Zotek" className="h-6 object-contain filter drop-shadow-sm" />
        </a>
      </div>
    </aside>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/admin";

const colors = {
  primary: "#D4A5A5",
  primaryLight: "#E8C4C4",
  primaryDark: "#B88B8B",
  background: "#FDF8F8",
  surface: "#FFFFFF",
  text: "#3D2929",
  textMuted: "#7D6B6B",
};

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
}

export function Header({ title, subtitle, showBack = true, backTo = "/admin/dashboard" }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="shadow" style={{ backgroundColor: colors.surface }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo con fondo blanco */}
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: colors.surface, boxShadow: `0 8px 16px -4px rgba(0, 0, 0, 0.15)` }}
            >
              <img
                src="/api/logo?v=6"
                alt="LiliBauza Logo"
                className="w-28 h-28 object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{ color: colors.textMuted }}>{subtitle}</p>
              )}
            </div>
          </div>
          {showBack && (
            <Button onClick={() => router.push(backTo)} variant="ghost">
              ← Volver al Dashboard
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

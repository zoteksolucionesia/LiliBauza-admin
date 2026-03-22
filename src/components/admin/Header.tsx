"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/admin";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
}

export function Header({ title, subtitle, showBack = true, backTo = "/admin/dashboard" }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="shadow bg-card">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo con fondo blanco */}
            <div className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden bg-card shadow-[0_8px_16px_-4px_rgba(0,0,0,0.15)]">
              <img
                src="/api/logo?v=6"
                alt="LiliBauza Logo"
                className="w-28 h-28 object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground">{subtitle}</p>
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

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/admin";
import { colors } from "@/lib/theme";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
}

export function Header({ title, subtitle, showBack = true, backTo = "/admin/dashboard" }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="shadow-sm" style={{ backgroundColor: colors.surface }}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm mt-0.5" style={{ color: colors.textMuted }}>
                {subtitle}
              </p>
            )}
          </div>
          {showBack && (
            <Button onClick={() => router.push(backTo)} variant="ghost">
              ← Volver
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

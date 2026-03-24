"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Header, Sidebar, Button } from "@/components/admin";
import { colors } from "@/lib/theme";
import { useAuth } from "@/hooks/useAuth";

export default function AdminDashboard() {
  const router = useRouter();
  const { loading } = useAuth();
  const [stats, setStats] = useState({
    pacientes: 0,
    documentos: 0,
    tests: 0,
    citas: 0,
  });

  useEffect(() => {
    if (!loading) loadStats();
  }, [loading]);

  async function loadStats() {
    const [{ count: pacientesCount }, { count: documentosCount }, { count: testsCount }, { count: citasCount }] =
      await Promise.all([
        supabase.from("pacientes").select("*", { count: "exact", head: true }),
        supabase.from("documentos").select("*", { count: "exact", head: true }),
        supabase.from("tests").select("*", { count: "exact", head: true }),
        supabase.from("citas").select("*", { count: "exact", head: true }),
      ]);

    setStats({
      pacientes: pacientesCount || 0,
      documentos: documentosCount || 0,
      tests: testsCount || 0,
      citas: citasCount || 0,
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden mx-auto mb-4"
            style={{ backgroundColor: colors.surface, boxShadow: `0 8px 16px -4px rgba(0, 0, 0, 0.15)` }}
          >
            <img src="/api/logo?v=5" alt="Logo" className="w-16 h-16 object-contain animate-pulse" />
          </div>
          <p style={{ color: colors.textMuted }}>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.background }}>
      <Sidebar active="dashboard" onLogout={handleLogout} />

      <div className="flex-1 flex flex-col">
        <Header title="Dashboard" subtitle="Mtra. Liliana Bauza" showBack={false} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Pacientes" value={stats.pacientes} href="/admin/pacientes" color={colors.primary} emoji="👥" />
            <StatCard title="Documentos" value={stats.documentos} href="/admin/documentos" color={colors.secondary} emoji="📄" />
            <StatCard title="Tests" value={stats.tests} href="/admin/tests" color={colors.accent} emoji="📊" />
            <StatCard title="Citas" value={stats.citas} href="/admin/citas" color={colors.primaryDark} emoji="📅" />
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl shadow p-6" style={{ backgroundColor: colors.surface }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text }}>
              Acciones Rápidas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickActionButton label="Nuevo Paciente" href="/admin/pacientes" icon="👤" />
              <QuickActionButton label="Nuevo Documento" href="/admin/documentos" icon="📄" />
              <QuickActionButton label="Crear Test" href="/admin/tests" icon="📋" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, href, color, emoji }: { title: string; value: number; href: string; color: string; emoji: string }) {
  return (
    <a
      href={href}
      className="rounded-2xl shadow p-6 hover:shadow-lg transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: colors.surface }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p style={{ color: colors.textMuted }} className="text-sm font-medium">{title}</p>
          <p className="text-4xl font-bold mt-1" style={{ color: colors.text }}>{value}</p>
        </div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}33` }}>
          <span className="text-2xl">{emoji}</span>
        </div>
      </div>
    </a>
  );
}

function QuickActionButton({ label, href, icon }: { label: string; href: string; icon: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-4 border-2 rounded-xl transition-all hover:shadow-md"
      style={{
        borderColor: `${colors.primary}44`,
        backgroundColor: colors.background,
        color: colors.text,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.primary;
        e.currentTarget.style.backgroundColor = colors.primaryLight;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${colors.primary}44`;
        e.currentTarget.style.backgroundColor = colors.background;
      }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </a>
  );
}
